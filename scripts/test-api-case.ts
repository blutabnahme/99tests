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

const APP_URL = 'http://localhost:3000/api/v1/cases';

async function run() {
  console.log("=== STARTING API CASE CREATION TEST ===");

  // 1. Pick a test HC and generate a new key for isolated testing
  const { data: hcs } = await supabase.from('healthcare_company').select('id, name').limit(1);
  if (!hcs || hcs.length === 0) throw new Error("No HC found to test.");
  const hc = hcs[0];

  const rawSecret = crypto.randomBytes(32).toString('hex');
  const validKey = `blt_sk_${rawSecret}`;
  const apiKeyHash = crypto.createHash('sha256').update(validKey).digest('hex');
  
  await supabase.from('healthcare_company').update({
    api_key_hash: apiKeyHash,
    api_enabled: true,
    api_rate_limit: 100
  }).eq('id', hc.id);
  
  console.log(`Setup complete. Using API Key for HC: ${hc.name}\n`);

  const mockPayload = {
    patient: {
      firstName: "API",
      lastName: "Test Subject",
      dateOfBirth: "1990-05-15",
      gender: "male",
      address: {
        street: "Automated St 12",
        city: "Berlin",
        zip: "10115"
      },
      email: `api-test-${crypto.randomBytes(4).toString('hex')}@99tests.de`,
      phone: "+49123456789",
      insuranceType: "public"
    },
    labGroups: [
      {
        labId: "lab-1",
        labName: "Berlin Health Lab",
        testTypes: ["Complete Blood Count (CBC)"],
        materials: [{ itemId: "mat-1", quantity: 2 }]
      }
    ],
    urgencyLevel: "urgent",
    mobility: "home",
    specialCaseFlags: { minor: false, elderly: false, rollvenen: true },
    materialLogistics: "platform",
    returnLogistics: "platform",
    bcSelectionMode: "hc_curates",
    invitedBcIds: [],
    therapeuticConfirmation: true
  };

  console.log("▶ Testing: Submitting Valid Case Payload to /api/v1/cases POST");
  const res = await fetch(APP_URL, { 
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mockPayload)
  });
  
  const body = await res.json();
  
  if (res.status === 201) {
    console.log(`  ✅ Passed (Got 201 Created)`);
    console.log(`  Response Payload:`, JSON.stringify(body, null, 2));
  } else {
    console.log(`  ❌ Failed (Expected 201, got ${res.status})`);
    console.log(`  Error Response:`, body);
  }

  // TEST: Missing Therapeutic Confirmation (422)
  console.log("\n▶ Testing: Missing Therapeutic Confirmation");
  const failPayload = { ...mockPayload, therapeuticConfirmation: false };
  const failRes = await fetch(APP_URL, { 
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(failPayload)
  });
  
  if (failRes.status === 422) {
     console.log(`  ✅ Passed (Expected 422, got 422)`);
  } else {
     console.log(`  ❌ Failed (Expected 422, got ${failRes.status})`);
  }

  console.log("\n=== TEST SUITE COMPLETE ===");
}

run().catch(console.error);
