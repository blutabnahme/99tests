export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getHcContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, hcId: null, authError: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: hcData } = await supabaseAdmin
    .from('doctor_practice')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!hcData) {
    return { user, hcId: null, authError: NextResponse.json({ error: 'Forbidden. No associated Healthcare Company found.' }, { status: 403 }) };
  }

  return { user, hcId: hcData.id, authError: null };
}

export async function GET(request: Request) {
  try {
    const { user, hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all team members for this Doctor (exclude deactivated)
    const { data: members } = await supabaseAdmin
      .from('team_member')
      .select('*')
      .eq('doctor_id', hcId)
      .neq('status', 'deactivated')
      .order('created_at', { ascending: false });

    // Fetch recent activity log (last 50 entries)
    const { data: activity } = await supabaseAdmin
      .from('team_activity_log')
      .select('*')
      .eq('doctor_id', hcId)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ members: members || [], activity: activity || [] });

  } catch (error) {
    console.error('[TEAM_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { user, hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!user || !hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email, role } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    if (!['admin', 'case_manager', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided.' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('team_member')
      .select('id')
      .eq('doctor_id', hcId)
      .eq('email', email.toLowerCase().trim())
      .neq('status', 'deactivated')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This email is already a team member.' }, { status: 400 });
    }

    const { data: newMember, error } = await supabaseAdmin
      .from('team_member')
      .insert({
        doctor_id: hcId,
        email: email.toLowerCase().trim(),
        role,
        status: 'pending',
        invited_by: user.id,
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('team_activity_log').insert({
      doctor_id: hcId,
      user_id: user.id,
      actor_email: user.email || 'unknown',
      action: 'member_invited',
      details: { email: email.toLowerCase().trim(), role }
    });

    return NextResponse.json({ member: newMember }, { status: 201 });

  } catch (error) {
    console.error('[TEAM_POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user, hcId, authError } = await getHcContext();
    if (authError) return authError;
    if (!user || !hcId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { memberId, action, role } = body;

    if (!memberId || !action) {
      return NextResponse.json({ error: 'Missing memberId or action.' }, { status: 400 });
    }

    if (action === 'update_role') {
      if (!['admin', 'case_manager', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('team_member')
        .update({ role })
        .eq('id', memberId)
        .eq('doctor_id', hcId);

      if (error) throw error;

      await supabaseAdmin.from('team_activity_log').insert({
        doctor_id: hcId,
        user_id: user.id,
        actor_email: user.email || 'unknown',
        action: 'role_changed',
        details: { memberId, newRole: role }
      });

    } else if (action === 'deactivate') {
      const { error } = await supabaseAdmin
        .from('team_member')
        .update({ status: 'deactivated' })
        .eq('id', memberId)
        .eq('doctor_id', hcId);

      if (error) throw error;

      await supabaseAdmin.from('team_activity_log').insert({
        doctor_id: hcId,
        user_id: user.id,
        actor_email: user.email || 'unknown',
        action: 'member_deactivated',
        details: { memberId }
      });

    } else if (action === 'reactivate') {
      const { error } = await supabaseAdmin
        .from('team_member')
        .update({ status: 'active' })
        .eq('id', memberId)
        .eq('doctor_id', hcId);

      if (error) throw error;

      await supabaseAdmin.from('team_activity_log').insert({
        doctor_id: hcId,
        user_id: user.id,
        actor_email: user.email || 'unknown',
        action: 'member_reactivated',
        details: { memberId }
      });
      
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[TEAM_PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
