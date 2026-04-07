export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
 request: Request,
 { params }: { params: { token: string } }
) {
 const { token } = params;

 if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 });

 try {
 // 1. Validate Token
 const { data: tokenRecord, error: tokenError } = await supabaseAdmin
 .from('tt_patient_token')
 .select('recommendation_id, expires_at, is_used')
 .eq('token', token)
 .single();

 if (tokenError || !tokenRecord) {
 return NextResponse.json({ error: 'Invalid or expired magic link.' }, { status: 404 });
 }

 if (tokenRecord.is_used) {
 return NextResponse.json({ error: 'This magic link has already been used.', used: true, recommendation_id: tokenRecord.recommendation_id }, { status: 400 });
 }

 if (new Date(tokenRecord.expires_at) < new Date()) {
 return NextResponse.json({ error: 'This magic link has expired.' }, { status: 400 });
 }

 // 2. Fetch Core Recommendation + Items + Doctor + Patient
 const { data: recData, error: recError } = await supabaseAdmin
 .from('tt_recommendation')
 .select(`
 *,
 doctor:doctor_id(id, practice_name, full_name, custom_service_fee_pct),
 patient:patient_id(id, salutation, first_name, last_name, email, phone, date_of_birth, address_line1, address_line2, address_zip, address_city, address_country),
 items:tt_recommendation_item(
 id, quantity, unit_price, lab_cost, test_type,
 test:test_id(name, sku, sample_shipping, preanalytics, type, laboratory:tt_laboratory(name))
 )
 `)
 .eq('id', tokenRecord.recommendation_id)
 .single();

 if (recError || !recData) {
 return NextResponse.json({ error: 'Recommendation not found.' }, { status: 404 });
 }

 // Check if an order already exists (payment already happened)
 const { data: existingOrder } = await supabaseAdmin
 .from('tt_order')
 .select('id, status')
 .eq('recommendation_id', recData.id)
 .maybeSingle();

 if (existingOrder) {
 // Order exists — mark token as used if it wasn't already
 await supabaseAdmin
  .from('tt_patient_token')
  .update({ is_used: true })
  .eq('token', token);

 return NextResponse.json(
  { error: 'This magic link has already been used.', used: true, recommendation_id: recData.id },
  { status: 400 }
 );
 }

 // 3. Dynamic Pricing Calculation
 let serviceFeePct = recData.doctor?.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 const { data: config } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct').limit(1).single();
 serviceFeePct = config?.service_fee_pct || 15;
 }

 const SHIPPING_COSTS: Record<string, number> = {
 'standard': 5.0,
 'prio': 9.0,
 'express': 15.0,
 'gologistik': 25.0
 };
 const SHIPPING_RANK: Record<string, number> = { 'standard': 1, 'prio': 2, 'express': 3, 'gologistik': 4 };

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';
 const preanalyticsList: string[] = [];

 (recData.items || []).forEach((item: any) => {
 test_costs_total += Number(item.unit_price || 0) * Number(item.quantity || 1);
 
 const shipMode = item.test?.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }
 
 if (item.test?.preanalytics && !preanalyticsList.includes(item.test.preanalytics)) {
 preanalyticsList.push(item.test.preanalytics);
 }
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 const subtotal = test_costs_total + service_fee + shipping_estimate;
 const vat = (service_fee + shipping_estimate) * 0.19;
 const total_amount = subtotal + vat;

 const pricing = {
 test_costs_total,
 service_fee_pct: serviceFeePct,
 service_fee,
 shipping_estimate,
 subtotal,
 vat,
 total_amount
 };

 const { data: order, error: orderError } = await supabaseAdmin
 .from('tt_order')
 .select('*')
 .eq('recommendation_id', recData.id)
 .maybeSingle();

 return NextResponse.json({
 recommendation: recData,
 pricing,
 preanalytics: preanalyticsList,
 order: order || null
 });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
