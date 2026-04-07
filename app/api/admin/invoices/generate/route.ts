export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json().catch(() => ({}));

    // Determine period — default to previous month
    let periodStart: Date;
    let periodEnd: Date;

    if (body.period_start && body.period_end) {
      periodStart = new Date(body.period_start);
      periodEnd = new Date(body.period_end);
    } else {
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    // Check if called from cron (no auth needed) or admin (auth needed)
    const isCron = request.headers.get('x-cron-secret') === process.env.CRON_SECRET;

    if (!isCron) {
      const supabaseClient = createServerSupabaseClient();
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !user || user.user_metadata?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Find all uninvoiced doctor-billed orders in the period
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, recommendation_id, patient_id, doctor_id,
        test_costs_total, service_fee_amount, service_fee_pct, shipping_cost,
        vat_amount, vat_rate, subtotal, total, created_at,
        patient:patient_id(first_name, last_name)
      `)
      .eq('payment_method', 'doctor_invoice')
      .is('invoice_id', null)
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString())
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        message: 'No uninvoiced orders found for this period',
        invoices_created: 0,
      });
    }

    // Group orders by doctor
    const doctorGroups = new Map<string, any[]>();
    for (const order of orders) {
      const docId = order.doctor_id;
      if (!doctorGroups.has(docId)) doctorGroups.set(docId, []);
      doctorGroups.get(docId)!.push(order);
    }

    // Get the invoice counter
    const { data: config } = await supabaseAdmin
      .from('tt_service_config')
      .select('invoice_counter')
      .single();

    let invoiceCounter = config?.invoice_counter || 0;
    const invoicesCreated: any[] = [];

    for (const [doctorId, doctorOrders] of Array.from(doctorGroups.entries())) {
      // Calculate totals
      const subtotal = doctorOrders.reduce((s: number, o: any) => s + (Number(o.test_costs_total) || 0), 0);
      const serviceFeeTotal = doctorOrders.reduce((s: number, o: any) => s + (Number(o.service_fee_amount) || 0), 0);
      const shippingTotal = doctorOrders.reduce((s: number, o: any) => s + (Number(o.shipping_cost) || 0), 0);
      const vatTotal = doctorOrders.reduce((s: number, o: any) => s + (Number(o.vat_amount) || 0), 0);
      const total = doctorOrders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);

      // Generate invoice number
      invoiceCounter++;
      const invoiceNumber = `INV-${String(invoiceCounter).padStart(5, '0')}`;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('tt_doctor_invoice')
        .insert({
          doctor_id: doctorId,
          invoice_number: invoiceNumber,
          status: 'draft',
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          subtotal: subtotal,
          service_fee_total: serviceFeeTotal,
          shipping_total: shippingTotal,
          vat_total: vatTotal,
          total: total,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error(`[Invoices] Failed to create invoice for doctor ${doctorId}:`, invoiceError);
        continue;
      }

      // Create line items
      const lineItems = doctorOrders.map((order: any) => ({
        invoice_id: invoice.id,
        order_id: order.id,
        display_id: order.display_id,
        recommendation_id: order.recommendation_id,
        patient_name: `${(order.patient as any)?.first_name || ''} ${(order.patient as any)?.last_name || ''}`.trim(),
        test_total: Number(order.test_costs_total) || 0,
        service_fee: Number(order.service_fee_amount) || 0,
        shipping: Number(order.shipping_cost) || 0,
        vat: Number(order.vat_amount) || 0,
        line_total: Number(order.total) || 0,
        created_at: order.created_at,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('tt_doctor_invoice_item')
        .insert(lineItems);

      if (itemsError) {
        console.error(`[Invoices] Failed to create line items for invoice ${invoiceNumber}:`, itemsError);
      }

      // Link orders to this invoice
      const orderIds = doctorOrders.map((o: any) => o.id);
      await supabaseAdmin
        .from('tt_order')
        .update({ invoice_id: invoice.id })
        .in('id', orderIds);

      invoicesCreated.push({
        invoice_number: invoiceNumber,
        doctor_id: doctorId,
        orders_count: doctorOrders.length,
        total: total,
      });
    }

    // Update the invoice counter
    await supabaseAdmin
      .from('tt_service_config')
      .update({ invoice_counter: invoiceCounter })
      .not('id', 'is', null); // update all rows (single-row table)

    return NextResponse.json({
      message: `Generated ${invoicesCreated.length} invoice(s)`,
      invoices_created: invoicesCreated.length,
      invoices: invoicesCreated,
      period: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
    });
  } catch (error: any) {
    console.error('[Invoices] Generation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
