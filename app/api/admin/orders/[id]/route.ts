export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request, context: any) {
  const { params } = context;
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch order with all relations
    const { data: order, error } = await supabaseAdmin
      .from('tt_order')
      .select(`
        *,
        patient:patient_id(id, first_name, last_name, email, phone, date_of_birth, gender, address_line1, address_zip, address_city, address_country, insured_status),
        doctor:doctor_id(id, full_name, practice_name, email, phone),
        recommendation:recommendation_id(id, display_id, status, collection_preference, results_delivery, anamnese_notes, internal_notes, created_at, sent_at, paid_at)
      `)
      .eq('id', params.id)
      .single();

    if (error) throw error;
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch recommendation items
    const { data: items } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select(`
        id, quantity, unit_price, lab_cost, test_type,
        test:test_id(id, name, sku, type, laboratory:lab_id(id, name))
      `)
      .eq('recommendation_id', order.recommendation_id);

    // Fetch calculated materials (packing list)
    const { data: materials } = await supabaseAdmin
      .from('tt_recommendation_material')
      .select(`
        *,
        material:material_id(id, code, name, tube_type, tube_color, default_volume, default_unit, measurement_type),
        laboratory:laboratory_id(id, name)
      `)
      .eq('recommendation_id', order.recommendation_id)
      .order('laboratory_id', { ascending: true });

    return NextResponse.json({
      ...order,
      items: items || [],
      calculated_materials: materials || [],
    });
  } catch (error: any) {
    console.error('GET admin order detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
