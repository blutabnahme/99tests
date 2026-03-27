const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybGhybWRsa3ljdm1hamdkbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxNjQ1MiwiZXhwIjoyMDg4OTkyNDUyfQ.4ZXgtNLnFCEhEOzAxIBU-chRfBLrKAFWaggW_J5FEJg';
const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_UUID = 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c';

async function run() {
  console.log('Fetching duplicate Webers...');
  const { data: webers, error: fetchErr } = await supabase
    .from('blood_collector')
    .select('id')
    .eq('last_name', 'Weber')
    .neq('id', REAL_UUID);

  if (fetchErr) {
    console.error('Error fetching webers:', fetchErr);
    return;
  }

  const badIds = webers.map(w => w.id);
  console.log(`Found ${badIds.length} duplicate Webers to delete.`);

  if (badIds.length > 0) {
    console.log('1. Deleting from match...');
    const { error: matchErr } = await supabase.from('match').delete().in('bc_id', badIds);
    if (matchErr) console.error('Error deleting matches:', matchErr);

    console.log('2. Deleting from case_application...');
    const { error: appErr } = await supabase.from('case_application').delete().in('bc_id', badIds);
    if (appErr) console.error('Error deleting applications:', appErr);

    console.log('3. Deleting from blood_collector...');
    const { error: bcErr } = await supabase.from('blood_collector').delete().in('id', badIds);
    if (bcErr) console.error('Error deleting blood_collectors:', bcErr);
  }

  console.log('4. Verifying remaining Webers...');
  const { data: final, error: finalErr } = await supabase
    .from('blood_collector')
    .select('id, first_name, last_name, contact_email')
    .eq('last_name', 'Weber');

  if (finalErr) {
    console.error('Error verifying remaining webers:', finalErr);
  } else {
    console.log('Remaining Webers:');
    console.log(JSON.stringify(final, null, 2));
  }
}

run();
