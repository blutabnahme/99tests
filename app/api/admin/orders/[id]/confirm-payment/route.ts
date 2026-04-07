import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '@/lib/notifications';
import { runOrderPreparation } from '@/lib/order-preparation';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(
 request: Request,
 { params }: { params: { id: string } }
) {
 // TODO: Add admin auth check (if token authorization middleware is applied globally, this assumes trusted service key for DB)

 const orderId = params.id;

 // Verify order exists and is awaiting_payment
 const { data: order, error } = await supabaseAdmin
 .from('tt_order')
 .select('*, recommendation:tt_recommendation(*)')
 .eq('id', orderId)
 .single();

 if (error || !order) {
 return NextResponse.json({ error: 'Order not found' }, { status: 404 });
 }

 if (order.status !== 'awaiting_payment') {
 return NextResponse.json({ error: 'Order is not awaiting payment' }, { status: 400 });
 }

 // Update order status to preparing
 const now = new Date().toISOString();
 await supabaseAdmin
 .from('tt_order')
 .update({ 
 status: 'preparing',
 payment_confirmed_at: now,
 payment_confirmed_by: '00000000-0000-0000-0000-000000000000' // TODO: use actual admin user ID extracted from auth blocks later
 })
 .eq('id', orderId);

  // Update recommendation status to paid
  await supabaseAdmin
  .from('tt_recommendation')
  .update({ status: 'paid', paid_at: now })
  .eq('id', order.recommendation_id);

  const { data: recommendation } = await supabaseAdmin
    .from('tt_recommendation')
    .select('id, doctor_id, patient_id, display_id')
    .eq('id', order.recommendation_id)
    .single();

  if (recommendation) {
    const { data: doctorRecord } = await supabaseAdmin
      .from('tt_doctor')
      .select('user_id')
      .eq('id', recommendation.doctor_id)
      .single();

    const { data: patient } = await supabaseAdmin
      .from('tt_patient')
      .select('first_name, last_name')
      .eq('id', recommendation.patient_id)
      .single();

    const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'A patient';

    if (doctorRecord?.user_id) {
      await sendNotification({
        userId: doctorRecord.user_id,
        title: 'Bank transfer confirmed',
        message: `Bank transfer payment from ${patientName} for recommendation ${recommendation.display_id} has been confirmed. The test kit will be prepared.`,
        notificationType: 'bank_transfer_confirmed',
        referenceId: recommendation.id,
        referenceType: 'recommendation',
        metadata: { patient_name: patientName, display_id: recommendation.display_id },
      });
    }
  }

  // Run preparation pipeline
  try {
    const prepResult = await runOrderPreparation(orderId);
    if (!prepResult.success) {
      console.warn(`[ConfirmPayment] Preparation pipeline had errors for order ${orderId}:`, prepResult.errors);
    }
  } catch (prepError) {
    console.error(`[ConfirmPayment] Preparation pipeline crashed for order ${orderId}:`, prepError);
  }

  return NextResponse.json({ success: true, order_id: orderId });
}
