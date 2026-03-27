import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runQueries() {
  console.log("--- Querying Case BLT-2026-6147 ---");
  const { data: caseData, error: caseErr } = await supabase
    .from('case')
    .select('id, status, hc_id, created_at')
    .eq('id', 'BLT-2026-6147');
    
  if (caseErr) console.error(caseErr);
  else console.log(caseData);

  console.log("\n--- Querying Auth User hc@99tests.de ---");
  const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(
    (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'hc@99tests.de')?.id || ''
  );

  if (userErr) {
    console.log("Listing all users to find HC email:");
    const { data: users } = await supabase.auth.admin.listUsers();
    const hcUser = users.users.find(u => u.email === 'hc@99tests.de' || u.email === 'hc1@99tests.de');
    console.log("Found:", hcUser?.id, hcUser?.email);
  } else {
    console.log(userData?.user?.id, userData?.user?.email);
  }
}

runQueries();
