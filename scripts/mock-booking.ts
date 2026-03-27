import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const caseId = 'BLT-2026-0845';
  
  // 1. Get the match to pick a BC
  const { data: matches } = await supabase.from('match').select('*').eq('case_id', caseId);
  const bcId = matches![0].bc_id;

  // 2. Set Case to booked
  await supabase.from('case').update({ status: 'booked' }).eq('id', caseId);

  // 3. Create an Appointment 30 hours from now (to test >24h cancellation)
  const aptId = randomUUID();
  const scheduledTime = new Date(Date.now() + 30 * 3600 * 1000).toISOString();
  
  await supabase.from('appointment').upsert({
    id: aptId,
    case_id: caseId,
    bc_id: bcId,
    scheduled_at: scheduledTime,
    status: 'scheduled',
    type: 'home'
  });

  // 4. Create a Payment wrapper
  await supabase.from('payment').upsert({
    id: randomUUID(),
    case_id: caseId,
    appointment_id: aptId,
    patient_amount: 55.00,
    vat_amount: 8.78,
    bc_payout: 38.25,
    platform_commission: 6.75,
    status: 'captured',
    paid_at: new Date().toISOString()
  });

  console.log("Mock appointment booked successfully. Patient Portal should now skip to Step 4.");
}

run().catch(console.error);
