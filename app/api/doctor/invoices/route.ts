export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get doctor
    const { data: doctor } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    // Fetch invoices with items
    const { data: invoices, error } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select(`
        *,
        items:tt_doctor_invoice_item(*)
      `)
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch uninvoiced doctor-billed orders
    const { data: pendingOrders } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, recommendation_id, total, test_costs_total, service_fee_amount, shipping_cost, vat_amount, 
        created_at, status,
        patient:patient_id(first_name, last_name),
        recommendation:recommendation_id(display_id)
      `)
      .eq('doctor_id', doctor.id)
      .eq('payment_method', 'doctor_invoice')
      .is('invoice_id', null)
      .order('created_at', { ascending: false });

    const pendingTotal = (pendingOrders || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Calculate summary stats
    const totalOutstanding = (invoices || [])
      .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    const totalPaid = (invoices || [])
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    const totalInvoices = (invoices || []).length;

    return NextResponse.json({
      invoices: invoices || [],
      pending_orders: pendingOrders || [],
      summary: {
        total_outstanding: totalOutstanding,
        total_paid: totalPaid,
        total_invoices: totalInvoices,
        pending_total: pendingTotal,
        pending_count: (pendingOrders || []).length,
      },
    });
  } catch (error: any) {
    console.error('GET doctor invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
