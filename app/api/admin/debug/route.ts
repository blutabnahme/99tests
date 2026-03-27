export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const output: any[] = [];
    users.forEach((u: any) => {
      output.push({ email: u.email, meta: u.user_metadata, appMeta: u.app_metadata });
    });

    const adminUser = users.find((u: any) => u.email === 'admin@99tests.de');
    let fixLog = '';
    
    if (adminUser) {
      if (adminUser.user_metadata?.role !== 'admin') {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
          user_metadata: { ...adminUser.user_metadata, role: 'admin', full_name: 'Platform Admin' }
        });
        fixLog = updateError ? `Update failed: ${updateError.message}` : 'Automated fix applied to user_metadata';
      } else {
        fixLog = 'Admin user metadata is already correct.';
      }
    } else {
      fixLog = 'Admin user not found in the first 100 records.';
    }

    return NextResponse.json({
      adminStatus: fixLog,
      adminRecord: adminUser ? { email: adminUser.email, meta: adminUser.user_metadata, appMeta: adminUser.app_metadata } : null,
      allUsers: output
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
