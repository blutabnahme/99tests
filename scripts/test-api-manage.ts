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
  console.log("=== STARTING API CASE MANAGEMENT TEST ===");

  const { data: hcCases } = await supabase.from('case').select('hc_id').limit(1);
  if (!hcCases || hcCases.length === 0) throw new Error("No cases exist in DB at all.");
  const targetHcId = hcCases[0].hc_id;

  const { data: hcs } = await supabase.from('healthcare_company')
    .select('id, name')
    .eq('id', targetHcId)
    .limit(1);

  if (!hcs || hcs.length === 0) throw new Error("HC for case not found.");
  const hc = hcs[0];
  
  const crypto = require('crypto');
  const rawSecret = crypto.randomBytes(32).toString('hex');
  const validKey = `blt_sk_${rawSecret}`;
  const apiKeyHash = crypto.createHash('sha256').update(validKey).digest('hex');
  
  await supabase.from('healthcare_company').update({
    api_key_hash: apiKeyHash,
    api_enabled: true
  }).eq('id', hc.id);
  
  console.log(`Setup complete. Using HC: ${hc.name}`);

  // Test 1: Generate a fresh hc_curates Case specifically to test Shortlisting
  console.log(`\n▶ Seeding an exclusive hc_curates mock case...`);
  const cRes = await fetch(APP_URL, {
     method: 'POST',
     headers: { 
        'Authorization': `Bearer ${validKey}`,
        'Content-Type': 'application/json'
     },
     body: JSON.stringify({
      patient: {
        firstName: "Manage", lastName: "Test",
        dateOfBirth: "1980-01-01", gender: "other",
        address: { street: "123 API Ave", city: "Berlin", zip: "10115" },
        email: `api-manage-${crypto.randomBytes(4).toString('hex')}@99tests.de`,
        phone: "+49123456780", insuranceType: "public"
      },
      labGroups: [{ labId: "lab_1", labName: "Test Lab", testTypes: ["cbc"] }],
      urgencyLevel: "normal", mobility: "practice",
      specialCaseFlags: { },
      materialLogistics: "hc",
      returnLogistics: [{ labId: "lab_1", provider: "hc" }],
      bcSelectionMode: "hc_curates",
      therapeuticConfirmation: true
     })
  });
  const cBody = await cRes.json();
  if (!cBody.data) {
     console.error("CASE POST FAILED:", cBody);
     process.exit(1);
  }
  const caseId = cBody.data.caseId;
  console.log(`  Seeded Case ID: ${caseId}`);

  // Need to seed a mock BC Match so we can test [id]/shortlist approval validations
  const mockBcRes = await supabase.from('blood_collector').select('id').limit(1);
  const bcId = mockBcRes.data![0].id;
  await supabase.from('match').insert({
     case_id: caseId,
     bc_id: bcId,
     status: 'applied',
     rank: 1,
     score: 99,
     estimated_travel_km: 5
  });

  // Test 2: PUT /cases/[id]/shortlist (Approve)
  console.log(`\n▶ Testing: PUT /cases/${caseId}/shortlist (Approve mapped BC)`);
  let res = await fetch(`${APP_URL}/${caseId}/shortlist`, { 
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${validKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBcIds: [bcId] })
  });
  
  let body = await res.json();
  if (res.status === 200) {
    console.log(`  ✅ Passed Shortlisting. Status shifted to pending_patient_consent.`);
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  // Test 3: POST /cases/[id]/shortlist/send (Dispatch)
  console.log(`\n▶ Testing: POST /cases/${caseId}/shortlist/send (Dispatch Notification)`);
  res = await fetch(`${APP_URL}/${caseId}/shortlist/send`, { 
    method: 'POST',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200) {
    console.log(`  ✅ Passed Shortlist Dispatch. Triggered Event.`);
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  // Test 4: DELETE /cases/[id] (Void/Cancel)
  console.log(`\n▶ Testing: DELETE /cases/${caseId} (Void active case)`);
  res = await fetch(`${APP_URL}/${caseId}`, { 
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200) {
    console.log(`  ✅ Passed Cancel. Simple Voiding Success.`);
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  // Test 5: Verify Conflict logic for double cancellation
  console.log(`\n▶ Testing: DELETE /cases/${caseId} Again (409 Terminal Status Check)`);
  res = await fetch(`${APP_URL}/${caseId}`, { 
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  if (res.status === 409) {
    console.log(`  ✅ Passed Double Cancel Protection.`);
  } else {
    console.log(`  ❌ Failed Conflict Check. Got ${res.status}`);
  }

  // Test 6: Financial Refund Hook Verification
  console.log(`\n▶ Seeding an exclusive PAID case to test Financial Refunding Hooks...`);
  const cRes2 = await fetch(APP_URL, {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${validKey}`, 'Content-Type': 'application/json' },
     body: JSON.stringify({
      patient: {
        firstName: "Refund", lastName: "Proxy",
        dateOfBirth: "1980-01-01", gender: "other",
        address: { street: "123 API Ave", city: "Berlin", zip: "10115" },
        email: `api-manage-refund-${crypto.randomBytes(4).toString('hex')}@99tests.de`,
        phone: "+49123456780", insuranceType: "public"
      },
      labGroups: [{ labId: "lab_1", labName: "Test Lab", testTypes: ["cbc"] }],
      urgencyLevel: "normal", mobility: "practice",
      specialCaseFlags: { },
      materialLogistics: "hc",
      returnLogistics: [{ labId: "lab_1", provider: "hc" }],
      bcSelectionMode: "patient_decides",
      therapeuticConfirmation: true
     })
  });
  const cBody2 = await cRes2.json();
  const rCaseIdText = cBody2.data.caseId;
  
  // Wait for Supabase trigger proxy to resolve token string -> id DB indexing before querying
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { data: dbCase } = await supabase.from('case').select('id, patient_id').eq('id', rCaseIdText).single();
  
  if (!dbCase) throw new Error("Could not find matching case DB row for: " + rCaseIdText);
  const rCase = { id: dbCase.id };

  // Set the dummy status directly to bypass selection
  await supabase.from('case').update({ status: 'matched' }).eq('id', dbCase.id);

  const { data: bccRes } = await supabase.from('blood_collector').select('id').limit(1);
  const bcc = bccRes as any[];

  const { data: rDataRes, error: rDataErr } = await supabase.from('appointment').insert({
     case_id: rCase.id,
     patient_id: dbCase.patient_id,
     bc_id: bcc[0].id,
     status: 'scheduled',
     scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), // 48 hours away
     type: 'practice',
     location: { "is_hc": true }
  }).select('id').single();
  if (rDataErr) {
    require('fs').writeFileSync('test-output.txt', JSON.stringify(rDataErr, null, 2));
    console.error("APPT SEED ERR Wrote to file");
    process.exit(1);
  }
  const rData = rDataRes as any;

  const { data: payDataRes, error: payDataErr } = await supabase.from('payment').insert({
     case_id: rCase.id,
     appointment_id: rData.id,
     patient_amount: 100, // Dummy
     bc_payout: 50, // Dummy
     platform_commission: 10,
     status: 'paid'
  }).select('id').single();
  if (payDataErr) {
    require('fs').writeFileSync('test-output.txt', JSON.stringify(payDataErr, null, 2));
    console.error("PAYMENT SEED ERR Wrote to file");
    process.exit(1);
  }
  const payData = payDataRes as any;

  console.log(`  Seeded Paid Case: ${rCase.id} mapped to Appt: ${rData.id} and Payment: ${payData.id}`);
  
  console.log(`\n▶ Testing: DELETE /cases/${rCase.id} (Should trigger 100% refund since >24h away)`);
  res = await fetch(`${APP_URL}/${rCase.id}`, { 
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${validKey}` }
  });
  
  body = await res.json();
  if (res.status === 200) {
    console.log(`  ✅ Passed Cancel. Hooked into billing successfully.`);
    // Verify Refund row
    const { data: rf } = await supabase.from('refund').select('amount').eq('payment_id', payData!.id).single();
    if (rf && rf.amount === 100) {
       console.log(`  ✅ Double Verified. Refund row mapped correctly for €100.00 fallback.`);
    } else {
       console.log(`  ❌ Failed Refund integrity check. Row:`, rf);
    }
  } else {
    console.log(`  ❌ Failed (Expected 200, got ${res.status})`, body);
  }

  console.log("\n=== TEST SUITE COMPLETE ===");
}

run().catch(e => {
  require('fs').writeFileSync('final-err-dump.json', String(e.stack || e.message));
  console.error(e);
  process.exit(1);
});
