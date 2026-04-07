export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { calculateMaterials, saveRecommendationMaterials } from '@/lib/materials-calculator';
import crypto from 'crypto';

const SHIPPING_COSTS: Record<string, number> = {
 'standard': 5.0,
 'prio': 9.0,
 'express': 15.0,
 'gologistik': 25.0
};
const SHIPPING_RANK: Record<string, number> = {
 'standard': 1,
 'prio': 2,
 'express': 3,
 'gologistik': 4
};

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const page = parseInt(searchParams.get('page') || '1', 10);
 const limit = parseInt(searchParams.get('limit') || '50', 10);
 const status = searchParams.get('status');
 const search = searchParams.get('search');

 const dateFrom = searchParams.get('date_from');
 const dateTo = searchParams.get('date_to');
 const sortParams = searchParams.get('sort') || 'newest';
 const labId = searchParams.get('lab_id'); 

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct, custom_doctor_billing_fee_pct').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data: feeConfig } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct, doctor_billing_service_fee_pct').limit(1).single();

 let query = supabaseAdmin
 .from('tt_recommendation')
 .select(`
 *,
 patient:patient_id(first_name, last_name, email),
 items:tt_recommendation_item(id, quantity, unit_price, test:tt_test_catalog(name, sku, type, sample_shipping, laboratory:tt_laboratory(name)))
 `, { count: 'exact' })
 .eq('doctor_id', doctor.id);

 if (status && status !== 'all') {
 query = query.eq('status', status);
 }
 if (search) {
 query = query.or(`display_id.ilike.%${search}%`); 
 }
 if (dateFrom) {
 query = query.gte('created_at', new Date(dateFrom).toISOString());
 }
 if (dateTo) {
 // Add 1 day to include the entire 'to' date boundary
 const endDate = new Date(dateTo);
 endDate.setDate(endDate.getDate() + 1);
 query = query.lte('created_at', endDate.toISOString());
 }

 const from = (page - 1) * limit;
 const to = from + limit - 1;

 if (sortParams === 'newest') query = query.order('created_at', { ascending: false });
 if (sortParams === 'oldest') query = query.order('created_at', { ascending: true });
 if (sortParams === 'highest') query = query.order('total_amount', { ascending: false });
 if (sortParams === 'lowest') query = query.order('total_amount', { ascending: true });
 // Note: Patient A-Z sorting cannot natively map through standard PostgREST joins easily here. Will default to created_at if not mapped.

 const { data, count, error } = await query.range(from, to);

 if (error) throw error;

 // Attach item counts, shipping, and total costs
 const mapped = (data || []).map(r => {
 let test_costs_total = 0;
 if (r.items) {
 r.items.forEach((item: any) => {
 test_costs_total += (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
 });
 }

 let serviceFeePct;
 if (r.billing_mode === 'doctor') {
 serviceFeePct = Number(doctor?.custom_doctor_billing_fee_pct ?? feeConfig?.doctor_billing_service_fee_pct ?? 10);
 } else {
 serviceFeePct = Number(doctor?.custom_service_fee_pct ?? feeConfig?.service_fee_pct ?? 15);
 }
 const serviceFee = test_costs_total * (serviceFeePct / 100);

 let highestShipping = 'standard';
 if (r.items) {
 r.items.forEach((item: any) => {
 const mode = item.test?.sample_shipping || 'standard';
 if ((SHIPPING_RANK[mode] || 0) > (SHIPPING_RANK[highestShipping] || 0)) {
 highestShipping = mode;
 }
 });
 }

 const shipping = SHIPPING_COSTS[highestShipping] || 5.0;
 const vat = (serviceFee + shipping) * 0.19;

 return { 
 ...r, 
 items_count: r.items?.length || 0,
 test_costs_total,
 calculated_total: test_costs_total + serviceFee + shipping + vat
 };
 });

 return NextResponse.json({
 data: mapped,
 total: count || 0,
 page,
 limit
 });
 } catch (error: any) {
 console.error("GET doctor recommendations error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const body = await request.json();
 const { 
 patient_id, 
 items, 
 pricing_tier, 
 collection_preference, 
 results_delivery, 
 anamnese_notes, 
 internal_notes, 
 expected_appointment_date 
 } = body;

 if (!patient_id || !Array.isArray(items) || items.length === 0 || !pricing_tier) {
 return NextResponse.json({ error: 'patient_id, items array, and pricing_tier are required' }, { status: 400 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct, custom_doctor_billing_fee_pct').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 // Ensure patient belongs to doctor? Let's just resolve patient
 const { data: patient } = await supabaseAdmin.from('tt_patient').select('id').eq('id', patient_id).single();
 if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

 // Fetch config for fee fallback — use correct fee based on billing mode
 const { data: configData } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct, doctor_billing_service_fee_pct').limit(1).single();

 let serviceFeePct;
 if (body.billing_mode === 'doctor') {
 // Doctor billing fee: custom per-doctor → global doctor billing → fallback 10%
 serviceFeePct = doctor.custom_doctor_billing_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = configData?.doctor_billing_service_fee_pct || 10;
 }
 } else {
 // Patient fee: custom per-doctor → global patient → fallback 15%
 serviceFeePct = doctor.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = configData?.service_fee_pct || 15;
 }
 }

 // Fetch tests to lock prices
 const testIds = items.map(i => i.test_id);
 const { data: catalogTests, error: testsError } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('id, name, sku, type, sample_shipping, lab_cost, price_insured, price_uninsured, price_zone1, price_zone2, price_zone3')
 .in('id', testIds);

 if (testsError) throw testsError;

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';

 const lockedItems = items.map(item => {
 const catalogTest = catalogTests.find(t => t.id === item.test_id);
 if (!catalogTest) throw new Error(`Test ID not found in catalog: ${item.test_id}`);

 const columnMap: Record<string, string> = {
 'insured': 'price_insured',
 'uninsured': 'price_uninsured',
 'zone1': 'price_zone1',
 'zone2': 'price_zone2',
 'zone3': 'price_zone3'
 };
 let unit_price = catalogTest[columnMap[pricing_tier] as keyof typeof catalogTest] || 0;
 test_costs_total += Number(unit_price);

 const shipMode = catalogTest.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }

 return {
 test_id: item.test_id,
 test_type: catalogTest.type,
 quantity: 1,
 unit_price: unit_price,
 lab_cost: catalogTest.lab_cost || 0
 };
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 const vat_base = service_fee + shipping_estimate;
 const vat = vat_base * 0.19; 
 const total_amount = test_costs_total + service_fee + shipping_estimate + vat;

 // Insert Recommendation
 const { data: newRec, error: recError } = await supabaseAdmin
 .from('tt_recommendation')
 .insert({
 doctor_id: doctor.id,
 patient_id: patient_id,
 status: 'created',
 billing_mode: body.billing_mode || 'patient',
 pricing_tier,
 collection_preference: collection_preference || null,
 results_delivery: results_delivery || 'app',
 anamnese_notes: null,
 internal_notes: internal_notes || null,
 expected_appointment_date: expected_appointment_date || null
 })
 .select()
 .single();

 if (recError) throw recError;

 // Insert Items
 const itemsToInsert = lockedItems.map(li => ({
 recommendation_id: newRec.id,
 ...li
 }));

 const { error: itemsError } = await supabaseAdmin
 .from('tt_recommendation_item')
 .insert(itemsToInsert);

 if (itemsError) {
 // Rollback not supported easily without RPC, but this is Phase 1
 throw itemsError; 
 }

 // Calculate materials preview (lightweight — no PDFs, no DHL)
 try {
  const { data: newItems } = await supabaseAdmin
    .from('tt_recommendation_item')
    .select('id, test_id, quantity, lab_id')
    .eq('recommendation_id', newRec.id);

  if (newItems && newItems.length > 0) {
    const testIds = newItems.map(i => i.test_id).filter(Boolean);
    const { data: catalog } = await supabaseAdmin
      .from('tt_test_catalog')
      .select('id, sku, name, lab_id, materials')
      .in('id', testIds);

    const catalogMap = new Map((catalog || []).map(t => [t.id, t]));

    const calcItems = newItems.map(item => {
      const cat = catalogMap.get(item.test_id);
      return {
        test_id: item.test_id || '',
        test_name: cat?.name || '',
        test_sku: cat?.sku || '',
        lab_id: item.lab_id || cat?.lab_id || null,
        materials: Array.isArray(cat?.materials) ? cat.materials : [],
      };
    });

    const calculated = calculateMaterials(calcItems);
    await saveRecommendationMaterials(newRec.id, calculated);
  }
 } catch (matErr) {
  console.error('[Recommendation] Materials preview calculation failed:', matErr);
 }

 // Auto-create order if doctor-pays
 if (body.billing_mode === 'doctor') {
 // Update recommendation status to 'paid' (doctor is paying)
 await supabaseAdmin
 .from('tt_recommendation')
 .update({ 
 billing_mode: 'doctor', 
 status: 'paid',
 paid_at: new Date().toISOString()
 })
 .eq('id', newRec.id);

 // Fee already calculated correctly above — reuse existing values
 const doctorServiceFee = service_fee;
 const doctorVat = vat;
 const doctorTotal = total_amount;

 // Create the order automatically
 const { data: autoOrder, error: orderError } = await supabaseAdmin
 .from('tt_order')
 .insert({
 recommendation_id: newRec.id,
 patient_id: patient_id,
 doctor_id: doctor.id,
 display_id: newRec.display_id,
 status: 'preparing',
 payment_method: 'doctor_invoice',
 total: doctorTotal,
 test_costs_total: test_costs_total,
 service_fee_amount: doctorServiceFee,
 service_fee_pct: serviceFeePct,
 shipping_cost: shipping_estimate,
 vat_amount: doctorVat,
 vat_rate: 19,
 subtotal: test_costs_total + doctorServiceFee + shipping_estimate,
 payment_confirmed_at: new Date().toISOString(),
 })
 .select()
 .single();

 if (orderError) {
 console.error('[Doctor Billing] Order creation failed:', orderError);
 } else {
 // Trigger the order preparation pipeline
 try {
 const { runOrderPreparation } = await import('@/lib/order-preparation');
 await runOrderPreparation(autoOrder.id);
 } catch (pipeErr) {
 console.error('[Doctor Billing] Pipeline trigger failed:', pipeErr);
 }
 }
 }

 return NextResponse.json({
 ...newRec,
 calculated_totals: {
 test_costs_total,
 service_fee,
 shipping_estimate,
 vat,
 total_amount
 }
 });
 } catch (error: any) {
 console.error("POST doctor recommendation error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
