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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const doctor_id = searchParams.get('doctor_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const sort = searchParams.get('sort') || 'newest';

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('tt_recommendation')
      .select(`
        id, display_id, status, pricing_tier, collection_preference, created_at, sent_at, paid_at, magic_link,
        patient:patient_id(id, first_name, last_name, email),
        doctor:doctor_id(id, full_name, practice_name)
      `, { count: 'exact' });

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.neq('status', 'cancelled');
      } else {
        query = query.eq('status', status);
      }
    }

    // Search
    if (search) {
      query = query.or(`display_id.ilike.%${search}%`);
    }

    // Doctor filter
    if (doctor_id && doctor_id !== 'all') {
      query = query.eq('doctor_id', doctor_id);
    }

    // Date range
    if (date_from) {
      query = query.gte('created_at', `${date_from}T00:00:00Z`);
    }
    if (date_to) {
      query = query.lte('created_at', `${date_to}T23:59:59Z`);
    }

    // Sort
    const ascending = sort === 'oldest';
    query = query.order('created_at', { ascending });

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    // Fetch item counts + lab info for each recommendation
    const recIds = (data || []).map((r: any) => r.id);
    const itemsMap = new Map<string, { count: number; labs: string[]; total: number }>();

    if (recIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('tt_recommendation_item')
        .select('recommendation_id, unit_price, quantity, test:test_id(lab:lab_id(name))')
        .in('recommendation_id', recIds);

      (items || []).forEach((item: any) => {
        const rid = item.recommendation_id;
        if (!itemsMap.has(rid)) itemsMap.set(rid, { count: 0, labs: [], total: 0 });
        const entry = itemsMap.get(rid)!;
        entry.count++;
        entry.total += (Number(item.unit_price) || 0) * (Number(item.quantity) || 1);
        const labName = (item.test as any)?.lab?.name;
        if (labName && !entry.labs.includes(labName)) entry.labs.push(labName);
      });
    }

    const transformed = (data || []).map((r: any) => {
      const info = itemsMap.get(r.id) || { count: 0, labs: [], total: 0 };
      return {
        ...r,
        item_count: info.count,
        labs: info.labs,
        test_total: info.total,
      };
    });

    return NextResponse.json({
      data: transformed,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('GET admin recommendations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
