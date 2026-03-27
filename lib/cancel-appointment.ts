import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';
import { paymentProvider } from '@/lib/payments';
import { deliverWebhook } from '@/lib/webhooks';

/**
 * Shared server-side logical engine for cancelling an appointment and resolving active pre-funded Stripe objects.
 * Separated to allow execution via internal Cookie-Bound endpoints `/api/appointments` AND headless REST API integrations.
 */
export async function cancelAppointmentTransaction(appointmentId: string, cancellationReason: string, initiator: 'patient' | 'bc' | 'admin') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const scKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, scKey, { auth: { persistSession: false } });

  // 1. Fetch appointment details with related payment and recommendation
  const { data: appt, error: fetchErr } = await supabase
    .from('appointment')
    .select(`
       *,
       bc:bc_id(*),
       case:recommendation_id(*),
       payment(id, patient_amount, bc_payout, status)
    `)
    .eq('id', appointmentId)
    .single();

  if (fetchErr || !appt) throw new Error("Appointment not found");
  if (appt.status === 'completed' || appt.status === 'cancelled') {
      throw new Error("Cannot cancel a completed or already cancelled appointment");
  }

  const pArray = Array.isArray(appt.payment) ? appt.payment : (appt.payment ? [appt.payment] : []);
  const payment = pArray[0];
  const cObj = Array.isArray(appt.case) ? appt.case[0] : appt.case;

  // Time calculations
  const now = new Date();
  const scheduledAt = new Date(appt.scheduled_at);
  const hoursDifference = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  let patientRefundAmount = 0;
  let newPaymentStatus = payment?.status;

  // 2. Financial Refund Logic
  if (initiator === 'bc' || initiator === 'admin') {
     // BC/Admin cancelled: Patient gets 100% refund regardless of time
     if (payment) patientRefundAmount = payment.patient_amount;
  } else if (initiator === 'patient') {
     if (hoursDifference >= 24) {
        // > 24 hours: 100% full refund
        if (payment) patientRefundAmount = payment.patient_amount;
     } else if (hoursDifference >= 12 && hoursDifference < 24) {
        // 12-24 hours: 50% refund
        if (payment) patientRefundAmount = payment.patient_amount * 0.5;
     } else {
        // < 12 hours: 0% refund penalty
        patientRefundAmount = 0;
     }
  }

  // 3. Process Financials via Provider
  if (payment && patientRefundAmount > 0) {
     const isRefundSuccess = await paymentProvider.refundPayment(payment.id, patientRefundAmount);
     if (!isRefundSuccess) {
        throw new Error("Payment Provider failed to issue the refund.");
     }
     
     newPaymentStatus = patientRefundAmount === payment.patient_amount ? 'refunded' : 'partially_refunded';
     
     // Record refund in DB
     await supabase.from('refund').insert({
        payment_id: payment.id,
        amount: patientRefundAmount,
        reason: cancellationReason,
        initiated_by: initiator,
        status: 'processed'
     });

     // Update payment wrapper status
     await supabase.from('payment').update({ status: newPaymentStatus }).eq('id', payment.id);
  } else if (payment && patientRefundAmount === 0 && initiator === 'patient') {
     // Record 0 payout penalty context
     await supabase.from('refund').insert({
        payment_id: payment.id,
        amount: 0,
        reason: cancellationReason,
        initiated_by: initiator,
        status: 'processed' 
     });
  }

  // 4. State Updates
  const { data: updatedAppt, error: apptErr } = await supabase
    .from('appointment')
    .update({
      status: 'cancelled',
      cancellation_reason: cancellationReason
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (apptErr) throw apptErr;

  if (cObj) {
    await supabase.from('recommendation').update({ status: 'cancelled' }).eq('id', cObj.id);
  }

  // 5. BC Penalty Tracking (if initiator is BC)
  if (initiator === 'bc' && appt.bc) {
    const newCount = (appt.bc.cancellation_count || 0) + 1;
    await supabase
      .from('blood_collector')
      .update({ cancellation_count: newCount })
      .eq('id', appt.bc_id);
  }

  // 6. Notifications
  if (initiator === 'patient') {
    await createNotification(
      url, scKey, appt.bc_id as string,
      'system_alert', 'Patient Cancelled Appointment',
      `The patient cancelled the appointment for Recommendation ${cObj?.id}. Reason: ${cancellationReason}`,
      `/bc/appointments`
    );
  }

  if (initiator === 'bc') {
     if (cObj?.doctor_id) {
       await createNotification(
         url, scKey, cObj.doctor_id,
         'case_update', 'Appointment Cancelled',
         `The collector cancelled the appointment for recommendation ${cObj.id.split('-')[1]}. Reason: ${cancellationReason}`,
         `/dashboard/recommendations`
       );
     }
     await createNotification(
       url, scKey, cObj?.patient_id as string,
       'case_update', 'Appointment Cancelled',
       `Your appointment was cancelled by the collector. A refund has been initiated.`,
       `/patient/${cObj?.id}`
     );
  }
  
  // Custom API Integration hook (notify patient admin initiated an API voiding)
  if (initiator === 'admin') {
     if (cObj?.patient_id) {
       await createNotification(
         url, scKey, cObj.patient_id as string,
         'case_update', 'Recommendation Voided',
         `Your Healthcare Provider directly cancelled Recommendation ${cObj.id.split('-')[1]}. Total refunds processed automatically.`,
         `/patient/${cObj?.id}`
       );
     }
  }

  // 7. Core Webhook Delivery (Push to HIS Integration)
  if (cObj?.doctor_id) {
     // Run asynchronously in the background so it doesn't block the API return time
     deliverWebhook(cObj.doctor_id, 'recommendation.cancelled', { 
        recommendationId: cObj.id, 
        appointmentId: appointmentId,
        reason: cancellationReason, 
        initiator 
     }).catch(e => console.error("Webhook Delivery Initiation Failed", e));
  }

  return { updatedAppt, patientRefundAmount };
}
