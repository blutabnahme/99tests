export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
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

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // 1. Orders count — this month vs last month
    const { count: ordersThisMonth } = await supabaseAdmin
      .from('tt_order')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonthStart);

    const { count: ordersLastMonth } = await supabaseAdmin
      .from('tt_order')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd);

    // 2. Revenue this month
    const { data: revenueData } = await supabaseAdmin
      .from('tt_order')
      .select('total')
      .gte('created_at', thisMonthStart)
      .not('status', 'eq', 'awaiting_payment');

    const revenueThisMonth = (revenueData || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const { data: revenueLastData } = await supabaseAdmin
      .from('tt_order')
      .select('total')
      .gte('created_at', lastMonthStart)
      .lte('created_at', lastMonthEnd)
      .not('status', 'eq', 'awaiting_payment');

    const revenueLastMonth = (revenueLastData || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // 3. Pending actions
    const { count: awaitingPayment } = await supabaseAdmin
      .from('tt_order')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'awaiting_payment');

    // 4. Active doctors
    const { count: activeDoctors } = await supabaseAdmin
      .from('tt_order')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    // 5. Pipeline status breakdown
    const { data: allOrders } = await supabaseAdmin
      .from('tt_order')
      .select('status')
      .not('status', 'in', '("completed","cancelled")');

    const pipelineBreakdown: Record<string, number> = {};
    (allOrders || []).forEach(o => {
      const s = o.status || 'unknown';
      pipelineBreakdown[s] = (pipelineBreakdown[s] || 0) + 1;
    });

    // 6. Recent orders (last 8)
    const { data: recentOrders } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, status, total, payment_method, created_at,
        patient:patient_id(first_name, last_name),
        doctor:doctor_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(8);

    // 7. Pending bank transfers
    const { data: pendingTransfers } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, total, created_at,
        patient:patient_id(first_name, last_name, email),
        recommendation:recommendation_id(display_id)
      `)
      .eq('status', 'awaiting_payment')
      .eq('payment_method', 'bank_transfer')
      .order('created_at', { ascending: true });

    // 8. Revenue by month (last 6 months) for chart
    const revenueByMonth: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = mStart.toLocaleString('en', { month: 'short', year: '2-digit' });

      const { data: mOrders } = await supabaseAdmin
        .from('tt_order')
        .select('total')
        .gte('created_at', mStart.toISOString())
        .lte('created_at', mEnd.toISOString())
        .not('status', 'eq', 'awaiting_payment');

      const mRevenue = (mOrders || []).reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      revenueByMonth.push({ month: monthLabel, revenue: mRevenue, orders: mOrders?.length || 0 });
    }

    // 9. Kanban — all active orders grouped by status
    const { data: kanbanOrders } = await supabaseAdmin
      .from('tt_order')
      .select(`
        id, display_id, status, total, payment_method, created_at,
        patient:patient_id(first_name, last_name),
        preparation_status
      `)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: true })
      .limit(100);

    // 10. Pending doctor verifications
    const { data: pendingVerifications } = await supabaseAdmin
      .from('tt_doctor')
      .select('id, full_name, email, practice_name, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    return NextResponse.json({
      metrics: {
        orders_this_month: ordersThisMonth || 0,
        orders_last_month: ordersLastMonth || 0,
        revenue_this_month: revenueThisMonth,
        revenue_last_month: revenueLastMonth,
        awaiting_payment: awaitingPayment || 0,
        active_doctors: activeDoctors || 0,
      },
      pipeline: pipelineBreakdown,
      kanban_orders: kanbanOrders || [],
      recent_orders: recentOrders || [],
      pending_transfers: pendingTransfers || [],
      revenue_chart: revenueByMonth,
      pending_verifications: pendingVerifications || [],
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
