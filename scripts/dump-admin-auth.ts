import { createClient } from '@supabase/supabase-js';

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fJSr8gyPUOahWoRqyGsDvQ_HyrFZnLc';

const supabase = createClient(apiUrl, anonKey);

async function checkAdmin() {
  console.log('Attempting sign in as admin@99tests.de...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@99tests.de',
    password: 'Test1234!'
  });

  if (error) {
    console.error('Login Failed:', error.message);
    return;
  }

  const user = data.user;
  console.log('--- ADMIN EXTRACTED DATA ---');
  console.log(`Email format: ${user.email}`);
  console.log(`User ID: ${user.id}`);
  console.log(`user_metadata:`, JSON.stringify(user.user_metadata, null, 2));
  console.log(`app_metadata:`, JSON.stringify(user.app_metadata, null, 2));
}

checkAdmin();
