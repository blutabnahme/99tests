export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { calculateMaterials, saveRecommendationMaterials } from '@/lib/materials-calculator';

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct, custom_doctor_billing_fee_pct').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data, error } = await supabaseAdmin
 .from('tt_recommendation')
 .select(`
 *,
 patient:patient_id(*),
 order:tt_order(payment_method),
 items:tt_recommendation_item(
 id, quantity, unit_price, lab_cost, test_type,
 test:test_id(*, laboratory:tt_laboratory(name))
 )
 `)
 .eq('id', id)
 .eq('doctor_id', doctor.id)
 .single();

 if (error) throw error;

 // Auto-generate magic link if sent but missing
 if (data.status !== 'created' && !data.magic_link) {
 const generatedToken = crypto.randomUUID();
 const expiresAt = new Date();
 expiresAt.setDate(expiresAt.getDate() + 30);

 const { error: tokenError } = await supabaseAdmin
 .from('tt_patient_token')
 .insert({
 token: generatedToken,
 recommendation_id: id,
 patient_id: data.patient_id,
 expires_at: expiresAt.toISOString(),
 });

 if (!tokenError) {
 const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
 const newMagicLink = `${baseUrl}/patient/${generatedToken}`;
 
 await supabaseAdmin
 .from('tt_recommendation')
 .update({ magic_link: newMagicLink })
 .eq('id', id);
 
 data.magic_link = newMagicLink;
 }
 }

 const { data: feeConfig } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct, doctor_billing_service_fee_pct').limit(1).single();

 let serviceFeePct;
 if (data.billing_mode === 'doctor') {
 serviceFeePct = doctor.custom_doctor_billing_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = feeConfig?.doctor_billing_service_fee_pct || 10;
 }
 } else {
 serviceFeePct = doctor.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = feeConfig?.service_fee_pct || 15;
 }
 }

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';

 (data.items || []).forEach((item: any) => {
 const item_sub = Number((item.unit_price || 0) * (item.quantity || 1));
 test_costs_total += item_sub;

 const shipMode = item.test?.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 const vat_base = service_fee + shipping_estimate;
 const vat = vat_base * 0.19; 
 const total_amount = test_costs_total + service_fee + shipping_estimate + vat;

 data.test_costs_total = test_costs_total;
 data.service_fee_pct = serviceFeePct;
 data.service_fee = service_fee;
 data.shipping_estimate = shipping_estimate;
 data.shipping_tier_applied = highestShippingLabel;
 data.vat = vat;
 data.total_amount = total_amount;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error(`GET doctor recommendation ${params.id} error:`, error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;
 const { items, pricing_tier, collection_preference, results_delivery, anamnese_notes, internal_notes, expected_appointment_date } = await request.json();

 if (!Array.isArray(items) || items.length === 0 || !pricing_tier) {
 return NextResponse.json({ error: 'items array and pricing_tier are required' }, { status: 400 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct, custom_doctor_billing_fee_pct').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data: rec } = await supabaseAdmin.from('tt_recommendation').select('status, id, patient_id').eq('id', id).eq('doctor_id', doctor.id).single();
 if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
 if (rec.status !== 'created') return NextResponse.json({ error: 'Cannot update recommendation that has already been sent' }, { status: 400 });

 // Calculate new totals
 // Get billing mode from existing recommendation
 const { data: existingRec } = await supabaseAdmin.from('tt_recommendation').select('billing_mode').eq('id', id).single();

 const { data: feeConfig } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct, doctor_billing_service_fee_pct').limit(1).single();

 let serviceFeePct;
 if (existingRec?.billing_mode === 'doctor') {
 serviceFeePct = doctor.custom_doctor_billing_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = feeConfig?.doctor_billing_service_fee_pct || 10;
 }
 } else {
 serviceFeePct = doctor.custom_service_fee_pct;
 if (serviceFeePct === null || serviceFeePct === undefined) {
 serviceFeePct = feeConfig?.service_fee_pct || 15;
 }
 }

 const testIds = items.map(i => i.test_id);
 const { data: catalogTests } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('id, name, sku, type, sample_shipping, lab_cost, price_insured, price_uninsured, price_zone1, price_zone2, price_zone3')
 .in('id', testIds);

 let test_costs_total = 0;
 let highestShippingLabel = 'standard';

 const lockedItems = items.map(item => {
 const catalogTest = catalogTests?.find(t => t.id === item.test_id);
 if (!catalogTest) throw new Error(`Test ID not found in catalog: ${item.test_id}`);

 const columnMap: Record<string, string> = {
 'insured': 'price_insured',
 'uninsured': 'price_uninsured',
 'zone1': 'price_zone1',
 'zone2': 'price_zone2',
 'zone3': 'price_zone3'
 };
 let unit_price = catalogTest[columnMap[pricing_tier] as keyof typeof catalogTest] || 0;
 let total_item_price = Number(unit_price) * (item.quantity || 1);
 test_costs_total += total_item_price;

 const shipMode = catalogTest.sample_shipping || 'standard';
 if (SHIPPING_RANK[shipMode] > SHIPPING_RANK[highestShippingLabel]) {
 highestShippingLabel = shipMode;
 }

 return {
 recommendation_id: id,
 test_id: item.test_id,
 test_type: catalogTest.type,
 quantity: item.quantity || 1,
 unit_price: unit_price,
 lab_cost: catalogTest.lab_cost || 0
 };
 });

 const shipping_estimate = SHIPPING_COSTS[highestShippingLabel] || 0;
 const service_fee = test_costs_total * (serviceFeePct / 100);
 const vat_base = service_fee + shipping_estimate;
 const vat = vat_base * 0.19; 
 const total_amount = test_costs_total + service_fee + shipping_estimate + vat;

 // Delete old items
 await supabaseAdmin.from('tt_recommendation_item').delete().eq('recommendation_id', id);

 // Insert new items
 await supabaseAdmin.from('tt_recommendation_item').insert(lockedItems);

 // Update recommendation body
 const { data: updatedRec, error: recError } = await supabaseAdmin
 .from('tt_recommendation')
 .update({
 pricing_tier,
 collection_preference: collection_preference || null,
 results_delivery: results_delivery || 'app',
 anamnese_notes: anamnese_notes || null,
 internal_notes: internal_notes || null,
 expected_appointment_date: expected_appointment_date || null
 })
 .eq('id', id)
 .select()
 .single();

 if (recError) throw recError;

 // Calculate materials preview (lightweight — no PDFs, no DHL)
 try {
  const { data: newItems } = await supabaseAdmin
    .from('tt_recommendation_item')
    .select('id, test_id, quantity, lab_id')
    .eq('recommendation_id', updatedRec.id);

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
    await saveRecommendationMaterials(updatedRec.id, calculated);
  }
 } catch (matErr) {
  console.error('[Recommendation] Materials preview calculation failed:', matErr);
 }

 return NextResponse.json({
 ...updatedRec,
 calculated_totals: {
 test_costs_total,
 service_fee,
 shipping_estimate,
 vat,
 total_amount
 }
 });
 } catch (error: any) {
 console.error(`PUT doctor recommendation ${params.id} error:`, error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data: rec } = await supabaseAdmin.from('tt_recommendation').select('status, id').eq('id', id).eq('doctor_id', doctor.id).single();
 if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
 if (rec.status !== 'created') return NextResponse.json({ error: 'Cannot delete recommendation that has already been sent' }, { status: 400 });

 // Delete items
 await supabaseAdmin.from('tt_recommendation_item').delete().eq('recommendation_id', id);

 // Delete rec
 const { error } = await supabaseAdmin.from('tt_recommendation').delete().eq('id', id);
 if (error) throw error;

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error(`DELETE doctor recommendation ${params.id} error:`, error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;
 const body = await request.json();

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 // If just updating status (like soft delete)
 if (body.status && Object.keys(body).length === 1) {
 const { error: updateError } = await supabaseAdmin
 .from('tt_recommendation')
 .update({ status: body.status })
 .eq('id', id)
 .eq('doctor_id', doctor.id);

 if (updateError) throw updateError;
 return NextResponse.json({ success: true });
 }

 // Full update (edit mode)
 const { patient_id, items, pricing_tier, collection_preference, results_delivery,
 anamnese_notes, internal_notes, expected_appointment_date } = body;

 let effectivePricingTier = pricing_tier;
 if (!effectivePricingTier) {
 const { data: existingRec } = await supabaseAdmin
 .from('tt_recommendation')
 .select('pricing_tier')
 .eq('id', id)
 .single();
 effectivePricingTier = existingRec?.pricing_tier || 'uninsured';
 }

 // Update recommendation fields
 const { error: recError } = await supabaseAdmin
 .from('tt_recommendation')
 .update({
 patient_id,
 pricing_tier,
 collection_preference,
 results_delivery,
 anamnese_notes,
 internal_notes,
 expected_appointment_date
 })
 .eq('id', id)
 .eq('doctor_id', doctor.id);

 if (recError) throw recError;

 // Replace items: delete existing, insert new
 if (items) {
 await supabaseAdmin
 .from('tt_recommendation_item')
 .delete()
 .eq('recommendation_id', id);

      if (items.length > 0) {
        const itemRows: any[] = [];

        for (const item of items) {
          const { data: test } = await supabaseAdmin
            .from('tt_test_catalog')
            .select('type, price_insured, price_uninsured, price_zone1, price_zone2, price_zone3, lab_cost')
            .eq('id', item.test_id)
            .single();

          const priceMap: Record<string, string> = {
            'insured': 'price_insured',
            'uninsured': 'price_uninsured',
            'zone1': 'price_zone1',
            'zone2': 'price_zone2',
            'zone3': 'price_zone3',
          };

          const priceColumn = priceMap[effectivePricingTier] || 'price_uninsured';
          const unitPrice = Number(test?.[priceColumn as keyof typeof test]) || 0;

          itemRows.push({
            recommendation_id: id,
            test_id: item.test_id,
            quantity: item.quantity || 1,
            unit_price: unitPrice,
            lab_cost: test?.lab_cost || 0,
            test_type: test?.type || 'parameter',
          });
        }

        const { error: itemsError } = await supabaseAdmin
          .from('tt_recommendation_item')
          .insert(itemRows);

        if (itemsError) throw itemsError;
      }
 }

 return NextResponse.json({ success: true });
 } catch (error: any) {
 console.error(`PATCH doctor recommendation ${params.id} error:`, error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
