import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAdmin = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  
  console.log('Total auth users:', users.length);
  users.forEach((u: any) => {
    console.log(u.email, '->', JSON.stringify(u.user_metadata));
  });

  const adminUser = users.find((u: any) => u.email === 'admin@99tests.de');
  if (adminUser) {
    if (adminUser.user_metadata?.role !== 'admin') {
      console.log('\nMissing user_metadata.role for admin! Fixing...');
      await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        user_metadata: { ...adminUser.user_metadata, role: 'admin', full_name: 'Platform Admin' }
      });
      console.log('Successfully updated admin@99tests.de user_metadata!');
    } else {
      console.log('\nAdmin already has correct role metadata: role === admin');
    }
  }
}

run();
