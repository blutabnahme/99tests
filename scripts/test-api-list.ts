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
  console.log("=== STARTING API CASE LISTING TEST ===");

  // Fetch the recently mapped HC from prior tests to leverage their API Token
  const { data: hcs } = await supabase.from('healthcare_company')
    .select('id, name, api_key_hash')
    .not('api_key_hash', 'is', null)
    .limit(1);

  if (!hcs || hcs.length === 0) throw new Error("No HC found to test. Did you run the Case Creation test first?");
  const hc = hcs[0];
  
  // We don't have the raw API key anymore so we must force one for testing
  const crypto = require('crypto');
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const validKey = `blt_sk_${rawSecret}`;
  const apiKeyHash = crypto.createHash('sha256').update(validKey).digest('hex');
  
  await supabase.from('healthcare_company').update({
    api_key_hash: apiKeyHash,
    api_enabled: true,
    api_rate_limit: 100
  }).eq('id', hc.id);
  
  console.log(`Setup complete. Using API Key for HC: ${hc.name}\n`);

  // Test 1: Baseline Fetch
  console.log("▶ Testing: Submitting Baseline GET to /api/v1/cases");
  let res = await fetch(APP_URL, { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  let body = await res.json();
  if (res.status === 200) {
    console.log(`  ✅ Passed (Got 200 with ${body.data.length} cases)`);
    console.log(`  Pagination:`, body.pagination);
    if(body.data.length > 0) {
       console.log(`  Sample Name:`, body.data[0].patientName);
    }
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  // Test 2: Status Query Mapping
  console.log("\n▶ Testing: Filter by URL parameters ?status=searching&urgencyLevel=urgent");
  res = await fetch(`${APP_URL}?status=searching&status=matched&urgencyLevel=urgent`, { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200) {
     console.log(`  ✅ Passed (Got 200 with ${body.data.length} filtered cases)`);
  } else {
     console.log(`  ❌ Failed Filter Mapping`, body);
  }

  // Test 3: Pagination Offsets & Limits
  console.log("\n▶ Testing: Pagination Windowing ?limit=1&offset=0");
  res = await fetch(`${APP_URL}?limit=1&offset=0`, { 
    method: 'GET',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200 && body.pagination.limit === 1 && body.data.length <= 1) {
     console.log(`  ✅ Passed LIMIT restriction (Returned ${body.data.length})`);
  } else {
     console.log(`  ❌ Failed window restrictions`, body);
  }

  console.log("\n=== TEST SUITE COMPLETE ===");
}

run().catch(console.error);
