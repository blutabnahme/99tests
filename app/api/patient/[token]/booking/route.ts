export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const { searchParams } = new URL(request.url);
  const application_id = searchParams.get('application_id');

  try {
    // Fetch recommendation with relations directly
    const { data: cData, error: cErr } = await supabaseAdmin
      .from('recommendation')
      .select('*, patient(*)')
      .eq('id', token)
      .single();

    if (cErr || !cData) throw new Error("Recommendation not found");

    // Fetch application/match
    let appQuery = supabaseAdmin
      .from('case_application')
      .select('*, blood_collector(*)')
      .eq('recommendation_id', token);

    if (application_id) {
      appQuery = appQuery.eq('id', application_id);
    } else {
      appQuery = appQuery.in('status', ['accepted', 'approved']);
    }

    const { data: aData, error: aErr } = await appQuery;

    if (aErr || !aData || aData.length === 0) {
      throw new Error("Could not find matching collector.");
    }

    const app = aData[0];
    const bcData = app.blood_collector;

    // Accept application immediately if not already accepted/booked
    if (app.status !== 'accepted' && app.status !== 'booked') {
        // We'll update it silently here using Service Role
        await supabaseAdmin.from('case_application').update({ status: 'accepted' }).eq('id', app.id);
        
        // Also reject others if we selected a specific match
        if (application_id) {
            await supabaseAdmin.from('case_application')
                .update({ status: 'rejected' })
                .eq('recommendation_id', token)
                .neq('id', app.id)
                .in('status', ['applied', 'invited', 'approved', 'accepted']);
        }
        
        await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', token);
    }

    // Fetch BC Availability
    const { data: calendarBlocks } = await supabaseAdmin
      .from('bc_availability')
      .select('*')
      .eq('bc_id', app.bc_id);

    console.log("[DEBUG BOOKING] BC_ID:", app.bc_id);
    console.log("[DEBUG BOOKING] Raw Calendar Blocks:", calendarBlocks);

    // Fetch BC existing appointments
    const { data: bookedAppointments } = await supabaseAdmin
      .from('appointment')
      .select('scheduled_at')
      .eq('bc_id', app.bc_id)
      .not('status', 'in', '("cancelled", "no_show")');

    return NextResponse.json({
      recommendationData: cData,
      applicationData: app,
      bcData,
      calendarBlocks: calendarBlocks || [],
      bookedAppointments: bookedAppointments || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
