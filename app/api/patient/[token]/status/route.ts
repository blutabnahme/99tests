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
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  try {
    // 1. Look up token → recommendation_id
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from('tt_patient_token')
      .select('recommendation_id')
      .eq('token', token)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // 2. Fetch recommendation with relations
    const { data: recData, error: recError } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        *,
        doctor:doctor_id(id, practice_name, full_name, custom_service_fee_pct),
        patient:patient_id(id, first_name, last_name, email),
        items:tt_recommendation_item(
          id, quantity, unit_price, test_type,
          test:test_id(name, sku, sample_shipping, preanalytics, type)
        )
      `)
      .eq('id', tokenRecord.recommendation_id)
      .single();

    if (recError || !recData) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 3. Fetch order
    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('*')
      .eq('recommendation_id', recData.id)
      .maybeSingle();

    // 4. Collect preanalytics
    const preanalyticsList: string[] = [];
    (recData.items || []).forEach((item: any) => {
      if (item.test?.preanalytics && !preanalyticsList.includes(item.test.preanalytics)) {
        preanalyticsList.push(item.test.preanalytics);
      }
    });

    return NextResponse.json({
      recommendation: recData,
      order: order || null,
      preanalytics: preanalyticsList,
    });
  } catch (error: any) {
    console.error('Status endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
