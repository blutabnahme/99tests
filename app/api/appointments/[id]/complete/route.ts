export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/notifications';
import { deliverWebhook } from '@/lib/webhooks';
import { sendTemplatedNotification } from '@/lib/notifications-helper';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
 request: Request,
 { params }: { params: { id: string } }
) {
 const { id } = params;
 const { tubes_collected, issues_encountered, issues_notes, sample_ready_for_transport } = await request.json();

 if (!id) return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });

 try {
 // 1. Fetch appointment & related recommendation details
 const { data: appt } = await supabaseAdmin
 .from('appointment')
 .select('*, bc:bc_id(*), case:recommendation_id(*)')
 .eq('id', id)
 .single();

 if (!appt) throw new Error("Appointment not found");
 if (appt.status !== 'in_progress') throw new Error("Appointment is not in progress");

 // 2. Update Appointment
 const { data: updatedAppt, error: apptErr } = await supabaseAdmin
 .from('appointment')
 .update({
 status: 'completed',
 tubes_collected: parseInt(tubes_collected) || 0,
 issues_encountered,
 issues_notes,
 sample_ready_for_transport
 })
 .eq('id', id)
 .select()
 .single();

 if (apptErr) throw apptErr;

 // 3. Update Recommendation Status based on logistics
 const recommendationId = appt.recommendation_id;
 const logistics = appt.case?.return_logistics || 'hc';
 const nextCaseStatus = logistics === 'platform' ? 'awaiting_pickup' : 'sample_with_hc';

 await supabaseAdmin
 .from('recommendation')
 .update({ status: nextCaseStatus })
 .eq('id', recommendationId);

 // 4. Update Blood Collector lifetime counter
 if (appt.bc) {
 await supabaseAdmin
 .from('blood_collector')
 .update({ total_collections: (appt.bc.total_collections || 0) + 1 })
 .eq('id', appt.bc_id);
 }

 // 5. Send Notifications
 
 // To Doctor
 if (appt.case?.doctor_id) {
 await sendTemplatedNotification({
 slug: 'case_completed',
 recipientId: appt.case.doctor_id,
 recommendationId: recommendationId,
 variables: {
 recommendation_id: recommendationId.split('-')[1] || recommendationId,
 collector_name: 'A blood collector',
 patient_name: 'The patient'
 },
 link: `/dashboard/recommendations/${recommendationId}`
 });

 // Webhook `recommendation.completed`
 deliverWebhook(appt.case.doctor_id, 'recommendation.completed', {
 recommendationId,
 appointmentId: id,
 tubesCollected: parseInt(tubes_collected) || 0,
 issuesEncountered: issues_encountered
 }).catch(e => console.error(e));
 }

 // To Patient
 await sendTemplatedNotification({
 slug: 'case_completed',
 recipientId: appt.patient_id,
 recommendationId: recommendationId,
 variables: {
 recommendation_id: recommendationId.split('-')[1] || recommendationId,
 collector_name: 'Your blood collector',
 patient_name: 'Patient'
 },
 link: `/patient/${recommendationId}`
 });

 // To Admins (all admin users)
 const { data: admins } = await supabaseAdmin.auth.admin.listUsers();
 // Assuming admin role is stored in user_metadata.role
 const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
 
 for (const admin of adminUsers) {
 await sendNotification({
 userId: admin.id,
 notificationType: 'system_alert',
 title: 'Recommendation Action Required',
 message: `Recommendation ${recommendationId.split('-')[1]} requires ${logistics === 'platform' ? 'logistics pickup' : 'lab procession'}.`,
 metadata: { route: `/admin/insights` } // or admin recommendation view when built
 });
 }

 return NextResponse.json({ success: true, appointment: updatedAppt });

 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
