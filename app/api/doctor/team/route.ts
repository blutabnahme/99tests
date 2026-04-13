export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the doctor context from the authenticated user
async function getDoctorContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, doctorId: null, authError: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: doctor } = await supabaseAdmin
    .from('tt_doctor')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!doctor) {
    return { user, doctorId: null, authError: NextResponse.json({ error: 'No associated doctor account found.' }, { status: 403 }) };
  }

  return { user, doctorId: doctor.id, authError: null };
}

// GET: List team members + activity
export async function GET() {
  try {
    const { user, doctorId, authError } = await getDoctorContext();
    if (authError) return authError;
    if (!doctorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: members } = await supabaseAdmin
      .from('tt_team_member')
      .select('*')
      .eq('doctor_id', doctorId)
      .neq('status', 'deactivated')
      .order('created_at', { ascending: false });

    const { data: activity } = await supabaseAdmin
      .from('tt_team_activity_log')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({ members: members || [], activity: activity || [] });
  } catch (error) {
    console.error('[TEAM_GET] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Invite a new team member
export async function POST(request: Request) {
  try {
    const { user, doctorId, authError } = await getDoctorContext();
    if (authError) return authError;
    if (!user || !doctorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { email, role, first_name, last_name } = body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    // Validate role
    if (!['doctor', 'manager', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be doctor, manager, or viewer.' }, { status: 400 });
    }

    // Check for existing member
    const { data: existing } = await supabaseAdmin
      .from('tt_team_member')
      .select('id, status')
      .eq('doctor_id', doctorId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing && existing.status !== 'deactivated') {
      return NextResponse.json({ error: 'This email is already a team member.' }, { status: 400 });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('base64url');

    // Create or reactivate member
    if (existing && existing.status === 'deactivated') {
      // Reactivate
      const { error } = await supabaseAdmin
        .from('tt_team_member')
        .update({
          role,
          first_name: first_name || null,
          last_name: last_name || null,
          invite_token: inviteToken,
          invite_status: 'pending',
          status: 'active',
          invited_at: new Date().toISOString(),
          accepted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;

      await supabaseAdmin.from('tt_team_activity_log').insert({
        doctor_id: doctorId,
        member_id: existing.id,
        action: 'reactivated',
        details: { email: email.toLowerCase().trim(), role, performedBy: user.email },
      });

      return NextResponse.json({ success: true, memberId: existing.id }, { status: 200 });
    }

    // Create new member
    const { data: newMember, error } = await supabaseAdmin
      .from('tt_team_member')
      .insert({
        doctor_id: doctorId,
        email: email.toLowerCase().trim(),
        first_name: first_name || null,
        last_name: last_name || null,
        role,
        invite_token: inviteToken,
        invite_status: 'pending',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabaseAdmin.from('tt_team_activity_log').insert({
      doctor_id: doctorId,
      member_id: newMember.id,
      action: 'invited',
      details: { email: email.toLowerCase().trim(), role, performedBy: user.email },
    });

    // TODO: Send invite email via Postmark/Twilio
    console.log(`[TEAM] Invite sent to ${email} with token: ${inviteToken}`);

    return NextResponse.json({ member: newMember }, { status: 201 });
  } catch (error) {
    console.error('[TEAM_POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update role, deactivate, or reactivate
export async function PATCH(request: Request) {
  try {
    const { user, doctorId, authError } = await getDoctorContext();
    if (authError) return authError;
    if (!user || !doctorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { memberId, action, role } = body;

    if (!memberId || !action) {
      return NextResponse.json({ error: 'Missing memberId or action.' }, { status: 400 });
    }

    // Verify member belongs to this doctor
    const { data: member } = await supabaseAdmin
      .from('tt_team_member')
      .select('id, email, role')
      .eq('id', memberId)
      .eq('doctor_id', doctorId)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Team member not found.' }, { status: 404 });
    }

    if (action === 'update_role') {
      if (!['doctor', 'manager', 'viewer'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('tt_team_member')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      await supabaseAdmin.from('tt_team_activity_log').insert({
        doctor_id: doctorId,
        member_id: memberId,
        action: 'role_changed',
        details: { email: member.email, oldRole: member.role, newRole: role, performedBy: user.email },
      });

    } else if (action === 'deactivate') {
      const { error } = await supabaseAdmin
        .from('tt_team_member')
        .update({ status: 'deactivated', updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      await supabaseAdmin.from('tt_team_activity_log').insert({
        doctor_id: doctorId,
        member_id: memberId,
        action: 'deactivated',
        details: { email: member.email, performedBy: user.email },
      });

    } else if (action === 'reactivate') {
      const { error } = await supabaseAdmin
        .from('tt_team_member')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', memberId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      await supabaseAdmin.from('tt_team_activity_log').insert({
        doctor_id: doctorId,
        member_id: memberId,
        action: 'reactivated',
        details: { email: member.email, performedBy: user.email },
      });

    } else if (action === 'resend_invite') {
      // Generate new token
      const newToken = crypto.randomBytes(32).toString('base64url');
      const { error } = await supabaseAdmin
        .from('tt_team_member')
        .update({ 
          invite_token: newToken, 
          invite_status: 'pending',
          invited_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('doctor_id', doctorId);

      if (error) throw error;

      // TODO: Send invite email
      console.log(`[TEAM] Resend invite to ${member.email} with token: ${newToken}`);

    } else {
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[TEAM_PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
