const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;
  
  console.log('Total auth users:', users.length);
  users.forEach(u => {
    console.log(u.email, '->', JSON.stringify(u.user_metadata));
  });

  const adminUser = users.find(u => u.email === 'admin@99tests.de');
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
