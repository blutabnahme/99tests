export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/notifications';
import { notifyAdmins } from '@/lib/admin-notifications';
import { deliverWebhook } from '@/lib/webhooks';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
 try {
 const { payload } = await request.json();
 const { event_type, recommendationId, amount, provider_id } = payload;
 
 // 1. Fetch recommendation for routing Context
 const { data: currentCase, error: recommendationErr } = await supabaseAdmin
 .from("recommendation")
 .select("*, payment(id, status), patient(id)")
 .eq("id", recommendationId)
 .single();

 if (recommendationErr || !currentCase) {
 return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
 }

 // Handle Payment Success
 if (event_type === 'payment_succeeded') {
 await supabaseAdmin.from('payment').update({ status: 'captured', provider_id }).eq('recommendation_id', recommendationId);

 // Notify Doctor
 await sendNotification({
 userId: currentCase.doctor_id,
 notificationType: 'payment_received',
 title: 'Payment Processed Successfully',
 message: `Your payment of €${amount} for recommendation ${recommendationId.split('-')[1]} was processed successfully. The invoice is available in your account.`,
 metadata: { route: `/dashboard/billing` }
 });

 // Webhook `recommendation.payment_received`
 deliverWebhook(currentCase.doctor_id, 'recommendation.payment_received', {
 recommendationId,
 amount,
 status: 'succeeded'
 }).catch(e => console.error(e));

 // Notify Patient (Receipt) - patient.id maps to auth.id
 if (currentCase.patient?.id) {
 await sendNotification({
 userId: currentCase.patient.id,
 notificationType: 'payment_received',
 title: 'Receipt: Payment Processed',
 message: `Your payment of €${amount} for your upcoming appointment has been processed. Thank you!`,
 metadata: { route: `/patient/billing` }
 });
 }

 return NextResponse.json({ success: true });
 }

 // Handle Payment Failure
 if (event_type === 'payment_failed') {
 await supabaseAdmin.from('payment').update({ status: 'failed', provider_id }).eq('recommendation_id', recommendationId);

 await notifyAdmins(
 'system_alert',
 'Payment Failure Details',
 `A payment of €${amount} failed to process for recommendation ${recommendationId.split('-')[1]}. Manual review required.`,
 `/admin/financial`
 );

 return NextResponse.json({ success: true });
 }

 return NextResponse.json({ error: "Unhandled event type" }, { status: 400 });

 } catch (err: any) {
 console.error("Payment Webhook Error:", err.message);
 return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
 }
}
