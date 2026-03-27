export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Define the admin client inline as requested
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const type = searchParams.get('type') || 'all';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const from = (page - 1) * limit;
    const to = page * limit - 1;

    // 1. Fetch notifications
    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filter === 'unread') {
      query = query.eq('read', false);
    }
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    const { data: notifications, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    // 2. Fetch total count
    let countQuery = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (filter === 'unread') {
      countQuery = countQuery.eq('read', false);
    }
    if (type !== 'all') {
      countQuery = countQuery.eq('type', type);
    }

    const { count: total, error: countError } = await countQuery;
    if (countError) throw countError;

    // --- SEEDING LOGIC START ---
    if (total === 0 && user.user_metadata?.role === 'admin') {
      const seedNotifications = [
        {
          user_id: user.id,
          type: 'system_alert',
          title: 'New Doctor Registration',
          message: 'Berlin Health Lab has registered and is pending verification.',
          link: '/admin/verifications',
          read: false
        },
        {
          user_id: user.id,
          type: 'system_alert',
          title: 'New BC Registration',
          message: 'Anna Maria Weber has registered and is pending verification.',
          link: '/admin/verifications',
          read: false
        },
        {
          user_id: user.id,
          type: 'payment_received',
          title: 'Payment Received',
          message: 'Payment of €25.00 received for recommendation BLT-2026-7959.',
          link: '/admin/financial',
          read: false
        }
      ];

      const { error: seedError } = await supabaseAdmin
        .from('notifications')
        .insert(seedNotifications);

      if (!seedError) {
        // Reconstruct queries and refetch
        let retryQuery = supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (filter === 'unread') retryQuery = retryQuery.eq('read', false);
        if (type !== 'all') retryQuery = retryQuery.eq('type', type);

        const { data: newNotifs } = await retryQuery;

        return NextResponse.json({
          notifications: newNotifs || [],
          total: 3,
          unreadCount: 3,
          page,
          limit
        });
      }
    }
    // --- SEEDING LOGIC END ---

    // 3. Fetch unread count
    const { count: unreadCount, error: unreadError } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (unreadError) throw unreadError;

    return NextResponse.json({
      notifications: notifications || [],
      total: total || 0,
      unreadCount: unreadCount || 0,
      page,
      limit
    });

  } catch (error) {
    console.error('[NOTIFICATIONS_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (action === 'mark_read' && Array.isArray(ids) && ids.length > 0) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .in('id', ids);

      if (error) throw error;
    } else if (action === 'mark_all_read') {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[NOTIFICATIONS_PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
