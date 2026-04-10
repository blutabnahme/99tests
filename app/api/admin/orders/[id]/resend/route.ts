export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Fetch all resends for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tt_order_resend')
      .select('*')
      .eq('order_id', params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Create a new resend
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    // Validate order exists
    const { data: order, error: orderErr } = await supabase
      .from('tt_order')
      .select('id, display_id, status, patient_id')
      .eq('id', params.id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Create resend record
    const { data: resend, error: resendErr } = await supabase
      .from('tt_order_resend')
      .insert({
        order_id: params.id,
        reason: body.reason,
        notes: body.notes || null,
        materials: body.materials || [],
        failed_tests: body.failed_tests || [],
        status: 'created',
        // Mock DHL for now
        new_dhl_tracking: `RESEND-${order.display_id}-${Date.now().toString(36).toUpperCase()}`,
        new_dhl_label_url: null,
      })
      .select()
      .single();

    if (resendErr) throw resendErr;

    // Create shipments for the resend (one per lab)
    // Group failed tests by lab
    const failedTests = body.failed_tests || [];
    const resendMaterials = body.materials || [];
    
    // Fetch test details to get lab associations
    const testIds = failedTests.map((t: any) => t.test_id).filter(Boolean);
    let labTestMap = new Map<string, { lab_id: string; lab_name: string; tests: any[]; materials: any[] }>();
    
    if (testIds.length > 0) {
      const { data: testDetails } = await supabase
        .from('tt_test_catalog')
        .select('id, name, sku, lab:lab_id(id, name)')
        .in('id', testIds);
      
      for (const test of (testDetails || [])) {
        const labId = (test.lab as any)?.id;
        const labName = (test.lab as any)?.name || 'Unknown';
        if (!labId) continue;
        
        if (!labTestMap.has(labId)) {
          labTestMap.set(labId, { lab_id: labId, lab_name: labName, tests: [], materials: [] });
        }
        labTestMap.get(labId)!.tests.push({
          test_id: test.id,
          test_name: test.name,
          test_sku: test.sku,
        });
      }
    }
    
    // If we couldn't map by test, use the original order's shipments to find the lab
    if (labTestMap.size === 0) {
      const { data: existingShipments } = await supabase
        .from('tt_order_shipment')
        .select('laboratory_id, shipping_method, laboratory:laboratory_id(id, name)')
        .eq('order_id', params.id)
        .is('resend_id', null)
        .limit(1);
      
      if (existingShipments && existingShipments.length > 0) {
        const ship = existingShipments[0];
        const labId = ship.laboratory_id;
        const labName = (ship.laboratory as any)?.name || 'Unknown';
        labTestMap.set(labId, {
          lab_id: labId,
          lab_name: labName,
          tests: failedTests,
          materials: resendMaterials,
        });
      }
    }
    
    // Determine shipping method from original shipments
    const { data: origShipments } = await supabase
      .from('tt_order_shipment')
      .select('shipping_method')
      .eq('order_id', params.id)
      .is('resend_id', null)
      .limit(1);
    const shippingMethod = origShipments?.[0]?.shipping_method || 'standard';
    
    // Create resend shipments
    const resendShipments = Array.from(labTestMap.values()).map(group => ({
      order_id: params.id,
      laboratory_id: group.lab_id,
      resend_id: resend.id,
      shipping_method: shippingMethod,
      status: shippingMethod === 'standard' ? 'pending' : 'awaiting_schedule',
      outbound_status: 'pending',
      tests: group.tests,
      materials: group.materials.length > 0 ? group.materials : resendMaterials,
    }));
    
    if (resendShipments.length > 0) {
      await supabase.from('tt_order_shipment').insert(resendShipments);
    }

    // Update order status if it was at_lab or completed
    if (['at_lab', 'completed', 'preparing'].includes(order.status)) {
      await supabase
        .from('tt_order')
        .update({ status: 'preparing' })
        .eq('id', params.id);
    }

    return NextResponse.json({ 
      success: true, 
      resend,
      message: `Resend created with tracking: ${resend.new_dhl_tracking}`
    });

  } catch (err: any) {
    console.error('[Resend] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update resend status (e.g., mark as shipped or received)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { resend_id, status } = body;

    if (!resend_id || !status) {
      return NextResponse.json({ error: 'resend_id and status required' }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (status === 'received') updateData.received_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tt_order_resend')
      .update(updateData)
      .eq('id', resend_id)
      .eq('order_id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Update parent order status based on resend lifecycle
    if (status === 'shipped') {
      await supabase
        .from('tt_order')
        .update({ status: 'kit_shipped' })
        .eq('id', params.id);
    }

    if (status === 'received') {
      await supabase
        .from('tt_order')
        .update({ status: 'at_lab' })
        .eq('id', params.id);
    }

    if (status === 'cancelled') {
      // Check if there are other active resends. If not, keep order at current status.
      const { data: activeResends } = await supabase
        .from('tt_order_resend')
        .select('id')
        .eq('order_id', params.id)
        .in('status', ['created', 'shipped'])
        .neq('id', resend_id);
      
      // If no other active resends, move order back to kit_shipped
      if (!activeResends || activeResends.length === 0) {
        await supabase
          .from('tt_order')
          .update({ status: 'kit_shipped' })
          .eq('id', params.id);
      }
    }

    return NextResponse.json({ success: true, resend: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
