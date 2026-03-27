const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const envUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envKeyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = envUrlMatch ? envUrlMatch[1].trim() : process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envKeyMatch ? envKeyMatch[1].trim() : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDemo() {
  const email = 'demo@99tests.de';
  const password = 'Password123!';

  console.log('Registering user...');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'healthcare_company',
        full_name: 'Demo Healthcare'
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('Demo user already exists. Checking login.');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        console.error('Failed to sign in demo user:', signInError);
        return;
      }
      console.log('Logged in successfully', signInData.user.id);
    } else {
      console.error('Error signing up demo user:', error);
      return;
    }
  } else {
    console.log('Successfully created demo user:', data.user.id);
    
    // Attempt to insert healthcare profile (RLS allows insert?)
    console.log('Inserting into healthcare_company table...');
    const { error: hcError } = await supabase.from('healthcare_company').insert({
      id: data.user.id,
      name: 'Demo Clinic Berlin',
      contact_email: email,
      type: 'practice',
      status: 'active'
    });
    if (hcError) {
      console.error('Failed to create company profile (might already exist or RLS issue):', hcError.message);
    } else {
      console.log('Company Profile inserted!');
    }
  }
}

createDemo();
