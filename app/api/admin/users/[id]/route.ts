export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// PATCH — suspend/unsuspend & reset password
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { action } = await req.json();

    if (action === 'suspend') {
      await supabaseAdmin.auth.admin.updateUserById(params.id, { ban_duration: '876600h' }); // ~100 years
    }
    if (action === 'unsuspend') {
      await supabaseAdmin.auth.admin.updateUserById(params.id, { ban_duration: 'none' });
    }
    if (action === 'reset_password') {
      const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(params.id);
      if (targetUser?.email) {
        await supabaseAdmin.auth.resetPasswordForEmail(targetUser.email);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — delete user
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await supabaseAdmin.auth.admin.deleteUser(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
