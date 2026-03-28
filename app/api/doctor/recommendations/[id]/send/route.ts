export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { data: rec } = await supabaseAdmin.from('tt_recommendation').select('status, id').eq('id', id).eq('doctor_id', doctor.id).single();
    if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    if (rec.status !== 'created') return NextResponse.json({ error: 'Can only send recommendations that are in the created status' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('tt_recommendation')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('doctor_id', doctor.id);

    if (error) throw error;

    // TODO: Trigger email notification to patient here

    return NextResponse.json({ success: true, message: 'Recommendation sent successfully' });
  } catch (error: any) {
    console.error(`POST doctor recommendation send ${params.id} error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
