const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data, error } = await supabase.from('case_application')
    .select('*')
    .eq('bc_id', 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}
run();
