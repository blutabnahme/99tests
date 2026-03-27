export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [payResult, caseResult, refundResult] = await Promise.all([
      supabaseAdmin
        .from('payment')
        .select('id, patient_amount, vat_amount, bc_payout, platform_commission, b2b_fee, material_revenue, logistics_revenue, currency, status, created_at, paid_at, recommendation_id')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('recommendation')
        .select(`
          id, status, created_at, estimated_fees, mobility,
          patient:patient_id (address),
          doctor_practice:doctor_id (name, id),
          case_application ( id, status, bc_id, blood_collector:bc_id (id, first_name, last_name, rating) )
        `)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('refund')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    return NextResponse.json({
      payments: payResult.data || [],
      recommendations: caseResult.data || [],
      refunds: refundResult.data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
