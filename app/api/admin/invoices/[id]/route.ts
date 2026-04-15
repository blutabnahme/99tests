export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
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

    // Fetch invoice
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select('id, invoice_number, file_path, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Only allow deleting issued (draft) or cancelled invoices
    // Sent/paid invoices should not be deleted for audit reasons
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Cannot delete a paid invoice' }, { status: 400 });
    }

    // 1. Unlink orders
    const { error: unlinkError } = await supabaseAdmin
      .from('tt_order')
      .update({ invoice_id: null })
      .eq('invoice_id', invoice.id);

    if (unlinkError) {
      console.error('[Invoices] Failed to unlink orders:', unlinkError);
    }

    // 2. Delete PDF from storage
    if (invoice.file_path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('invoices')
        .remove([invoice.file_path]);

      if (storageError) {
        console.error('[Invoices] Failed to delete PDF from storage:', storageError);
      }
    }

    // 3. Delete related notifications
    try {
      await supabaseAdmin
        .from('tt_notification')
        .delete()
        .eq('reference_id', invoice.id)
        .eq('reference_type', 'invoice');
    } catch (notifErr) {
      console.error('[Invoices] Failed to delete notifications:', notifErr);
    }

    // 4. Delete the invoice record
    const { error: deleteError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .delete()
      .eq('id', invoice.id);

    if (deleteError) throw deleteError;

    console.log(`[Invoices] Invoice ${invoice.invoice_number} deleted by admin ${user.email}`);

    return NextResponse.json({
      success: true,
      invoice_number: invoice.invoice_number,
      message: `Invoice ${invoice.invoice_number} has been deleted.`,
    });
  } catch (error: any) {
    console.error('[Admin] Delete invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
