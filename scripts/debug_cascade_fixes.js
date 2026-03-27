const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim().replace(/"/g, '');
  }
});

const supabaseAdmin = createClient(
  envVars['NEXT_PUBLIC_SUPABASE_URL'],
  envVars['SUPABASE_SERVICE_ROLE_KEY'],
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function runSQL() {
  console.log("--- QUERY 1: LATEST 10 CASES ---");
  const { data: cases, error: err1 } = await supabaseAdmin
    .from('case')
    .select('id, status, hc_id, patient_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (err1) {
    console.error("Error fetching cases:", err1);
  } else {
    cases.forEach(c => {
      console.log(`case_id: ${c.id} | status: ${c.status} | hc_id: ${c.hc_id} | patient_id: ${c.patient_id}`);
    });
  }

  console.log("\n--- QUERY 2: ALL USERS (Looking for HC) ---");
  const { data: { users }, error: err2 } = await supabaseAdmin.auth.admin.listUsers();
  if (err2) {
    console.log('Error fetching users:', err2);
  } else {
    const hcUsers = users.filter(u => u.email && u.email.includes('hc@'));
    if (hcUsers.length > 0) {
      hcUsers.forEach(u => {
        console.log(`User: ${u.email} | ID: ${u.id}`);
      });
    }
  }

  console.log("\n--- QUERY 3: HEALTHCARE COMPANY TABLE ---");
  const { data: hcs, error: err3 } = await supabaseAdmin.from('healthcare_company').select('*');
  if (err3) {
    console.log('Error fetching healthcare_company:', err3);
  } else {
    hcs.forEach(hc => {
      console.log(`HC Name: ${hc.name} | ID: ${hc.id} | Email: ${hc.contact_email}`);
    });
  }
}

runSQL();
