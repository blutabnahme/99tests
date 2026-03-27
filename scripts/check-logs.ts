import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
   const { data, error } = await supabase
    .from('webhook_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

   if (error) {
     console.error("Failed to fetch logs:", error.message);
   } else {
     console.log("Recent Webhook Logs:\n", JSON.stringify(data, null, 2));
   }
}

checkLogs().catch(console.error);
