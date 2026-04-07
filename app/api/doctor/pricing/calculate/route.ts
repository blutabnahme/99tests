export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { patient_id, items } = await request.json();
 if (!patient_id || !Array.isArray(items) || items.length === 0) {
 return NextResponse.json({ error: 'patient_id and non-empty items array are required' }, { status: 400 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data: patient } = await supabaseAdmin.from('tt_patient').select('address_country, insured_status').eq('id', patient_id).single();
 if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

 // Determine Pricing Tier
 let pricingTier = 'insured';
 if (patient.address_country === 'DE') {
 if (patient.insured_status === 'privat_versichert') {
 pricingTier = 'insured';
 } else {
 pricingTier = 'uninsured';
 }
 } else {
 pricingTier = 'zone1'; // Simplistic fallback for non-DE
 }

 // Determine Base Service Fee Pct
 let serviceFeePct = doctor.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 const { data: config } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct').limit(1).single();
 serviceFeePct = config?.service_fee_pct || 15;
 }

 // Fetch tests
 const testIds = items.map(i => i.test_id);
 const { data: catalogTests, error: testsError } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('id, name, sku, sample_shipping, lab_cost, price_insured, price_uninsured, price_zone1, price_zone2, price_zone3')
 .in('id', testIds);

 if (testsError) throw testsError;

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';

 const itemDetails = items.map(item => {
 const catalogTest = catalogTests.find(t => t.id === item.test_id);
 if (!catalogTest) throw new Error(`Test ID not found in catalog: ${item.test_id}`);

 // Extract requested tier's price
 const columnMap: Record<string, string> = {
 'insured': 'price_insured',
 'uninsured': 'price_uninsured',
 'zone1': 'price_zone1',
 'zone2': 'price_zone2',
 'zone3': 'price_zone3'
 };
 const unit_price = Number((catalogTest as any)[columnMap[pricingTier]]) || 0;
 test_costs_total += unit_price;

 // Track highest shipping tier
 const shipMode = catalogTest.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }

 return {
 test_id: item.test_id,
 name: catalogTest.name,
 sku: catalogTest.sku,
 quantity: 1,
 unit_price,
 total_price: unit_price,
 lab_cost: catalogTest.lab_cost
 };
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 
 // VAT applies only to service fee and shipping
 const vat_base = service_fee + shipping_estimate;
 const vat = vat_base * 0.19; // 19% German VAT

 const total = test_costs_total + service_fee + shipping_estimate + vat;

 return NextResponse.json({
 pricing_tier: pricingTier,
 service_fee_pct: serviceFeePct,
 test_costs_total,
 service_fee,
 shipping_estimate,
 shipping_tier_applied: highestShippingLabel,
 vat,
 total,
 items: itemDetails
 });

 } catch (error: any) {
 console.error("POST doctor pricing calculate error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
