import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification, getAdminUserIds } from '@/lib/notifications';
import { runOrderPreparation } from '@/lib/order-preparation';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
 request: Request,
 { params }: { params: { token: string } }
) {
 const { token } = params;
 if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

 try {
 // 1. Token validation
 const { data: tokenRecord, error: tokenError } = await supabaseAdmin
 .from('tt_patient_token')
 .select('*')
 .eq('token', token)
 .single();

 if (tokenError || !tokenRecord || tokenRecord.is_used || new Date(tokenRecord.expires_at) < new Date()) {
 return NextResponse.json({ error: 'Invalid or expired magic link' }, { status: 403 });
 }

 // 2. Fetch Recommendation Data for Order Creation
 const { data: recData, error: recError } = await supabaseAdmin
 .from('tt_recommendation')
 .select(`
 *,
 doctor:doctor_id(custom_service_fee_pct),
 items:tt_recommendation_item(
 quantity, unit_price, test:test_id(sample_shipping)
 )
 `)
 .eq('id', tokenRecord.recommendation_id)
 .single();

 if (recError || !recData) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });

 // 3. Recalculate Totals (to avoid trusting client)
 let serviceFeePct = recData.doctor?.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 const { data: config } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct').limit(1).single();
 serviceFeePct = config?.service_fee_pct || 15;
 }

 const SHIPPING_COSTS: Record<string, number> = { 'standard': 5.0, 'prio': 9.0, 'express': 15.0, 'gologistik': 25.0 };
 const SHIPPING_RANK: Record<string, number> = { 'standard': 1, 'prio': 2, 'express': 3, 'gologistik': 4 };

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';

 (recData.items || []).forEach((item: any) => {
 test_costs_total += Number(item.unit_price || 0) * Number(item.quantity || 1);
 const shipMode = item.test?.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 const subtotal = test_costs_total + service_fee + shipping_estimate;
 const vat = (service_fee + shipping_estimate) * 0.19; 
 const total_amount = subtotal + vat;

 const body = await request.json().catch(() => ({}));
 const payment_method = body.payment_method || 'credit_card';
 const isBankTransfer = payment_method === 'bank_transfer';

 // 4. Create Mock Payment (Only for Instant Payment Methods)
 let paymentRecordId = null;
 if (!isBankTransfer) {
 const { data: paymentRecord, error: payError } = await supabaseAdmin
 .from('tt_payment')
 .insert({
 recommendation_id: recData.id,
 provider: 'mock',
 provider_id: `mock_pi_${Date.now()}`,
 amount: total_amount,
 currency: 'EUR',
 status: 'completed',
 paid_at: new Date().toISOString()
 })
 .select()
 .single();
 
 if (payError) throw payError;
 paymentRecordId = paymentRecord.id;
 }

 // 5. Create Order
 const { data: orderRecord, error: orderError } = await supabaseAdmin
 .from('tt_order')
 .insert({
 recommendation_id: recData.id,
 display_id: recData.display_id,
 patient_id: recData.patient_id,
 doctor_id: recData.doctor_id,
 status: isBankTransfer ? 'awaiting_payment' : 'preparing',
 payment_method: payment_method,
 payment_id: paymentRecordId,
 service_fee_pct: serviceFeePct,
 service_fee_amount: service_fee,
 shipping_method: highestShippingLabel,
 shipping_cost: shipping_estimate,
 test_costs_total: test_costs_total,
 subtotal: subtotal,
 vat_rate: 19.00,
 vat_amount: vat,
 total: total_amount,
 shipping_address: recData.shipping_address,
 billing_address: recData.billing_address
 })
 .select()
 .single();

 if (orderError) throw orderError;

 // 6. Update Recommendation Status
 const newRecStatus = isBankTransfer ? 'sent' : 'paid';
 const updatePayload: any = { status: newRecStatus };
 if (!isBankTransfer) updatePayload.paid_at = new Date().toISOString();

 await supabaseAdmin
 .from('tt_recommendation')
 .update(updatePayload)
 .eq('id', recData.id);

 // 7. Mark Token as Used
 await supabaseAdmin
 .from('tt_patient_token')
 .update({ is_used: true })
 .eq('token', token);

 // 7.5 Run preparation pipeline (non-blocking — don't fail the payment if prep fails)
 try {
  const prepResult = await runOrderPreparation(orderRecord.id);
  if (!prepResult.success) {
    console.warn(`[Pay] Preparation pipeline had errors for order ${orderRecord.id}:`, prepResult.errors);
  }
 } catch (prepError) {
  console.error(`[Pay] Preparation pipeline crashed for order ${orderRecord.id}:`, prepError);
  // Don't throw — payment already succeeded, prep can be retried manually
 }

 // 8. Notifications
 const { data: doctorRecord } = await supabaseAdmin
   .from('tt_doctor')
   .select('user_id')
   .eq('id', recData.doctor_id)
   .single();

 const { data: patient } = await supabaseAdmin
   .from('tt_patient')
   .select('first_name, last_name')
   .eq('id', recData.patient_id)
   .single();

 const patientName = patient ? `${patient.first_name} ${patient.last_name}` : 'A patient';

 if (!isBankTransfer && doctorRecord?.user_id) {
   await sendNotification({
     userId: doctorRecord.user_id,
     title: 'Payment received',
     message: `${patientName} has completed payment for recommendation ${recData.display_id}. The test kit will be prepared and shipped.`,
     notificationType: 'payment_received',
     referenceId: recData.id,
     referenceType: 'recommendation',
     metadata: { patient_name: patientName, display_id: recData.display_id, amount: total_amount },
   });
 }

 if (isBankTransfer) {
   const adminIds = await getAdminUserIds();
   for (const adminId of adminIds) {
     await sendNotification({
       userId: adminId,
       title: 'Bank transfer pending',
       message: `${patientName} selected bank transfer for recommendation ${recData.display_id}. Amount: €${total_amount.toFixed(2)}.`,
       notificationType: 'bank_transfer_pending',
       referenceId: orderRecord.id,
       referenceType: 'order',
       metadata: { patient_name: patientName, display_id: recData.display_id, amount: total_amount },
     });
   }
 }

 return NextResponse.json({ success: true, order: orderRecord });
 } catch (error: any) {
 console.error("Payment error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
