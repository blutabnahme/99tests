import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  try {
    const db = supabaseAdmin();

    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doctor } = await db.from('tt_doctor').select('id').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { data: result, error } = await db
      .from('tt_order_result')
      .select('file_path, file_name, visibility, order:order_id(doctor_id)')
      .eq('id', params.resultId)
      .in('visibility', ['doctor_and_patient', 'doctor_only'])
      .single();

    if (error || !result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Verify this doctor owns the order
    if ((result as any).order?.doctor_id !== doctor.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: signedUrlData, error: urlError } = await db.storage
      .from('order-results')
      .createSignedUrl(result.file_path, 3600);

    if (urlError || !signedUrlData) {
      return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl, file_name: result.file_name });
  } catch (error: any) {
    console.error('[Doctor Results Download] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
