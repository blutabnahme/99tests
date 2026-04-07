import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const labId = searchParams.get('lab_id') || '';
  const favoritesOnly = searchParams.get('favorites_only') === 'true';

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('tt_test_catalog')
    .select('*, laboratory:tt_laboratory(name)', { count: 'exact' })
    .eq('is_active', true);

  const sort = searchParams.get('sort') || 'name';

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
    query = query.eq('laboratory_id', labId);
  }

  // TODO: If favoritesOnly, filter by doctor's favorites
  // This requires knowing the doctor's ID from auth
  // For now, return all and let frontend filter

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
}
