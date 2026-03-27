import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(apiUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("Testing Admin login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@99tests.de',
    password: 'Test1234!'
  });
  
  if (error) {
    console.log("ERROR IS:", error.message, error.name, error.status);
    
    // Check user info with service role
    const scKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminSupabase = createClient(apiUrl, scKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: listData } = await adminSupabase.auth.admin.listUsers();
    const u = listData.users.find(u => u.email === 'admin@99tests.de');
    console.log("User details:", u);

  } else {
    console.log("Login SUCCESS:", data.user?.id);
  }
}

run();
