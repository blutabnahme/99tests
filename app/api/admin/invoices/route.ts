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

    const { data: invoices, error } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select(`
        *,
        doctor:doctor_id(id, full_name, practice_name, email),
        items:tt_doctor_invoice_item(*)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ data: invoices || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const { action } = body;

    if (action === 'generate') {
      const { period_start, period_end } = body;
      if (!period_start || !period_end) {
        return NextResponse.json({ error: 'period_start and period_end required' }, { status: 400 });
      }

      // Find all doctor-billed orders in the period that aren't yet invoiced
      const { data: orders, error: ordersErr } = await supabaseAdmin
        .from('tt_order')
        .select(`
          id, display_id, total, test_costs, service_fee, shipping_cost, vat, 
          doctor_id, patient_id, created_at, recommendation_id,
          patient:patient_id(first_name, last_name),
          recommendation:recommendation_id(display_id)
        `)
        .eq('payment_method', 'doctor_invoice')
        .gte('created_at', `${period_start}T00:00:00Z`)
        .lte('created_at', `${period_end}T23:59:59Z`)
        .is('invoice_id', null);

      if (ordersErr) throw ordersErr;

      if (!orders || orders.length === 0) {
        return NextResponse.json({ message: 'No uninvoiced doctor-billed orders found in this period', invoices_created: 0 });
      }

      // Group by doctor_id
      const grouped = new Map<string, any[]>();
      orders.forEach(o => {
        const key = o.doctor_id;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(o);
      });

      const createdInvoices: any[] = [];

      for (const [doctorId, doctorOrders] of Array.from(grouped.entries())) {
        // Get next invoice number
        const { data: configData } = await supabaseAdmin
          .from('tt_service_config')
          .select('invoice_counter')
          .limit(1)
          .single();

        const nextCounter = (configData?.invoice_counter || 0) + 1;
        const invoiceNumber = `INV-${String(nextCounter).padStart(5, '0')}`;

        // Calculate totals
        let subtotal = 0;
        let serviceFeeTotal = 0;
        let vatTotal = 0;
        let grandTotal = 0;

        const lineItems = doctorOrders.map(o => {
          const testTotal = Number(o.test_costs) || 0;
          const serviceFee = Number(o.service_fee) || 0;
          const shipping = Number(o.shipping_cost) || 0;
          const vat = Number(o.vat) || 0;
          const lineTotal = Number(o.total) || 0;

          subtotal += testTotal + shipping;
          serviceFeeTotal += serviceFee;
          vatTotal += vat;
          grandTotal += lineTotal;

          const pat = o.patient as any;
          return {
            order_id: o.id,
            recommendation_id: o.recommendation_id,
            patient_name: pat ? `${pat.first_name} ${pat.last_name}` : 'Unknown',
            display_id: o.display_id || (o.recommendation as any)?.display_id || '-',
            test_total: testTotal,
            service_fee: serviceFee,
            shipping: shipping,
            vat: vat,
            line_total: lineTotal,
          };
        });

        // Create invoice
        const { data: invoice, error: invErr } = await supabaseAdmin
          .from('tt_doctor_invoice')
          .insert({
            doctor_id: doctorId,
            invoice_number: invoiceNumber,
            period_start,
            period_end,
            status: 'draft',
            subtotal,
            service_fee_total: serviceFeeTotal,
            vat_total: vatTotal,
            total: grandTotal,
          })
          .select()
          .single();

        if (invErr) throw invErr;

        // Create line items
        const itemsToInsert = lineItems.map(li => ({
          ...li,
          invoice_id: invoice.id,
        }));

        await supabaseAdmin.from('tt_doctor_invoice_item').insert(itemsToInsert);

        // Update invoice counter
        await supabaseAdmin
          .from('tt_service_config')
          .update({ invoice_counter: nextCounter })
          .not('id', 'is', null);

        // Mark orders as invoiced (add invoice_id column reference)
        // We'll store the invoice reference on the order for tracking
        for (const o of doctorOrders) {
          await supabaseAdmin
            .from('tt_order')
            .update({ invoice_id: invoice.id })
            .eq('id', o.id);
        }

        createdInvoices.push({ ...invoice, items_count: lineItems.length });
      }

      return NextResponse.json({ success: true, invoices_created: createdInvoices.length, invoices: createdInvoices });
    }

    if (action === 'update_status') {
      const { invoice_id, status } = body;
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (status === 'paid') updates.paid_at = new Date().toISOString();
      if (status === 'sent') updates.sent_at = new Date().toISOString();

      const { error } = await supabaseAdmin
        .from('tt_doctor_invoice')
        .update(updates)
        .eq('id', invoice_id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
