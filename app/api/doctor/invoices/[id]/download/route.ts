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

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is a doctor and link to their ID
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 403 });
    }

    // Fetch the invoice, check ownership
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('tt_doctor_invoice')
      .select('file_path')
      .eq('id', params.id)
      .eq('doctor_id', doctor.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
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

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (error: any) {
    console.error('[Doctor] Download invoice error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
