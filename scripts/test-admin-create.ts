import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Creating Admin user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@99tests.de',
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });
  
  if (error) {
    console.log("ERROR CREATING ADMIN:", error);
  } else {
    console.log("Created successfully:", data.user?.id);
  }
}

run();
