import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const caseId = 'BLT-2026-0845';
  
  const { data: appts } = await supabase.from('appointment').select('id, scheduled_at').eq('case_id', caseId);
  const apt = appts?.[0];

  if (!apt) {
    console.error("No appointment found for test case.");
    process.exit(1);
  }

  console.log(`Test Case Appointment: ${apt.id} Scheduled At: ${apt.scheduled_at}`);

  // Fetch the patient email to sign in
  const { data: caseInfo } = await supabase.from('case').select('patient_id, patient(contact_email)').eq('id', caseId).single();
  const patientEmail = (caseInfo?.patient as any)?.contact_email;
  
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: patientEmail,
    password: 'Password123!' // default from seed
  });

  if (authErr) {
     console.error("Auth Error:", authErr);
     process.exit(1);
  }

  const token = authData.session?.access_token;

  const res = await fetch(`http://localhost:3000/api/appointments/${apt.id}/cancel`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ cancellation_reason: 'Testing >24h cancellation', initiator: 'patient' })
  });
  
  const text = await res.text();
  console.log("API Response:", res.status, text);
}

run().catch(console.error);
