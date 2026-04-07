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

    // 1. Doctor profile
    const { data: doctor, error } = await supabaseAdmin
      .from('tt_doctor')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });

    // 2. Recommendations
    const { data: recommendations } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        id, display_id, status, created_at, sent_at, paid_at,
        patient:patient_id(id, first_name, last_name)
      `)
      .eq('doctor_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch item counts + totals per recommendation
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

    // Check which recommendations have orders
    const orderMap = new Map<string, { orderId: string; orderStatus: string; orderDisplayId: string; total: number }>();
    if (recIds.length > 0) {
      const { data: recOrders } = await supabaseAdmin
        .from('tt_order')
        .select('id, display_id, status, total, recommendation_id')
        .in('recommendation_id', recIds);
      (recOrders || []).forEach((o: any) => {
        orderMap.set(o.recommendation_id, { orderId: o.id, orderStatus: o.status, orderDisplayId: o.display_id, total: Number(o.total) || 0 });
      });
    }

    const enrichedRecs = (recommendations || []).map(r => ({
      ...r,
      item_count: recItemsMap.get(r.id)?.count || 0,
      test_total: recItemsMap.get(r.id)?.total || 0,
      order: orderMap.get(r.id) || null,
    }));

    // 4. Patients
    const { data: patients } = await supabaseAdmin
      .from('tt_patient')
      .select('id, first_name, last_name, email, phone, date_of_birth, insured_status, is_minor, created_at')
      .eq('doctor_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50);

    // 5. Revenue stats
    const totalRevenue = Array.from(orderMap.values())
      .filter(o => o.orderStatus !== 'awaiting_payment' && o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const stats = {
      total_recommendations: enrichedRecs.length,
      total_orders: orderMap.size,
      total_patients: (patients || []).length,
      total_revenue: totalRevenue,
      paid_recommendations: enrichedRecs.filter(r => r.status === 'paid').length,
    };

    return NextResponse.json({
      doctor,
      recommendations: enrichedRecs,
      patients: patients || [],
      stats,
    });
  } catch (error: any) {
    console.error('GET doctor detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
