export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { deliverWebhook } from '@/lib/webhooks';

// Initialize Supabase with the Service Role key to bypass RLS for this specific token-based lookup
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    // 1. Fetch the core Recommendation immediately.
    const { data: caseRes, error: recommendationErr } = await supabaseAdmin
      .from('recommendation')
      .select('*, doctor_practice(id, name), patient(*)')
      .eq('id', token)
      .single();

    if (recommendationErr || !caseRes) {
      console.error("DEBUG QUERY ERROR:", recommendationErr);
      return NextResponse.json({ error: 'Recommendation not found or invalid token', details: recommendationErr }, { status: 404 });
    }

    // 2. We depend on bc_selection_mode for matches, but we can parallelize matches, appointments, and reviews.
    let appQuery = supabaseAdmin
      .from('case_application')
      .select('*, blood_collector(*)')
      .eq('recommendation_id', token)
      .order('applied_at', { ascending: false });

    if (caseRes.bc_selection_mode === 'clinic_shortlist') {
      appQuery = appQuery.in('status', ['accepted']);
    } else if (caseRes.bc_selection_mode === 'patient_decides') {
      appQuery = appQuery.eq('status', 'applied');
    } else if (caseRes.bc_selection_mode === 'clinic_approval') {
      appQuery = appQuery.eq('status', 'accepted');
    } else {
      appQuery = appQuery.in('status', ['applied', 'accepted']);
    }

    const [appPromiseData, aptPromiseData, revPromiseData, slotsPromiseData, configData] = await Promise.all([
      appQuery,
      supabaseAdmin.from('appointment').select('*').eq('recommendation_id', token).maybeSingle(),
      supabaseAdmin.from('review').select('id').eq('recommendation_id', token).maybeSingle(),
      supabaseAdmin.from('bc_proposed_slots').select('*').eq('recommendation_id', token).eq('status', 'proposed'),
      supabaseAdmin.from('platform_config').select('id, value').in('id', ['commission', 'tax', 'pricing', 'fees'])
    ]);

    if (appPromiseData.error) {
      console.error("DEBUG APP QUERY ERROR:", appPromiseData.error);
      return NextResponse.json({ error: 'Could not fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      recommendationData: caseRes,
      applications: appPromiseData.data || [],
      appointment: aptPromiseData.data || null,
      reviewExists: !!revPromiseData.data,
      proposedSlots: slotsPromiseData.data || [],
      platformConfig: configData.data || []
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const body = await request.json();
  const { action, payload } = body;

  try {
    if (action === 'save_consent') {
      const { consents } = payload;
      const { error } = await supabaseAdmin.from('consent_record').insert(consents);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'select_bc') {
      const { selectedApplicationId } = payload;
      
      const { data: appData } = await supabaseAdmin.from('case_application').select('*, case:recommendation_id(*)').eq('id', selectedApplicationId).single();
      if (!appData) return NextResponse.json({ error: 'App not found' }, { status: 404 });
      
      // Update selected application to accepted
      await supabaseAdmin.from('case_application').update({ status: 'accepted' }).eq('id', selectedApplicationId);
      
      // Update Recommendation to 'matched'
      await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', token);

      // --- Fire-and-forget side effects logic ---
      (async () => {
        try {
          // Reject other pending/invited applications
          const { data: otherApps } = await supabaseAdmin.from('case_application').select('id, bc_id').eq('recommendation_id', token).neq('id', selectedApplicationId).in('status', ['applied', 'invited', 'approved', 'accepted']);
          if (otherApps && otherApps.length > 0) {
            await supabaseAdmin.from('case_application').update({ status: 'rejected' }).in('id', otherApps.map(a => a.id));
            
            // Notify Rejected BCs
            await Promise.all(otherApps.map(rejectedApp => 
              createNotification(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                rejectedApp.bc_id,
                'application_rejected',
                'Application Update',
                `Another collector was selected for recommendation ${token.split('-')[1]}.`,
                `/bc/opportunities`
              )
            ));
          }

          // Notify Accepted BC
          await createNotification(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            appData.bc_id,
            'application_accepted',
            'Application Accepted',
            `You've been selected for recommendation ${token.split('-')[1]}! Please confirm the appointment time.`,
            `/bc/dashboard/recommendations/${token}`
          );
          
          // Notify Doctor
          const { data: bcProf } = await supabaseAdmin.from('blood_collector').select('first_name, last_name').eq('id', appData.bc_id).single();
          const bcName = bcProf ? `${bcProf.first_name} ${bcProf.last_name}` : 'A collector';
          await createNotification(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            appData.case.doctor_id,
            'case_update',
            'Collector Selected',
            `Patient has selected ${bcName} for recommendation ${token.split('-')[1]}.`,
            `/dashboard/recommendations/${token}`
          );

          // Webhook `recommendation.bc_selected` Integration
          await deliverWebhook(appData.case.doctor_id, 'recommendation.bc_selected', { 
             recommendationId: token,
             bcId: appData.bc_id,
             bcName: bcName
          });
        } catch (err) {
          console.error('[Async Side Effects Failed]', err);
        }
      })();
      // --- End Fire-and-forget ---

      return NextResponse.json({ success: true });
    }

    if (action === 'submit_rating') {
      const { reviewData } = payload;
      const { error } = await supabaseAdmin.from('review').insert(reviewData);
      if (error) throw error;
      
      // Update recommendation to indicate it's ready for payment
      // e.g. status: 'pending_payment' or just keep 'completed' since 'completed' implies payment ready.
      // But let's check what the standard status is. Based on schema: created, matched, pending_booking, booked, completed, cancelled.
      // So 'completed' is the final end state for the collection. Payment then kicks in.
      const { error: recommendationErr } = await supabaseAdmin.from('recommendation').update({ status: 'completed' }).eq('id', token);
      if (recommendationErr) throw recommendationErr;

      return NextResponse.json({ success: true });
    }

    if (action === 'schedule_time') {
      const { bcId, patientId, time, selectedApplicationId } = payload;
      
      // Also trigger the acceptance logic if passed, but typically select_bc does the heavy lifting first or concurrently.
      // If we do it concurrently:
      if (selectedApplicationId) {
         // Update accepted status implicitly by falling back 
         await supabaseAdmin.from('case_application').update({ status: 'accepted' }).eq('id', selectedApplicationId);
      }
      
      await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', token);

      const { error } = await supabaseAdmin.from('appointment').insert({
        recommendation_id: token,
        bc_id: bcId,
        patient_id: patientId,
        scheduled_at: time,
        status: 'scheduled'
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'request_custom_time') {
      const { bcId, patientId, time, notes, selectedApplicationId } = payload;
      
      if (selectedApplicationId) {
         await supabaseAdmin.from('case_application').update({ status: 'accepted' }).eq('id', selectedApplicationId);
      }
      
      await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', token);

      const { error } = await supabaseAdmin.from('appointment').insert({
        recommendation_id: token,
        bc_id: bcId,
        patient_id: patientId,
        scheduled_at: time,
        status: 'pending_bc_confirmation',
        notes: notes
      });
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
