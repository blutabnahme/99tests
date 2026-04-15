export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch the invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select('file_path')
      .eq('id', params.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.file_path) {
      return NextResponse.json({ error: 'Invoice PDF not generated' }, { status: 404 });
    }

    // Generate signed URL (valid for 5 minutes)
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from('invoices')
      .createSignedUrl(invoice.file_path, 300);

    if (signError || !signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
    }

    return NextResponse.redirect(signedUrl.signedUrl);
  } catch (error: any) {
    console.error('[Admin] Download invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
