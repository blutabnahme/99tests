import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: hcs } = await supabase.from('healthcare_company').select('contact_email');
  const { data: bcs } = await supabase.from('blood_collector').select('contact_email, first_name');
  const { data: patients } = await supabase.from('patient').select('contact_email');
  console.log(JSON.stringify({HC: hcs, BC: bcs, Patient: patients}, null, 2));
}
run();
