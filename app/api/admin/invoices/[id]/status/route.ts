export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
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
    const newStatus = body.status;

    const validStatuses = ['issued', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Fetch current invoice
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select('id, invoice_number, total, gross_total, due_date, doctor_id, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Update status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'paid') updateData.paid_at = new Date().toISOString();
    if (newStatus === 'sent') updateData.sent_at = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .update(updateData)
      .eq('id', params.id);

    if (updateError) throw updateError;

    // If marking as SENT, notify the doctor
    if (newStatus === 'sent') {
      try {
        // Get doctor's user_id and name
        const { data: doctor, error: doctorError } = await supabaseAdmin
          .from('tt_doctor')
          .select('user_id, full_name, email')
          .eq('id', invoice.doctor_id)
          .single();

        if (doctorError) {
          console.error(`[Invoices] Failed to fetch doctor for notification:`, doctorError);
        }

        if (doctor?.user_id) {
          const totalStr = Number(invoice.total || invoice.gross_total || 0).toFixed(2);
          const dueDate = invoice.due_date || '';

          const { error: notifError } = await supabaseAdmin
            .from('tt_notification')
            .insert({
              user_id: doctor.user_id,
              type: 'invoice',
              notification_type: 'invoice_sent',
              title: 'New Invoice',
              message: `Invoice ${invoice.invoice_number} for €${totalStr} is ready. ${dueDate ? `Due date: ${dueDate}.` : ''}`,
              link: '/dashboard/invoices',
              is_read: false,
              metadata: {
                invoice_id: invoice.id,
                invoice_number: invoice.invoice_number,
                total: Number(totalStr),
              },
              reference_id: invoice.id,
              reference_type: 'invoice',
            });

          if (notifError) {
            console.error(`[Invoices] Notification insert failed:`, notifError);
          } else {
            console.log(`[Invoices] Notification sent to ${doctor.full_name} (${doctor.user_id}) for invoice ${invoice.invoice_number}`);
          }
        } else {
          console.warn(`[Invoices] No user_id found for doctor ${invoice.doctor_id} — notification skipped`);
        }
      } catch (notifError) {
        // Never fail the status update because of notification
        console.error('[Invoices] Notification error (non-fatal):', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      invoice_number: invoice.invoice_number,
    });
  } catch (error: any) {
    console.error('[Admin] Update invoice status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
