import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runOrderPreparation } from '@/lib/order-preparation';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const supabase = getSupabaseAdmin();

    // Verify order exists
    const { data: order, error: orderErr } = await supabase
      .from('tt_order')
      .select('id, status, recommendation_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Run the full preparation pipeline
    const result = await runOrderPreparation(orderId);

    return NextResponse.json({
      success: result.success,
      errors: result.errors,
      message: result.success
        ? 'Pipeline completed successfully'
        : 'Pipeline completed with errors',
    });

  } catch (err: any) {
    console.error('[Pipeline Rerun] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Pipeline execution failed' },
      { status: 500 }
    );
  }
}
