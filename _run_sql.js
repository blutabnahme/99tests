const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vrlhrmdlkycvmajgdmdw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybGhybWRsa3ljdm1hamdkbWR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQxNjQ1MiwiZXhwIjoyMDg4OTkyNDUyfQ.4ZXgtNLnFCEhEOzAxIBU-chRfBLrKAFWaggW_J5FEJg';
const supabase = createClient(supabaseUrl, supabaseKey);

const REAL_UUID = 'f105dc5f-7a00-4bc8-9fb8-71ae834bb93c';

async function run() {
  console.log('1. Fetching all blood collectors...');
  const { data: bcs, error: fetchErr } = await supabase.from('blood_collector').select('id, special_experience');
  if (fetchErr) {
    console.error('Error fetching BCs:', fetchErr);
    return;
  }

  for (const bc of bcs) {
    let changed = false;
    let exp = typeof bc.special_experience === 'object' && bc.special_experience !== null ? {...bc.special_experience} : {};

    // 1. Rename 'children' to 'minor' for everyone
    if (exp.children !== undefined) {
      exp.minor = exp.children;
      delete exp.children;
      changed = true;
    }

    // 2. Add 'difficult_veins' to Anna Weber
    if (bc.id === REAL_UUID) {
      if (!exp.difficult_veins) {
        exp.difficult_veins = true;
        changed = true;
      }
    }

    if (changed) {
      console.log(`Updating BC ${bc.id}...`);
      await supabase.from('blood_collector').update({ special_experience: exp }).eq('id', bc.id);
    }
  }

  console.log('3. Verifying the result for Anna Weber:');
  const { data: final, error: finalErr } = await supabase
    .from('blood_collector')
    .select('id, special_experience')
    .eq('id', REAL_UUID);

  if (finalErr) {
    console.error('Error verifying Anna Weber:', finalErr);
  } else {
    console.log(JSON.stringify(final, null, 2));
  }
}

run();
