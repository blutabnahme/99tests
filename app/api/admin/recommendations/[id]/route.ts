/* eslint-disable */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    // 1. Recommendation with patient + doctor
    const { data: rec, error: recError } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        *,
        patient:patient_id(*),
        doctor:doctor_id(id, full_name, practice_name, email, phone)
      `)
      .eq('id', params.id)
      .single();

    if (recError || !rec) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    // 2. Items with test + lab info
    const { data: items } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select(`
        *,
        test:test_id(id, name, sku, type, goae_digit, goae_cost, lab:lab_id(id, name))
      `)
      .eq('recommendation_id', params.id)
      .order('created_at', { ascending: true });

    // 3. Linked order (if exists)
    const { data: order } = await supabaseAdmin
      .from('tt_order')
      .select('id, display_id, status, total, payment_method, payment_confirmed_at, created_at, preparation_status, dhl_tracking_outbound, dhl_tracking_return')
      .eq('recommendation_id', params.id)
      .maybeSingle();

    // 4. Calculated materials
    const { data: materials } = await supabaseAdmin
      .from('tt_recommendation_material')
      .select(`
        *,
        material:material_id(id, code, name, tube_type, tube_color, measurement_type),
        laboratory:laboratory_id(id, name)
      `)
      .eq('recommendation_id', params.id);

    // Compute totals
    const testTotal = (items || []).reduce((sum, item) => sum + (Number(item.unit_price) || 0) * (Number(item.quantity) || 1), 0);
    const labs = Array.from(new Set((items || []).map((item: any) => item.test?.lab?.name).filter(Boolean)));

    return NextResponse.json({
      recommendation: rec,
      items: items || [],
      order: order || null,
      materials: materials || [],
      computed: { test_total: testTotal, labs },
    });
  } catch (err: unknown) {
    console.error('GET admin recommendation detail error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      const { error } = await supabaseAdmin
        .from('tt_recommendation')
        .update({ status: 'cancelled' })
        .eq('id', params.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    console.error('PATCH admin recommendation error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
