const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCases() {
  const { data, error } = await supabase
    .from('case')
    .select('id, status, hc_id, created_at, patient_id')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching cases:', error);
  } else {
    console.log('Recent 5 Cases:', JSON.stringify(data, null, 2));
  }
}

checkCases();
