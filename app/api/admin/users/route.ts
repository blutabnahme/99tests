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
    const type = searchParams.get('type') || 'doctors';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const sort = searchParams.get('sort') || 'newest';
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (type === 'doctors') {
      const verificationStatus = searchParams.get('verification_status');
      const specialty = searchParams.get('specialty');
      const hasCustomFee = searchParams.get('has_custom_fee');

      let query = supabaseAdmin
        .from('tt_doctor')
        .select('id, user_id, full_name, email, phone, practice_name, specialty, license_number, is_active, verification_status, custom_service_fee_pct, created_at', { count: 'exact' });

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,practice_name.ilike.%${search}%`);
      }
      if (verificationStatus && verificationStatus !== 'all') {
        query = query.eq('verification_status', verificationStatus);
      }
      if (specialty && specialty !== 'all') {
        query = query.ilike('specialty', `%${specialty}%`);
      }
      if (hasCustomFee === 'yes') {
        query = query.not('custom_service_fee_pct', 'is', null);
      } else if (hasCustomFee === 'no') {
        query = query.is('custom_service_fee_pct', null);
      }
      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59Z`);
      }

      // Sorting
      if (sort === 'name_asc') {
        query = query.order('full_name', { ascending: true });
      } else if (sort === 'name_desc') {
        query = query.order('full_name', { ascending: false });
      } else if (sort === 'email_asc') {
        query = query.order('email', { ascending: true });
      } else if (sort === 'email_desc') {
        query = query.order('email', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      // Fetch recommendation counts
      const doctorIds = (data || []).map(d => d.id);
      const recCountMap = new Map<string, number>();
      if (doctorIds.length > 0) {
        const { data: recCounts } = await supabaseAdmin
          .from('tt_recommendation')
          .select('doctor_id')
          .in('doctor_id', doctorIds);
        (recCounts || []).forEach((r: any) => {
          recCountMap.set(r.doctor_id, (recCountMap.get(r.doctor_id) || 0) + 1);
        });
      }

      const transformed = (data || []).map(d => ({
        ...d,
        recommendation_count: recCountMap.get(d.id) || 0,
      }));

      // Sort by recommendation count if requested (post-query since it's computed)
      if (sort === 'recs_desc') {
        transformed.sort((a, b) => b.recommendation_count - a.recommendation_count);
      } else if (sort === 'recs_asc') {
        transformed.sort((a, b) => a.recommendation_count - b.recommendation_count);
      }

      return NextResponse.json({ data: transformed, total: count || 0, page, limit });
    }

    if (type === 'patients') {
      const insurance = searchParams.get('insurance');
      const doctorId = searchParams.get('doctor_id');
      const isMinor = searchParams.get('is_minor');

      let query = supabaseAdmin
        .from('tt_patient')
        .select(`
          id, first_name, last_name, email, phone, date_of_birth, gender, is_minor,
          address_city, address_country, insured_status, created_at,
          doctor:doctor_id(id, full_name)
        `, { count: 'exact' });

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (insurance && insurance !== 'all') {
        query = query.eq('insured_status', insurance);
      }
      if (doctorId && doctorId !== 'all') {
        query = query.eq('doctor_id', doctorId);
      }
      if (isMinor === 'yes') {
        query = query.eq('is_minor', true);
      } else if (isMinor === 'no') {
        query = query.eq('is_minor', false);
      }
      if (dateFrom) {
        query = query.gte('created_at', `${dateFrom}T00:00:00Z`);
      }
      if (dateTo) {
        query = query.lte('created_at', `${dateTo}T23:59:59Z`);
      }

      // Sorting
      if (sort === 'name_asc') {
        query = query.order('last_name', { ascending: true });
      } else if (sort === 'name_desc') {
        query = query.order('last_name', { ascending: false });
      } else if (sort === 'email_asc') {
        query = query.order('email', { ascending: true });
      } else if (sort === 'email_desc') {
        query = query.order('email', { ascending: false });
      } else if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      return NextResponse.json({ data: data || [], total: count || 0, page, limit });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('GET admin users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
