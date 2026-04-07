export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createNotification, createNotificationForAdmins, notifyPatient } from '@/lib/notifications-helper';

// Create a service role client to bypass RLS issues
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request, { params }: { params: { id: string } }) {
 try {
 const applicationId = params.id;
 if (!applicationId) {
 return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
 }

 const body = await request.json();
 const { status } = body;

 if (!['accepted', 'rejected'].includes(status)) {
 return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
 }

 const cookieStore = cookies();
 const supabaseClient = createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 get(name: string) {
 return cookieStore.get(name)?.value;
 },
 },
 }
 );

 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
 if (authError || !user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Verify ownership indirectly by checking if the recommendation of this application belongs to the Doctor
 const { data: appData, error: appError } = await supabaseAdmin
 .from('case_application')
 .select('recommendation_id, bc_id, case:recommendation_id(doctor_id, bc_selection_mode)')
 .eq('id', applicationId)
 .single();

 // Check mapping since recommendation is joined
 const recommendationObj = Array.isArray(appData?.case) ? appData.case[0] : appData?.case;

 if (appError || !appData || recommendationObj?.doctor_id !== user.id) {
 return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 403 });
 }

 // Securely update bypassing RLS
 const { error } = await supabaseAdmin
 .from('case_application')
 .update({ status })
 .eq('id', applicationId);

 if (error) {
 console.error('Error updating application status:', error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 if (status === 'rejected') {
 // TODO: 99Tests - removed 99Tests dependency
 await createNotification({
 userId: appData.bc_id,
 type: 'application_rejected',
 title: 'Application Not Selected',
 message: `Your application for recommendation ${appData.recommendation_id} was not selected.`,
 link: `/bc/applications`
 });
 await createNotificationForAdmins({
 type: 'case_update',
 title: 'Application Rejected',
 message: `An Doctor has rejected an application for recommendation ${appData.recommendation_id}.`,
 link: `/admin/recommendations/${appData.recommendation_id}`
 });
 }

 // Handle Match sync & Overarching Recommendation status updates for Clinic Approval OR Clinic Shortlist Acceptances
 if (status === 'accepted') {
 
 // Upsert the match record so the patient portal recognizes this BC
 const { data: existingMatch } = await supabaseAdmin.from('match')
 .select('id').eq('recommendation_id', appData.recommendation_id).eq('bc_id', appData.bc_id).single();

 if (existingMatch) {
 await supabaseAdmin.from('match').update({ status: 'accepted' }).eq('id', existingMatch.id);
 } else {
 await supabaseAdmin.from('match').insert({
 recommendation_id: appData.recommendation_id,
 bc_id: appData.bc_id,
 status: 'accepted',
 rank: 1,
 score: 100
 });
 }

 await createNotification({
 userId: appData.bc_id,
 type: 'application_accepted',
 title: 'Application Accepted',
 message: `Your application for recommendation ${appData.recommendation_id} has been accepted.`,
 link: `/bc/applications`
 });
 await createNotificationForAdmins({
 type: 'case_update',
 title: 'Application Accepted',
 message: `An Doctor has accepted an application for recommendation ${appData.recommendation_id}.`,
 link: `/admin/recommendations/${appData.recommendation_id}`
 });

 const selectionMode = recommendationObj.bc_selection_mode || (recommendationObj as any).selection_mode || 'doctor_curates';

 // If it's clinic_approval (where Doctor strictly assigns the BC without patient pick), auto-advance to matched
 if (selectionMode === 'clinic_approval') {
 await supabaseAdmin.from('recommendation').update({ status: 'matched' }).eq('id', appData.recommendation_id);
 
 // In theory, reject all other applications/matches. But keeping it simple for now.
 await supabaseAdmin.from('match').update({ status: 'rejected' })
 .eq('recommendation_id', appData.recommendation_id).neq('bc_id', appData.bc_id).in('status', ['applied', 'invited']);
 
 await supabaseAdmin.from('case_application').update({ status: 'rejected' })
 .eq('recommendation_id', appData.recommendation_id).neq('id', applicationId).in('status', ['applied']);

 const { data: rejectedApps } = await supabaseAdmin
 .from('case_application')
 .select('id')
 .eq('recommendation_id', appData.recommendation_id)
 .neq('id', applicationId)
 .in('status', ['rejected']);
 if (rejectedApps) {
 for (const app of rejectedApps) {
 // TODO: 99Tests - removed 99Tests dependency
 }
 }
 
 // Notify Patient
 await notifyPatient(appData.recommendation_id, 'clinic_approval_ready');
 } else if (selectionMode === 'clinic_shortlist' || selectionMode === 'doctor_curates') {
 // Notify patient only on the first accepted application for shortlist mode
 const { count, error: countErr } = await supabaseAdmin
 .from('case_application')
 .select('id', { count: 'exact', head: true })
 .eq('recommendation_id', appData.recommendation_id)
 .eq('status', 'accepted');
 
 if (!countErr && count === 1) {
 await notifyPatient(appData.recommendation_id, 'shortlist_ready');
 }
 }
 }
 return NextResponse.json({ success: true, status });
 } catch (error: any) {
 console.error('Unexpected error in /api/doctor/applications/[id]/status:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
