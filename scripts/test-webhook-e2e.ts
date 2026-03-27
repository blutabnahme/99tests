import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createClient } from '@supabase/supabase-js';
import { deliverWebhook } from '../lib/webhooks';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhooks() {
  console.log("Configuring HC Webhook Settings...");
  // Get first HC
  const { data: hc } = await supabase.from('healthcare_company').select('id, name').limit(1).single();
  
  if (!hc) {
     console.error("No HC found!");
     return;
  }

  // Set URL and Secret
  await supabase.from('healthcare_company').update({
     webhook_url: 'http://localhost:4000/webhook',
     webhook_secret: 'whsec_0000000000000000000000000000000000000000000000000000000000000000'
  }).eq('id', hc.id);

  console.log(`Configured HC: ${hc.name} (${hc.id})`);
  
  console.log("\n🚀 Triggering case.cancelled webhook natively...");
  
  // Call the core library
  await deliverWebhook(hc.id, 'case.cancelled', {
     caseId: 'cas-test-9999',
     appointmentId: 'apt-test-1111',
     reason: "E2E Automated Testing Sequence",
     initiator: 'admin'
  });

  console.log("Webhook Delivery Function Completed. Verify listener and webhook_log tables.");
}

testWebhooks().catch(console.error);
