import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: cols } = await supabase.rpc('get_table_columns_by_name', { tbl_name: 'appointment' });
  console.log('Columns using RPC (if exists):', cols);
  
  // Alternative method if RPC doesn't exist: attempt to insert to see the error, or select a record.
  const { data: recs, error } = await supabase.from('appointment').select('*').limit(1);
  console.log('Sample record error:', error);
  if (recs && recs.length > 0) {
     console.log('Keys in appointment:', Object.keys(recs[0]));
  }
}
run();
