export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications-helper';
// 
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendationId = params.id;
    if (!recommendationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch Recommendation with Patient and Doctor info
    const { data: recommendationData, error: recommendationErr } = await supabaseAdmin
      .from('recommendation')
      .select(`
        *,
        patient:patient_id (*),
        hc:doctor_id (*)
      `)
      .eq('id', recommendationId)
      .single();

    if (recommendationErr || !recommendationData) {
      console.error("Error fetching case:", recommendationErr);
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 2. Recommendation Applications with Blood Collector data
    const { data: applications } = await supabaseAdmin
      .from('case_application')
      .select(`
        *,
        bc:bc_id (*)
      `)
      .eq('recommendation_id', recommendationId)
      .order('applied_at', { ascending: true });

    // 3. Proposed Slots
    const { data: proposedSlots } = await supabaseAdmin
      .from('bc_proposed_slots')
      .select('*')
      .eq('recommendation_id', recommendationId);

    // 4. Appointment
    const { data: appointment } = await supabaseAdmin
      .from('appointment')
      .select(`
        *,
        bc:bc_id (*)
      `)
      .eq('recommendation_id', recommendationId)
      .maybeSingle();

    // 5. Payment
    const { data: payment } = await supabaseAdmin
      .from('payment')
      .select('*')
      .eq('recommendation_id', recommendationId)
      .maybeSingle();

    // 6. Match records
    const { data: matches } = await supabaseAdmin
      .from('match')
      .select('*')
      .eq('recommendation_id', recommendationId);

    // 7. Consent
    const { data: consent } = await supabaseAdmin
      .from('consent_record')
      .select('*')
      .eq('recommendation_id', recommendationId)
      .maybeSingle();

    // 8. All Healthcare Companies (for reassignment dropdown)
    const { data: allHCs } = await supabaseAdmin
      .from('doctor_practice')
      .select('id, name')
      .order('name', { ascending: true });

    // 9. All BCs (for manual assignment)
    const { data: allActiveBCs, error: allBCsError } = await supabaseAdmin
      .from('blood_collector')
      .select('id, first_name, last_name, contact_email, practice_fee, home_visit_fee');

    console.log('All BCs query result:', allActiveBCs?.length, allBCsError);

    return NextResponse.json({
      recommendationData,
      applications: applications || [],
      proposedSlots: proposedSlots || [],
      appointment: appointment || null,
      payment: payment || null,
      matches: matches || [],
      consent: consent || null,
      allHCs: allHCs || [],
      allActiveBCs: allActiveBCs || []
    });

  } catch (err: any) {
    console.error("GET admin case error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendationId = params.id;
    if (!recommendationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await request.json();
    const { status, urgency_level, bc_selection_mode, doctor_id, admin_notes } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current recommendation to check changes
    const { data: currentCase } = await supabaseAdmin
      .from('recommendation')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (!currentCase) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (urgency_level !== undefined) updates.urgency_level = urgency_level;
    if (bc_selection_mode !== undefined) updates.bc_selection_mode = bc_selection_mode;
    if (doctor_id !== undefined) updates.doctor_id = doctor_id;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('recommendation')
        .update(updates)
        .eq('id', recommendationId);

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Handle Notifications
      if (status !== undefined && status !== currentCase.status) {
        await createNotification({
          userId: currentCase.doctor_id,
          type: 'status_update',
          title: 'Recommendation Status Changed',
          message: `Admin force-updated status of Recommendation ${recommendationId} to ${status}.`,
          link: `/dashboard/recommendations/${recommendationId}`
        });
      }

      if (doctor_id !== undefined && doctor_id !== currentCase.doctor_id) {
        // Notify original Doctor
        await createNotification({
          userId: currentCase.doctor_id,
          type: 'system_alert',
          title: 'Recommendation Reassigned',
          message: `Recommendation ${recommendationId} was reassigned away from your clinic by platform administrators.`,
          link: '/dashboard/recommendations'
        });
        // Notify new Doctor
        await createNotification({
          userId: doctor_id,
          type: 'system_alert',
          title: 'New Recommendation Assigned',
          message: `Recommendation ${recommendationId} was assigned to your clinic by platform administrators.`,
          link: `/dashboard/recommendations/${recommendationId}`
        });
      }
    }

    return NextResponse.json({ success: true, recommendationId });

  } catch (err: any) {
    console.error("PATCH admin case error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recommendationId = params.id;
    if (!recommendationId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const body = await request.json();
    const { action, bc_id, application_id, status } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get Recommendation context
    const { data: currentCase } = await supabaseAdmin
      .from('recommendation')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (!currentCase) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });

    // 1. ASSIGN BC ACTIONS
    if (action === 'assign_bc' && bc_id) {
      // Create Application
      const { data: newApp, error: appErr } = await supabaseAdmin
        .from('case_application')
        .insert({
          recommendation_id: recommendationId,
          bc_id: bc_id,
          status: 'accepted',
          applied_at: new Date().toISOString(),
          is_flexible: false,
          scheduling_status: 'pending'
        })
        .select('id')
        .single();

      if (appErr) throw new Error(appErr.message);

      // Create Match Record
      await supabaseAdmin.from('match').insert({
        recommendation_id: recommendationId,
        bc_id: bc_id,
        status: 'active'
      });

      // Update recommendation to matched
      if (currentCase.status === 'created' || currentCase.status === 'pending') {
        await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', recommendationId);
      }

      // Notify BC & Doctor
      await createNotification({
        userId: bc_id,
        type: 'application_accepted',
        title: 'Platform Assignment',
        message: `You have been manually assigned to recommendation ${recommendationId} by platform administrators.`,
        link: `/dashboard/recommendations/${recommendationId}`
      });

      await createNotification({
         userId: currentCase.doctor_id,
         type: 'case_update',
         title: 'BC Assigned Automatically',
         message: `Platform administrators have assigned a verified BC to recommendation ${recommendationId}.`,
         link: `/dashboard/recommendations/${recommendationId}`
      });
      
      return NextResponse.json({ success: true, application_id: newApp.id });
    }

    // 2. REMOVE BC ACTIONS (or status overrides)
    if (action === 'remove_bc' && application_id) {
      await supabaseAdmin
        .from('case_application')
        .update({ status: 'rejected' })
        .eq('id', application_id);

      // Release any proposed slots
      // TODO: 99Tests - removed 99Tests dependency

      // Check remaining match counts to potentially revert status
      const { data: remaining } = await supabaseAdmin
        .from('case_application')
        .select('id')
        .eq('recommendation_id', recommendationId)
        .eq('status', 'accepted');

      if (!remaining || remaining.length === 0) {
        if (currentCase.status === 'matched') {
           await supabaseAdmin.from('recommendation').update({ status: 'created' }).eq('id', recommendationId);
        }
      }

      // We need BC ID to properly notify them.
      const { data: oldApp } = await supabaseAdmin.from('case_application').select('bc_id').eq('id', application_id).single();
      if (oldApp) {
        await createNotification({
          userId: oldApp.bc_id,
          type: 'system_alert',
          title: 'Assignment Revoked',
          message: `Your assignment to recommendation ${recommendationId} has been revoked by platform administrators.`,
          link: `/dashboard/recommendations`
        });
      }

      return NextResponse.json({ success: true });
    }

    // 3. OVERRIDE APPLICATION STATUS
    if (action === 'update_application_status' && application_id && status) {
       await supabaseAdmin
        .from('case_application')
        .update({ status })
        .eq('id', application_id);

       // TODO: 99Tests - removed 99Tests dependency
       // if (status === 'rejected' || status === 'withdrawn') {
       // }

       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

  } catch (err: any) {
    console.error("POST admin case error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
