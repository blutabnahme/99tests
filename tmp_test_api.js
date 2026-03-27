const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  // 1. Get the actual case UUID for 'BLT-2026-6147' - we can just search for one case
  const { data: cases } = await supabase.from('case').select('id, test_types').limit(1);
  if (!cases || cases.length === 0) {
    console.log("No cases found.");
    return;
  }
  const caseId = cases[0].id;
  const bcId = 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c';

  console.log("Applying to case:", caseId, cases[0].test_types);

  // 2. Call the API directly
  try {
    const res = await fetch(`http://localhost:3000/api/cases/${caseId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bcId, message: "Testing application from script" })
    });
    const result = await res.json();
    console.log("API Response:", result);

    // 3. Verify in DB
    const { data: apps } = await supabase.from('case_application').select('*').eq('bc_id', bcId);
    console.log("DB rows for bc_id:", apps);
  } catch (e) {
    console.error(e);
  }
}
run();
