export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();
    const { status } = body;

    const validTransitions: Record<string, string[]> = {
      'preparing': ['kit_shipped'],
      'kit_shipped': ['at_lab'],
      'at_lab': ['completed', 'results_ready'],
    };

    const { data: order } = await supabase
      .from('tt_order')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ 
        error: `Cannot transition from "${order.status}" to "${status}"` 
      }, { status: 400 });
    }

    console.log('[Order Status] Transitioning order', params.id, 'from', order.status, 'to', status);

    const { error } = await supabase
      .from('tt_order')
      .update({ status })
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Order Status] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
