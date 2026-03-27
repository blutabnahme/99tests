const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybGhybWRsa3ljdm1hamdkbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxNjQ1MiwiZXhwIjoyMDg4OTkyNDUyfQ.4ZXgtNLnFCEhEOzAxIBU-chRfBLrKAFWaggW_J5FEJg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('patient')
    .select('id, first_name, last_name, contact_email')
    .eq('first_name', 'Luiz');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Results:', JSON.stringify(data, null, 2));
  }
}

run();
