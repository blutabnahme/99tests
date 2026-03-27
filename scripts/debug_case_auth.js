const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' // using anon key to simulate frontend!
);

async function runQueries() {
  // Login as hc@99tests.de
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'hc@99tests.de',
    password: 'password123' // assuming default test password
  });

  if (authError) {
    console.error("Auth failed:", authError.message);
    const { data: listAllUsers } = await supabase.from('healthcare_company').select('*');
    fs.writeFileSync('debug_output3.json', JSON.stringify({ error: authError.message }, null, 2));
    return;
  }

  const userId = authData.user.id;
  console.log("Logged in as:", userId);

  const { data: casesList, error: casesError } = await supabase
    .from("case")
    .select(`
      id, created_at, status, hc_id,
      patient:patient_id ( first_name, last_name ),
      match ( status )
    `)
    .eq("hc_id", userId)
    .order("created_at", { ascending: false });

  const output = {
    userId,
    casesList,
    casesError
  };
  
  fs.writeFileSync('debug_output3.json', JSON.stringify(output, null, 2));
}

runQueries();
