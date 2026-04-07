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

    // 1. Patient profile
    const { data: patient, error } = await supabaseAdmin
      .from('tt_patient')
      .select(`
        *,
        doctor:doctor_id(id, full_name, practice_name, email)
      `)
      .eq('id', params.id)
      .single();

    if (error || !patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    // 2. Recommendations for this patient
    const { data: recommendations } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        id, display_id, status, created_at, sent_at, paid_at,
        doctor:doctor_id(id, full_name)
      `)
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch item counts + totals
    const recIds = (recommendations || []).map(r => r.id);
    const recItemsMap = new Map<string, { count: number; total: number }>();
    if (recIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('tt_recommendation_item')
        .select('recommendation_id, unit_price, quantity')
        .in('recommendation_id', recIds);
      (items || []).forEach((item: any) => {
        const rid = item.recommendation_id;
        if (!recItemsMap.has(rid)) recItemsMap.set(rid, { count: 0, total: 0 });
        const entry = recItemsMap.get(rid)!;
        entry.count++;
        entry.total += (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
      });
    }

    const enrichedRecs = (recommendations || []).map(r => ({
      ...r,
      item_count: recItemsMap.get(r.id)?.count || 0,
      test_total: recItemsMap.get(r.id)?.total || 0,
    }));

    // 3. Orders for this patient
    const { data: orders } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, status, total, payment_method, created_at,
        recommendation:recommendation_id(display_id)
      `)
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // 4. Stats
    const totalSpent = (orders || [])
      .filter(o => o.status !== 'awaiting_payment' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const stats = {
      total_recommendations: enrichedRecs.length,
      total_orders: (orders || []).length,
      total_spent: totalSpent,
    };

    return NextResponse.json({
      patient,
      recommendations: enrichedRecs,
      orders: orders || [],
      stats,
    });
  } catch (error: any) {
    console.error('GET patient detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
