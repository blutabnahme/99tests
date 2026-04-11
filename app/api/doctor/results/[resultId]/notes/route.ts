import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
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

    const body = await request.json();
    const { notes } = body;

    if (typeof notes !== 'string') {
      return NextResponse.json({ error: 'Notes must be a string' }, { status: 400 });
    }

    // Verify result exists and belongs to doctor's order
    const { data: result } = await db
      .from('tt_order_result')
      .select('id, order:order_id(doctor_id)')
      .eq('id', params.resultId)
      .single();

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Verify ownership
    if ((result as any).order?.doctor_id !== doctor.id) {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await db
      .from('tt_order_result')
      .update({
        doctor_notes: notes || null,
        doctor_reviewed_at: new Date().toISOString(),
      })
      .eq('id', params.resultId);

    if (error) {
      console.error('[Doctor Notes] DB error:', error);
      return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Doctor Notes] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
