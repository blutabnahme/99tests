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

    const [ordersResult, recItemsResult, invoicesResult, doctorsResult, labsResult] = await Promise.all([
      // Orders
      supabaseAdmin
        .from('tt_order')
        .select('id, display_id, recommendation_id, test_costs_total, service_fee_amount, shipping_cost, vat_amount, total, payment_method, status, created_at, doctor_id')
        .order('created_at', { ascending: false }),

      // Recommendation items (tests with lab info)
      supabaseAdmin
        .from('tt_recommendation_item')
        .select('id, recommendation_id, test_id, unit_price, lab_cost, lab_id, quantity, laboratory:lab_id(id, name)')
        .order('recommendation_id'),

      // Doctor invoices
      supabaseAdmin
        .from('tt_doctor_invoice')
        .select('id, invoice_number, total, gross_total, status, paid_at, sent_at, created_at, doctor_id, period_start, period_end')
        .order('created_at', { ascending: false }),

      // Doctors
      supabaseAdmin
        .from('tt_doctor')
        .select('id, full_name, practice_name'),

      // Laboratories
      supabaseAdmin
        .from('tt_laboratory')
        .select('id, name'),
    ]);

    // Build recommendation_id → order mapping for linking items to orders
    const recToOrder = new Map();
    (ordersResult.data || []).forEach((o: any) => {
      if (o.recommendation_id) {
        recToOrder.set(o.recommendation_id, o.id);
      }
    });

    // Enrich recommendation items with order_id
    const enrichedItems = (recItemsResult.data || []).map((item: any) => ({
      ...item,
      order_id: recToOrder.get(item.recommendation_id) || null,
    }));

    return NextResponse.json({
      orders: ordersResult.data || [],
      recommendation_items: enrichedItems,
      invoices: invoicesResult.data || [],
      doctors: doctorsResult.data || [],
      laboratories: labsResult.data || [],
    });
  } catch (error: any) {
    console.error('[Financial] API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
