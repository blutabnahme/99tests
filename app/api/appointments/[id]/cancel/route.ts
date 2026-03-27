export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createNotification } from '@/lib/notifications';
import { sendTemplatedNotification } from '@/lib/notifications-helper';
import { paymentProvider } from '@/lib/payments';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: appointmentId } = params;
  
  try {
    const { cancellation_reason, initiator = 'bc' } = await request.json(); // initiator: 'patient' | 'bc' | 'admin'
    
    if (!appointmentId || !cancellation_reason) {
       return NextResponse.json({ error: 'Missing appointment ID or reason' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
          // > 24 hours: 100% full refund to Patient
          if (payment) patientRefundAmount = payment.patient_amount;
       } else if (hoursDifference >= 12 && hoursDifference < 24) {
          // 12-24 hours: 50% patient refund
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
          reason: cancellation_reason,
          initiated_by: initiator,
          status: 'processed'
       });

       // Update payment wrapper status
       await supabase.from('payment').update({ status: newPaymentStatus }).eq('id', payment.id);
    } else if (payment && patientRefundAmount === 0 && initiator === 'patient') {
       // Need a refund record acknowledging the 0 payout penalty context for analysis
       await supabase.from('refund').insert({
          payment_id: payment.id,
          amount: 0,
          reason: cancellation_reason,
          initiated_by: initiator,
          status: 'processed' // 100% cancellation penalty absorbed
       });
    }

    // 4. State Updates
    const { data: updatedAppt, error: apptErr } = await supabase
      .from('appointment')
      .update({
        status: 'cancelled',
        cancellation_reason
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
        
      // If cancellation count gets high, alert admin
      if (newCount > 3) {
        const { data: admins } = await supabase.auth.admin.listUsers();
        const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
        for (const admin of adminUsers) {
          // Send notification leveraging admin context
        }
      }
    }

    // 6. Notifications
    const scKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    const { data: activeApps } = await supabase.from('case_application').select('bc_id').eq('recommendation_id', cObj?.id).neq('status', 'withdrawn');
    if (activeApps) {
       for (const app of activeApps) {
         await sendTemplatedNotification({
           slug: 'case_cancelled',
           recipientId: app.bc_id as string,
           recommendationId: cObj?.id,
           variables: { recommendation_id: cObj?.id?.substring(0,8) || cObj?.id, cancel_reason: cancellation_reason, doctor_name: 'Healthcare Provider' },
           link: `/bc/appointments`
         });
       }
    }

    const { data: patientNotified } = await supabase.from('notifications').select('id').eq('user_id', cObj?.patient_id).eq('recommendation_id', cObj?.id).neq('type', 'case_cancelled').limit(1);
    if (patientNotified && patientNotified.length > 0) {
       await sendTemplatedNotification({
           slug: 'case_cancelled',
           recipientId: cObj?.patient_id as string,
           recommendationId: cObj?.id,
           variables: { recommendation_id: cObj?.id?.substring(0,8) || cObj?.id, cancel_reason: cancellation_reason, doctor_name: 'Healthcare Provider' },
           link: `/patient/${cObj?.id}`
       });
    }

    if (initiator === 'patient') {
      // Notify BC
      await createNotification(
        url, 
        scKey, 
        appt.bc_id as string,
        'system_alert',
        'Patient Cancelled Appointment',
        `The patient cancelled the appointment for Recommendation ${cObj?.id}. Reason: ${cancellation_reason}`,
        `/bc/appointments`
      );
    }

    if (initiator === 'bc') {
       // Notify Doctor
       if (cObj?.doctor_id) {
         await createNotification(
           url, 
           scKey, 
           cObj.doctor_id,
           'case_update',
           'Appointment Cancelled',
           `The collector cancelled the appointment for recommendation ${cObj.id.split('-')[1]}. Reason: ${cancellation_reason}`,
           `/dashboard/recommendations`
         );
       }

       // To Patient
       await createNotification(
         url, 
         scKey, 
         cObj?.patient_id as string,
         'case_update',
         'Appointment Cancelled',
         `Your appointment was cancelled by the collector. A full refund has been initiated.`,
         `/patient/${cObj?.id}`
       );
    }

    return NextResponse.json({ success: true, appointment: updatedAppt, refunded: patientRefundAmount });

  } catch (error: any) {
    console.error("Cancellation Error API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
