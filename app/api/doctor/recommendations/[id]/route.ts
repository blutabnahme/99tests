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

    const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        *,
        patient:patient_id(first_name, last_name, email, phone, date_of_birth, gender),
        items:tt_recommendation_item(
          id, quantity, unit_price, lab_cost, test_type,
          test:test_id(name, sku, sample_shipping)
        )
      `)
      .eq('id', id)
      .eq('doctor_id', doctor.id)
      .single();

    if (error) throw error;

    let serviceFeePct = doctor.custom_service_fee_pct;
    if (serviceFeePct === null || serviceFeePct === undefined) {
      const { data: config } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct').limit(1).single();
      serviceFeePct = config?.service_fee_pct || 15;
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

    const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id, custom_service_fee_pct').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { data: rec } = await supabaseAdmin.from('tt_recommendation').select('status, id, patient_id').eq('id', id).eq('doctor_id', doctor.id).single();
    if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    if (rec.status !== 'created') return NextResponse.json({ error: 'Cannot update recommendation that has already been sent' }, { status: 400 });

    // Calculate new totals
    let serviceFeePct = doctor.custom_service_fee_pct;
    if (serviceFeePct === null || serviceFeePct === undefined) {
      const { data: config } = await supabaseAdmin.from('tt_service_config').select('service_fee_pct').limit(1).single();
      serviceFeePct = config?.service_fee_pct || 15;
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
