const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) envVars[key.trim()] = values.join('=').trim().replace(/"/g, '');
});

const supabaseAdmin = createClient(
  envVars['NEXT_PUBLIC_SUPABASE_URL'],
  envVars['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testQuery() {
  const { data, error } = await supabaseAdmin
    .from("case")
    .select(`
      *,
      patient:patient_id (*),
      healthcare_company:hc_id (id, name, logo_url),
      match (*, blood_collector(*))
    `)
    .limit(1)
    .single();
    
  console.log("Error:", error);
  if (data) console.log("Success! Found case:", data.id);
}

testQuery();
