export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { generateInvoicePdf, ServiceConfig, InvoiceInput } from '@/lib/invoice-generator';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const periodStart = searchParams.get('period_start');
    const periodEnd = searchParams.get('period_end');
    const doctorId = searchParams.get('doctor_id');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'list_doctors') {
      let query = supabaseAdmin
        .from('tt_order')
        .select('doctor_id, total, test_costs_total, service_fee_amount, doctor:doctor_id(id, full_name, practice_name)')
        .eq('payment_method', 'doctor_invoice')
        .is('invoice_id', null);

      if (periodStart && periodEnd) {
        query = query.gte('created_at', periodStart).lte('created_at', periodEnd);
      }

      const { data: orders } = await query;

      const doctorMap = new Map();
      (orders || []).forEach((order: any) => {
        const did = order.doctor_id;
        if (!doctorMap.has(did)) {
          doctorMap.set(did, {
            id: did,
            full_name: order.doctor?.full_name || 'Unknown',
            practice_name: order.doctor?.practice_name || '',
            order_count: 0,
            total: 0,
          });
        }
        const d = doctorMap.get(did);
        d.order_count += 1;
        d.total += Number(order.total || order.test_costs_total || 0);
      });

      return NextResponse.json({ doctors: Array.from(doctorMap.values()) });
    }

    if (action === 'list_orders') {
      const { data: orders } = await supabaseAdmin
        .from('tt_order')
        .select('*, patient:patient_id(id, first_name, last_name, email)')
        .eq('doctor_id', doctorId)
        .eq('payment_method', 'doctor_invoice')
        .is('invoice_id', null)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .order('created_at', { ascending: false });

      return NextResponse.json({ orders: orders || [] });
    }

    if (action === 'list_periods') {
      if (!doctorId) {
        return NextResponse.json({ error: 'doctor_id required' }, { status: 400 });
      }

      const { data: orders } = await supabaseAdmin
        .from('tt_order')
        .select('created_at, total, test_costs_total')
        .eq('doctor_id', doctorId)
        .eq('payment_method', 'doctor_invoice')
        .is('invoice_id', null)
        .order('created_at', { ascending: false });

      // Group by month
      const periodMap = new Map();
      (orders || []).forEach((order: any) => {
        const date = new Date(order.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const pStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const pEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

        if (!periodMap.has(key)) {
          periodMap.set(key, {
            key,
            period_start: pStart,
            period_end: pEnd,
            order_count: 0,
            total: 0,
          });
        }
        const p = periodMap.get(key);
        p.order_count += 1;
        p.total += Number(order.total || order.test_costs_total || 0);
      });

      // Sort by most recent first
      const periods = Array.from(periodMap.values()).sort((a: any, b: any) => b.key.localeCompare(a.key));

      return NextResponse.json({ periods });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Invoices GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


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

    // Find uninvoiced doctor-billed orders in the period or explicit IDs
    let ordersQuery = supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, recommendation_id, patient_id, doctor_id,
        test_costs_total, service_fee_amount, service_fee_pct, shipping_cost,
        vat_amount, vat_rate, subtotal, total, created_at,
        patient:patient_id(first_name, last_name)
      `)
      .eq('payment_method', 'doctor_invoice')
      .is('invoice_id', null);

    if (body.action === 'generate_single' && body.order_ids && Array.isArray(body.order_ids)) {
      ordersQuery = ordersQuery.in('id', body.order_ids);
      if (body.doctor_id) {
        ordersQuery = ordersQuery.eq('doctor_id', body.doctor_id);
      }
    } else {
      ordersQuery = ordersQuery
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery.order('created_at', { ascending: true });

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

    // Get the config
    const { data: config } = await supabaseAdmin
      .from('tt_service_config')
      .select('*')
      .single();

    let invoiceCounter = config?.invoice_counter || 0;

    const serviceConfig: ServiceConfig = {
      company_name: config?.company_name || 'Wir sind Immun GmbH',
      company_street: config?.company_street || 'Musterstraße 1',
      company_zip_city: config?.company_zip_city || '60311 Frankfurt am Main',
      company_country: config?.company_country || 'Deutschland',
      company_email: config?.company_email || 'info@99tests.de',
      company_website: config?.company_website || 'www.99tests.de',
      company_registry: config?.company_registry || 'Amtsgericht Frankfurt',
      company_ust_id: config?.company_ust_id || '',
      company_tax_id: config?.company_tax_id || '',
      company_bank_name: config?.company_bank_name || '',
      bank_iban: config?.bank_iban || '',
      bank_bic: config?.bank_bic || '',
      company_ceo: config?.company_ceo || '',
      invoice_footer_text: config?.invoice_footer_text || '',
    };
    
    const invoicePrefix = config?.invoice_prefix || 'INV-';

    const doctorIds = Array.from(doctorGroups.keys());
    const { data: doctorsData, error: doctorsError } = await supabaseAdmin
      .from('tt_doctor')
      .select('id, user_id, full_name, practice_name, email')
      .in('id', doctorIds);

    if (doctorsError) {
      console.error('[Invoices] Failed to fetch doctor details:', doctorsError);
    }

    const doctorDetailsMap = new Map();
    if (doctorsData && doctorsData.length > 0) {
      doctorsData.forEach((d: any) => doctorDetailsMap.set(d.id, d));
    }

    console.log(`[Invoices] Doctor lookup: ${doctorIds.length} IDs requested, ${doctorDetailsMap.size} found`);
    
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
      const invoiceNumber = `${invoicePrefix}${String(invoiceCounter).padStart(5, '0')}`;

      const docDetails = doctorDetailsMap.get(doctorId);
      if (!docDetails) {
        console.error(`[Invoices] SKIPPING invoice for doctor ${doctorId} — doctor not found in database`);
        continue;
      }

      let dueDate: string;
      if (body.custom_due_date) {
        dueDate = new Date(body.custom_due_date).toISOString();
      } else {
        const dueDateObj = new Date();
        dueDateObj.setDate(dueDateObj.getDate() + (config?.invoice_payment_terms_days || 14));
        dueDate = dueDateObj.toISOString();
      }

      const lineItems = doctorOrders.map((order: any) => ({
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

      const invoiceInput: InvoiceInput = {
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(),
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        due_date: dueDate,
        doctor: docDetails,
        items: lineItems,
        test_costs: subtotal,
        service_fee_total: serviceFeeTotal,
        shipping_total: shippingTotal,
        subtotal: subtotal + serviceFeeTotal + shippingTotal, // Gross without VAT
        vat_rate: Number(doctorOrders[0]?.vat_rate || 19),
        vat_amount: vatTotal,
        total: total
      };

      let uploadedFilePath = '';
      try {
        const pdfBytes = generateInvoicePdf(invoiceInput, serviceConfig);
        const fileName = `${doctorId}/${invoiceNumber}.pdf`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('invoices')
          .upload(fileName, Buffer.from(pdfBytes), {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error(`[Invoices] Failed to upload PDF for invoice ${invoiceNumber}:`, uploadError);
        } else {
          uploadedFilePath = fileName;
        }
      } catch (pdfErr) {
        console.error(`[Invoices] Failed to generate PDF for invoice ${invoiceNumber}:`, pdfErr);
      }

      const grossTotal = total;
      const netTotal = subtotal + serviceFeeTotal + shippingTotal;

      const invoiceRecord = {
        doctor_id: doctorId,
        invoice_number: invoiceNumber,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.split('T')[0],
        subtotal: subtotal,
        service_fee_total: serviceFeeTotal,
        shipping_total: shippingTotal,
        net_total: netTotal,
        vat_rate: Number(doctorOrders[0]?.vat_rate || 19),
        vat_total: vatTotal,
        gross_total: grossTotal,
        total: grossTotal,
        line_items: lineItems,
        company_snapshot: {
          company_name: serviceConfig.company_name,
          company_street: serviceConfig.company_street,
          company_zip_city: serviceConfig.company_zip_city,
          company_country: serviceConfig.company_country,
          company_tax_id: serviceConfig.company_tax_id,
          company_ust_id: serviceConfig.company_ust_id,
          company_bank_name: serviceConfig.company_bank_name,
          bank_iban: serviceConfig.bank_iban,
          bank_bic: serviceConfig.bank_bic,
          company_ceo: serviceConfig.company_ceo,
          company_registry: serviceConfig.company_registry,
        },
        doctor_snapshot: {
          full_name: docDetails.full_name,
          practice_name: docDetails.practice_name,
          email: docDetails.email,
        },
        file_path: uploadedFilePath || null,
        file_name: `${invoiceNumber}.pdf`,
        status: body.action === 'generate_single' ? 'issued' : 'sent',
        sent_at: body.action === 'generate_single' ? null : new Date().toISOString(),
      };

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('tt_doctor_invoice')
        .insert(invoiceRecord)
        .select()
        .single();

      if (invoiceError || !invoice) {
        console.error(`[Invoices] Failed to create invoice for doctor ${doctorId}:`, invoiceError);
        continue;
      }

      // Link orders to this invoice
      const orderIds = lineItems.map((item: any) => item.order_id);
      await supabaseAdmin
        .from('tt_order')
        .update({ invoice_id: invoice.id })
        .in('id', orderIds);

      // Notify doctor only for auto-sent invoices (cron/system)
      // Manual invoices will notify when admin clicks "Mark as Sent"
      if (body.action !== 'generate_single' && docDetails.user_id) {
        try {
          const totalStr = Number(grossTotal || 0).toFixed(2);
          await supabaseAdmin
            .from('tt_notification')
            .insert({
              user_id: docDetails.user_id,
              type: 'invoice',
              notification_type: 'invoice_sent',
              title: 'New Invoice',
              message: `Invoice ${invoiceNumber} for €${totalStr} is ready. ${dueDate ? `Due date: ${dueDate.split('T')[0]}.` : ''}`,
              link: '/dashboard/invoices',
              is_read: false,
              metadata: {
                invoice_id: invoice.id,
                invoice_number: invoiceNumber,
                total: grossTotal,
              },
              reference_id: invoice.id,
              reference_type: 'invoice',
            });
          console.log(`[Invoices] Auto-notification sent to ${docDetails.full_name} for ${invoiceNumber}`);
        } catch (notifError) {
          console.error('[Invoices] Failed to create auto-notification:', notifError);
        }
      }

      invoicesCreated.push({
        invoice_id: invoice.id,
        invoice_number: invoiceNumber,
        doctor_id: doctorId,
        orders_count: doctorOrders.length,
        total: total,
        gross_total: grossTotal,
        net_total: netTotal,
        vat_total: vatTotal,
      });
    }

    // Update the invoice counter
    await supabaseAdmin
      .from('tt_service_config')
      .update({ invoice_counter: invoiceCounter })
      .not('id', 'is', null); // update all rows (single-row table)

    if (body.action === 'generate_single' && invoicesCreated.length > 0) {
      const inv = invoicesCreated[0];
      return NextResponse.json({
        success: true,
        invoice_id: inv.invoice_id,
        invoice_number: inv.invoice_number,
        gross_total: inv.gross_total,
        net_total: inv.net_total,
        vat_total: inv.vat_total,
        orders_count: inv.orders_count,
        invoices_created: 1,
      });
    }

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
