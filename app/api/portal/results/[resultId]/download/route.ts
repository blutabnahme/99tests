import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = await validateSession(sessionToken);
    if (!patientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the result and verify it belongs to this patient's order
    const { data: result, error } = await supabaseAdmin
      .from('tt_order_result')
      .select('file_path, file_name, order:order_id(patient_id)')
      .eq('id', params.resultId)
      .in('visibility', ['doctor_and_patient', 'patient_only'])
      .eq('status', 'released')
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Verify patient owns this order
    if ((result as any).order?.patient_id !== patientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: signedUrlData, error: urlError } = await supabaseAdmin.storage
      .from('order-results')
      .createSignedUrl(result.file_path, 3600);

    if (urlError || !signedUrlData) {
      console.error('[Portal Results Download] URL error:', urlError);
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl, file_name: result.file_name });
  } catch (error: any) {
    console.error('[Portal Results Download] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
