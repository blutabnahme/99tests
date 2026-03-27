import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const email = 'admin@99tests.de';
  const password = 'AdminPassword123!';

  console.log('Creating Admin User...');
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) {
    if (error.message.includes('already been registered')) {
        console.log(`Admin user already exists! Email: ${email}, Password: ${password}`);
    } else {
        console.error('Error creating admin:', error);
    }
  } else {
    console.log(`✅ Admin created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  }
}

createAdmin();
