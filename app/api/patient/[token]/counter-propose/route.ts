export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const recommendationId = params.token;

    const { data: recommendationData, error: caseError } = await supabaseAdmin
      .from('recommendation')
      .select('patient_id, urgency_level')
      .eq('id', recommendationId)
      .single();

    if (caseError || !recommendationData) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 });
    }

    const { application_id, slots } = await request.json();

    if (!Array.isArray(slots) || slots.length !== 3) {
      return NextResponse.json({ success: false, error: 'Exactly 3 slots required' }, { status: 400 });
    }

    const now = new Date();
    for (const s of slots) {
      if (new Date(s.start) <= now) {
        return NextResponse.json({ success: false, error: 'All slots must be in the future' }, { status: 400 });
      }
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from('case_application')
      .select('recommendation_id, bc_id, is_flexible, scheduling_status')
      .eq('id', application_id)
      .single();

    if (appError || !application || application.recommendation_id !== recommendationId) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (!application.is_flexible || application.scheduling_status !== 'bc_proposed') {
      return NextResponse.json({ success: false, error: 'Cannot counter-propose for this application' }, { status: 400 });
    }

    if (recommendationData.urgency_level !== 'normal') {
      return NextResponse.json({ success: false, error: 'Counter-propose is only allowed for normal urgency recommendations' }, { status: 400 });
    }

    const insertData = slots.map((s: any) => ({
      bc_id: application.bc_id,
      case_application_id: application_id,
      recommendation_id: application.recommendation_id,
      slot_start: s.start,
      status: 'proposed',
      proposed_by: 'patient',
      round: 2
    }));

    const { error: insertError } = await supabaseAdmin
      .from('bc_proposed_slots')
      .insert(insertData);

    if (insertError) {
      return NextResponse.json({ success: false, error: 'Failed to insert counter-proposed slots' }, { status: 500 });
    }

    await supabaseAdmin
      .from('case_application')
      .update({ scheduling_status: 'patient_counter_proposed' })
      .eq('id', application_id);

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Error in counter-propose:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
