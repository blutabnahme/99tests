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
        status: 'created',
        // Mock DHL for now
        new_dhl_tracking: `RESEND-${order.display_id}-${Date.now().toString(36).toUpperCase()}`,
        new_dhl_label_url: null,
      })
      .select()
      .single();

    if (resendErr) throw resendErr;

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
    return NextResponse.json({ success: true, resend: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
