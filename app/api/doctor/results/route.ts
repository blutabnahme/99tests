import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const db = supabaseAdmin();

    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doctor } = await db.from('tt_doctor').select('id').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    // Parse URL params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'doctor_reviewing' | 'released' | null (all)
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all orders for this doctor
    const { data: orders } = await db
      .from('tt_order')
      .select('id')
      .eq('doctor_id', doctor.id);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Get results visible to doctor
    let query = db
      .from('tt_order_result')
      .select(`
        *,
        laboratory:laboratory_id(name, address_city),
        order:order_id(
          id,
          display_id,
          patient:patient_id(id, first_name, last_name, email)
        )
      `)
      .in('order_id', orderIds)
      .in('visibility', ['doctor_and_patient', 'doctor_only'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: results, error } = await query;

    if (error) {
      console.error('[Doctor Results] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json({ results: results || [] });
  } catch (error: any) {
    console.error('[Doctor Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
