export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Fetch all shipments for an order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('tt_order_shipment')
      .select(`
        *,
        laboratory:laboratory_id(id, name, address_city)
      `)
      .eq('order_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH: Update a shipment's status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { shipment_id } = body;

    if (!shipment_id) {
      return NextResponse.json({ error: 'shipment_id required' }, { status: 400 });
    }

    const updateData: any = {};

    // Handle return leg status update
    if (body.status) {
      updateData.status = body.status;
      if (body.tracking_number) updateData.tracking_number = body.tracking_number;
      if (body.tracking_url) updateData.tracking_url = body.tracking_url;
      if (body.return_label_url) updateData.return_label_url = body.return_label_url;
      if (['patient_sent', 'collected', 'in_transit'].includes(body.status)) {
        updateData.shipped_at = new Date().toISOString();
      }
      if (body.status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }
    }

    // Handle outbound leg status update
    if (body.outbound_status) {
      updateData.outbound_status = body.outbound_status;
      if (body.outbound_tracking_number) updateData.outbound_tracking_number = body.outbound_tracking_number;
      if (body.outbound_tracking_url) updateData.outbound_tracking_url = body.outbound_tracking_url;
      if (body.outbound_label_url) updateData.outbound_label_url = body.outbound_label_url;
      if (body.outbound_status === 'shipped') {
        updateData.outbound_shipped_at = new Date().toISOString();
      }
      if (body.outbound_status === 'delivered') {
        updateData.outbound_delivered_at = new Date().toISOString();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update fields provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tt_order_shipment')
      .update(updateData)
      .eq('id', shipment_id)
      .eq('order_id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Recalculate order status from shipments (only for return leg changes)
    if (body.status) {
      const { data: derivedStatus } = await supabase
        .rpc('fn_derive_order_status', { p_order_id: params.id });
      
      if (derivedStatus) {
        await supabase
          .from('tt_order')
          .update({ status: derivedStatus })
          .eq('id', params.id);
      }
    }

    return NextResponse.json({ success: true, shipment: data });
  } catch (err: any) {
    console.error('[Shipment] Update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
