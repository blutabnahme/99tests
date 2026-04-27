export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve doctor ID
    const { data: doctor } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get IDs of private labs this doctor has access to
    let accessiblePrivateLabIds: string[] = [];
    if (doctor) {
      const { data: doctorLabs } = await supabaseAdmin
        .from('tt_doctor_laboratory')
        .select('laboratory_id')
        .eq('doctor_id', doctor.id);
      accessiblePrivateLabIds = (doctorLabs || []).map((dl: any) => dl.laboratory_id);
    }

    // Get all private lab IDs
    const { data: privateLabs } = await supabaseAdmin
      .from('tt_laboratory')
      .select('id')
      .eq('is_private', true);
    const allPrivateLabIds = (privateLabs || []).map((l: any) => l.id);

    // Labs to exclude: private labs the doctor does NOT have access to
    const excludedLabIds = allPrivateLabIds.filter(id => !accessiblePrivateLabIds.includes(id));

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const labId = searchParams.get('lab_id') || '';
    const favoritesOnly = searchParams.get('favorites_only') === 'true';
    const sort = searchParams.get('sort') || 'name';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('tt_test_catalog')
      .select('*, laboratory:tt_laboratory(name)', { count: 'exact' })
      .eq('is_active', true);

    // Exclude tests from private labs the doctor can't access
    if (excludedLabIds.length > 0) {
      query = query.not('lab_id', 'in', `(${excludedLabIds.join(',')})`);
    }

    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('name');
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (labId && labId !== 'all') {
      query = query.eq('lab_id', labId);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Catalog API error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Doctor catalog error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
