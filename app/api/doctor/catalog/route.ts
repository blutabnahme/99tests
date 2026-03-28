export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const lab_id = searchParams.get('lab_id');
    const search = searchParams.get('search');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin.from('tt_test_catalog').select(`*, lab:lab_id(name)`, { count: 'exact' }).eq('is_active', true);

    if (type && type.toLowerCase() !== 'all') {
      query = query.eq('type', type.toLowerCase());
    }
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (lab_id && lab_id !== 'all') {
      query = query.eq('lab_id', lab_id);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query.order('name', { ascending: true }).range(from, to);

    if (error) throw error;

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit
    });
  } catch (error: any) {
    console.error("GET doctor catalog error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
