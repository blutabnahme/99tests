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
    const payment_method = searchParams.get('payment_method');
    const doctor_id = searchParams.get('doctor_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('tt_order')
      .select(`
        *,
        patient:patient_id(id, first_name, last_name, email),
        doctor:doctor_id(id, full_name, practice_name),
        recommendation:recommendation_id(id, display_id, status)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (payment_method && payment_method !== 'all') {
      query = query.eq('payment_method', payment_method);
    }

    if (doctor_id && doctor_id !== 'all') {
      query = query.eq('doctor_id', doctor_id);
    }
    if (date_from) {
      query = query.gte('created_at', `${date_from}T00:00:00Z`);
    }
    if (date_to) {
      query = query.lte('created_at', `${date_to}T23:59:59Z`);
    }

    if (search) {
      // Search by display_id, patient name, or recommendation display_id
      query = query.or(`display_id.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('GET admin orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
