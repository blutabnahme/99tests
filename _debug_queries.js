const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const SUPABASE_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybGhybWRsa3ljdm1hamdkbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxNjQ1MiwiZXhwIjoyMDg4OTkyNDUyfQ.4ZXgtNLnFCEhEOzAxIBU-chRfBLrKAFWaggW_J5FEJg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function run() {
  console.log("1. Running: SELECT COUNT() FROM match WHERE case_id = 'BLT-2026-6147';");
  const { count } = await supabase.from('match')
    .select('*', { count: 'exact', head: true })
    .eq('case_id', 'BLT-2026-6147');
  console.log("   Result:", count);

  console.log("\n2. Running: SELECT m.case_id, m.bc_id, m.status FROM match m JOIN blood_collector bc ON m.bc_id = bc.id JOIN auth.users u ON bc.id = u.id WHERE u.email = 'bc@blutabnahme.de' LIMIT 10;");
  
  // First get the user id for the email
  let foundUser = null;
  let page = 1;
  while(true) {
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    if (usersErr || usersData.users.length === 0) break;
    foundUser = usersData.users.find(u => u.email === 'bc@blutabnahme.de');
    if (foundUser) break;
    page++;
  }
  
  if (!foundUser) {
    console.log("   User bc@blutabnahme.de not found in auth.users!");
  } else {
    console.log("   Found user ID:", foundUser.id);
    // Then get match status for this bc
    const { data: matches, error: matchesErr } = await supabase.from('match')
      .select('case_id, bc_id, status')
      .eq('bc_id', foundUser.id)
      .limit(10);
    console.log("   Matches for user:\n  ", matches);
  }

  console.log("\n3. Running: SELECT id, status FROM blood_collector LIMIT 5;");
  const { data: bcs } = await supabase.from('blood_collector')
    .select('id, status')
    .limit(5);
  console.log("   Result:\n  ", bcs);
}

run().catch(console.error);
