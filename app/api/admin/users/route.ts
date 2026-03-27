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

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'admins') {
      try {
        let allUsers: any[] = [];
        let page = 1;
        const perPage = 50;
        let hasMore = true;
        
        while (hasMore) {
          const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
            page,
            perPage,
          });
          
          if (error) {
            console.error('listUsers error on page', page, error);
            break;
          }
          
          allUsers = [...allUsers, ...users];
          hasMore = users.length === perPage;
          page++;
        }
        
        const adminUsers = allUsers.filter(u => 
          u.user_metadata?.role === 'admin' || 
          u.app_metadata?.role === 'admin' ||
          u.email === 'admin@99tests.de' 
        );
        
        const mapped = adminUsers.map(u => ({
          id: u.id,
          name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown',
          email: u.email,
          status: u.banned_until ? 'suspended' : 'active',
          created_at: u.created_at,
          last_sign_in: u.last_sign_in_at || null,
        }));
        
        return NextResponse.json({ users: mapped, count: mapped.length, currentUserId: user.id });
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
        return NextResponse.json({ users: [], count: 0, error: 'Failed to fetch admin users' });
      }
    }

    // Healthcare Companies with recommendation counts and spend
    const { data: hcs } = await supabaseAdmin
      .from('doctor_practice')
      .select('*, recommendation(id, payment(b2b_fee, material_revenue, logistics_revenue))')
      .order('created_at', { ascending: false });

    // Blood Collectors
    const { data: bcs } = await supabaseAdmin
      .from('blood_collector')
      .select('*')
      .order('created_at', { ascending: false });

    // Patients with Doctor name
    const { data: patients } = await supabaseAdmin
      .from('patient')
      .select('*, doctor_practice:doctor_id(name), recommendation(id)')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      hcs: hcs || [],
      bcs: bcs || [],
      patients: patients || [],
      currentUserId: user.id
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { action, userId, table, status } = await request.json();

    if (action === 'update_status') {
      const { error } = await supabaseAdmin.from(table).update({ status }).eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'flag_review') {
      const { error } = await supabaseAdmin.from('blood_collector').update({ status: 'pending_review' }).eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
