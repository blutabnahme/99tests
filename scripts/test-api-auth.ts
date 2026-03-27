import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const APP_URL = 'http://localhost:3000/api/v1/auth/verify';

async function testEndpoint(name: string, token: string | null, expectedStatus: number) {
  console.log(`\n▶ Testing: ${name}`);
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(APP_URL, { 
    method: 'GET',
    headers
  });
  
  const body = await res.json();
  const passed = res.status === expectedStatus;
  
  if (passed) {
    console.log(`  ✅ Passed (Expected ${expectedStatus}, got ${res.status})`);
  } else {
    console.log(`  ❌ Failed (Expected ${expectedStatus}, got ${res.status})`);
    console.log(`  Response:`, body);
  }
}

async function run() {
  console.log("=== STARTING API AUTH TEST SUITE ===");

  // 1. Pick a test HC
  const { data: hcs } = await supabase.from('healthcare_company').select('id, name').limit(1);
  if (!hcs || hcs.length === 0) throw new Error("No HC found to test.");
  const hc = hcs[0];

  console.log(`Setup: Generating API key for HC [${hc.name}]...`);
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const validKey = `blt_sk_${rawSecret}`;
  const apiKeyHash = crypto.createHash('sha256').update(validKey).digest('hex');
  const apiPrefix = validKey.substring(0, 15); 

  // Make sure it's enabled and has a low rate limit for testing
  const { error: setupErr } = await supabase.from('healthcare_company').update({
    api_key_hash: apiKeyHash,
    api_key_prefix: apiPrefix,
    api_enabled: true,
    api_rate_limit: 3 // Restrictive
  }).eq('id', hc.id);
  
  if (setupErr) throw new Error(`Setup failed: ${setupErr.message}`);
  
  console.log("Setup complete. Running tests...\n");

  // TEST 1: No API Key
  await testEndpoint("Missing API Key", null, 401);

  // TEST 2: Invalid Prefix
  await testEndpoint("Invalid API Key format", "Bearer sk_test_12345", 401);

  // TEST 3: Invalid Key
  await testEndpoint("Invalid API Key hash", "blt_sk_1234567890abcdef1234567890abcdef", 401);

  // TEST 4: Valid Key
  await testEndpoint("Valid API Key", validKey, 200);

  // TEST 5: Rate Limiting (calling 4 times quickly with limit=3)
  console.log(`\n▶ Testing: Rate Limiting (limit=3)`);
  let rateLimitHit = false;
  for (let i = 0; i < 4; i++) {
     const res = await fetch(APP_URL, { headers: { 'Authorization': `Bearer ${validKey}` } });
     if (res.status === 429) rateLimitHit = true;
  }
  if (rateLimitHit) {
     console.log(`  ✅ Passed (429 Hit as expected on 4th call)`);
  } else {
     console.log(`  ❌ Failed (Did not hit rate limit)`);
  }

  // TEST 6: Disabled Access
  await supabase.from('healthcare_company').update({ api_enabled: false }).eq('id', hc.id);
  await testEndpoint("Disabled API Access", validKey, 403);
  
  // Re-enable for further real-world use
  await supabase.from('healthcare_company').update({ api_enabled: true, api_rate_limit: 100 }).eq('id', hc.id);

  console.log("\n=== TEST SUITE COMPLETE ===");
}

run().catch(console.error);
