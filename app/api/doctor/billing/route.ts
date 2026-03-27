export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hcId = session.user.id;

  try {
    // 1. Current Period Data
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: unbilledPayments } = await supabaseAdmin
      .from('payment')
      .select(`
         id, platform_commission, b2b_fee, material_revenue, logistics_revenue,
         recommendation!inner(id, doctor_id, created_at)
      `)
      .eq('recommendation.doctor_id', hcId)
      .is('doctor_invoice_id', null)
      .gte('recommendation.created_at', currentMonthStart);

    let casesCount = 0;
    let orgFeesTotal = 0;
    let shippingFeesTotal = 0;

    unbilledPayments?.forEach(p => {
       casesCount++;
       orgFeesTotal += Number(p.b2b_fee || 0);
       shippingFeesTotal += Number(p.material_revenue || 0) + Number(p.logistics_revenue || 0);
    });

    const subtotal = orgFeesTotal + shippingFeesTotal;
    const vatAmount = subtotal * 0.19; // 19% VAT mock
    const totalDue = subtotal + vatAmount;

    // 2. Historical Invoices
    const { data: pastInvoices } = await supabaseAdmin
      .from('doctor_invoice')
      .select('*')
      .eq('doctor_id', hcId)
      .order('period_end', { ascending: false });

    return NextResponse.json({
       current_period: {
         month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
         cases_count: casesCount,
         org_fees: orgFeesTotal,
         material_shipping: shippingFeesTotal,
         subtotal: subtotal,
         vat: vatAmount,
         total: totalDue
       },
       historical_invoices: pastInvoices || []
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
