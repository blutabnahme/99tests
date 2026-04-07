export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/notifications';
import { deliverWebhook } from '@/lib/webhooks';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
 request: Request,
 { params }: { params: { token: string } }
) {
 const { token } = params; // recommendation_id
 const { bc_id, patient_id, scheduled_at, application_id, location, type } = await request.json();

 try {
 // 1. Double-booking check logic
 const { data: conflicts } = await supabaseAdmin
 .from('appointment')
 .select('id')
 .eq('bc_id', bc_id)
 .eq('scheduled_at', scheduled_at)
 .not('status', 'in', '("cancelled", "no_show")');
 
 if (conflicts && conflicts.length > 0) {
 return NextResponse.json({ error: 'This time slot was just booked by someone else.' }, { status: 409 });
 }

 // 2. Fetch required context
 const { data: cData } = await supabaseAdmin.from('recommendation').select('patient:patient_id(first_name, last_name)').eq('id', token).single();
 const c = cData as any;
 const patientName = c?.patient ? `${c.patient.first_name} ${c.patient.last_name}` : 'Patient';

 const { data: appDataRaw } = await supabaseAdmin.from('case_application').select('case:recommendation_id(doctor_id)').eq('id', application_id).single();
 const appData = appDataRaw as any;

 // 3. Create Appointment
 const { data: newAppt, error: apptErr } = await supabaseAdmin
 .from('appointment')
 .insert({
 recommendation_id: token,
 application_id: application_id,
 bc_id: bc_id,
 patient_id: patient_id,
 scheduled_at: scheduled_at,
 status: 'scheduled',
 location: location,
 type: type // 'practice' or 'home_visit'
 })
 .select()
 .single();

 if (apptErr) throw apptErr;

 // 4. Update CaseApplication status to 'booked' // -> match
 await supabaseAdmin
 .from('case_application')
 .update({ status: 'booked' })
 .eq('id', application_id);

 // 5. Update Recommendation status
 await supabaseAdmin
 .from('recommendation')
 .update({ status: 'booked' })
 .eq('id', token);

 // 6. Dispatch Notifications
 // To BC
 await sendNotification({
 userId: bc_id,
 notificationType: 'case_update',
 title: 'Appointment Confirmed',
 message: `Appointment confirmed: ${new Date(scheduled_at).toLocaleDateString()} at ${new Date(scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with ${patientName}.`,
 metadata: { route: `/bc/dashboard/appointments` }
 });

 // To Doctor
 if (appData?.case?.doctor_id) {
 await sendNotification({
 userId: appData.case.doctor_id,
 notificationType: 'case_update',
 title: 'Appointment Booked',
 message: `Appointment booked for recommendation ${token.split('-')[1]}: ${new Date(scheduled_at).toLocaleDateString()} at ${new Date(scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
 metadata: { route: `/dashboard/recommendations/${token}` }
 });

 // Webhook `recommendation.appointment_booked`
 deliverWebhook(appData.case.doctor_id, 'recommendation.appointment_booked', {
 recommendationId: token,
 appointmentId: newAppt.id,
 bcId: bc_id,
 scheduledAt: scheduled_at
 }).catch(e => console.error(e));
 }

 // Note: Patient gets their confirmation from the UI/Email layer outside of the notifications table.

 return NextResponse.json({ success: true, appointment: newAppt });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
