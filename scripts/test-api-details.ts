import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const APP_URL = 'http://localhost:3000/api/v1/cases';

async function run() {
  console.log("=== STARTING API CASE DETAILS & APPS TEST ===");

  // Fetch an HC that actually has cases so we can test the [id] endpoint
  const { data: hcCases } = await supabase.from('case').select('hc_id').limit(1);
  if (!hcCases || hcCases.length === 0) throw new Error("No cases exist in DB at all.");
  const targetHcId = hcCases[0].hc_id;

  const { data: hcs } = await supabase.from('healthcare_company')
    .select('id, name')
    .eq('id', targetHcId)
    .limit(1);

  if (!hcs || hcs.length === 0) throw new Error("HC for case not found.");
  const hc = hcs[0];
  
  // Create an explicit key
  const crypto = require('crypto');
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const validKey = `blt_sk_${rawSecret}`;
  const apiKeyHash = crypto.createHash('sha256').update(validKey).digest('hex');
  
  await supabase.from('healthcare_company').update({
    api_key_hash: apiKeyHash,
    api_enabled: true,
    api_rate_limit: 100
  }).eq('id', hc.id);
  
  // Find a valid case assigned to this HC
  const { data: cData } = await supabase.from('case').select('id, status').eq('hc_id', hc.id).limit(2);
  if (!cData || cData.length === 0) throw new Error("No cases found for this HC to query.");
  let targetCase = cData[0];

  console.log(`Setup complete. Using HC: ${hc.name}`);
  console.log(`Targeting Case ID: ${targetCase.id}\n`);

  // Test 1: Full Case Detail Pull
  console.log(`▶ Testing: GET /api/v1/cases/${targetCase.id}`);
  let res = await fetch(`${APP_URL}/${targetCase.id}`, { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  let body = await res.json();
  if (res.status === 200 && body.data.id === targetCase.id) {
    console.log(`  ✅ Passed Detailed Case Fetching.`);
    console.log(`  Patient Data Attached:`, body.data.patient?.firstName ? 'Yes' : 'No');
    console.log(`  Labs & Materials Configured:`, body.data.labGroups ? 'Yes' : 'No');
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  // Test 2: Invalid Access Block (Wrong HC ID Simulation)
  console.log(`\n▶ Testing: Unowned Case Pull (Simulates 404 security blocker)`);
  // Finding a case not belonging to HC
  const { data: wrongC } = await supabase.from('case').select('id').neq('hc_id', hc.id).limit(1);
  if (wrongC && wrongC.length > 0) {
     const wRes = await fetch(`${APP_URL}/${wrongC[0].id}`, { 
       method: 'GET',
       headers: { 'Authorization': `Bearer ${validKey}` }
     });
     if (wRes.status === 404) {
        console.log(`  ✅ Passed Cross-Tenant RLS Security Check (Got 404 Not Found)`);
     } else {
        console.log(`  ❌ Failed Cross-Tenant Security check. Got ${wRes.status}`);
     }
  } else {
     console.log(`  ⚠️ Skipped: No unowned cases exist in database to run negative tests.`);
  }

  // Test 3: Applicants Fetching
  console.log(`\n▶ Testing: GET /api/v1/cases/${targetCase.id}/applications`);
  res = await fetch(`${APP_URL}/${targetCase.id}/applications`, { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200 || res.status === 422) { // 422 allowed if case is no longer "searching"
     console.log(`  ✅ Passed Applicants Fetching (Returned ${res.status}).`);
     if (res.status === 200) {
        console.log(`  Applicants Bound: ${body.metadata.totalApplicants}`);
     }
  } else {
     console.log(`  ❌ Failed (got ${res.status})`, body);
  }

  console.log("\n=== TEST SUITE COMPLETE ===");
}

run().catch(console.error);
