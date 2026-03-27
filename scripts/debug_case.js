const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runQueries() {
  console.log("--- Querying Case BLT-2026-6147 ---");
  const { data: caseData } = await supabase.from('case').select('id, status, hc_id, created_at').eq('id', 'BLT-2026-6147');
  console.log(caseData);

  console.log("\n--- Querying Healthcare Company for this case ---");
  if (caseData && caseData.length > 0) {
    const { data: hc } = await supabase.from('healthcare_company').select('*').eq('id', caseData[0].hc_id);
    console.log(hc);
  }

  console.log("\n--- Listing Auth Users ---");
  const { data: users } = await supabase.auth.admin.listUsers();
  
  if (users?.users) {
    users.users.forEach(u => {
      console.log(`ID: ${u.id}, Email: ${u.email}, Role: ${u.user_metadata?.role}`);
    });
  }
}

runQueries();
