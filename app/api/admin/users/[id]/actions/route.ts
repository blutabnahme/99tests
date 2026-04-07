export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, context: any) {
  const { params } = context;
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { action, type } = body; // type: 'doctor' | 'patient'
    const table = type === 'doctor' ? 'tt_doctor' : 'tt_patient';

    switch (action) {
      case 'suspend': {
        const { error } = await supabaseAdmin
          .from(table)
          .update({ is_active: false })
          .eq('id', params.id);
        if (error) throw error;

        // If doctor, also update verification status
        if (type === 'doctor') {
          await supabaseAdmin
            .from('tt_doctor')
            .update({ verification_status: 'suspended' })
            .eq('id', params.id);
        }

        return NextResponse.json({ success: true, message: 'User suspended' });
      }

      case 'reactivate': {
        const { error } = await supabaseAdmin
          .from(table)
          .update({ is_active: true })
          .eq('id', params.id);
        if (error) throw error;

        if (type === 'doctor') {
          await supabaseAdmin
            .from('tt_doctor')
            .update({ verification_status: 'verified' })
            .eq('id', params.id);
        }

        return NextResponse.json({ success: true, message: 'User reactivated' });
      }

      case 'delete': {
        // Soft approach: deactivate and mark as deleted
        // Hard delete would remove data — using soft delete for safety
        const { error } = await supabaseAdmin
          .from(table)
          .update({ is_active: false, verification_status: type === 'doctor' ? 'deleted' : undefined })
          .eq('id', params.id);
        if (error) throw error;

        return NextResponse.json({ success: true, message: 'User deleted' });
      }

      case 'reset_password': {
        // Get user's auth email
        const { data: record } = await supabaseAdmin
          .from(table)
          .select('email, user_id')
          .eq('id', params.id)
          .single();

        if (!record?.email) {
          return NextResponse.json({ error: 'No email found for user' }, { status: 400 });
        }

        // Use Supabase Auth admin to send password reset
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: record.email,
        });

        // Even if generateLink fails, try the resetPasswordForEmail approach
        if (resetError) {
          const { error: resetError2 } = await supabaseAdmin.auth.resetPasswordForEmail(record.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://99tests.de'}/auth/reset-password`,
          });
          if (resetError2) throw resetError2;
        }

        return NextResponse.json({ success: true, message: `Password reset email sent to ${record.email}` });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('User action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
