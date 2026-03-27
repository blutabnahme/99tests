const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
env.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim().replace(/"/g, '');
  }
});

const supabaseAdmin = createClient(
  envVars['NEXT_PUBLIC_SUPABASE_URL'],
  envVars['SUPABASE_SERVICE_ROLE_KEY']
);

async function run() {
  const { data: hcUser } = await supabaseAdmin.from('healthcare_company').select('id').eq('contact_email', 'hc@99tests.de').single();
  
  if (!hcUser) {
    console.log("No HC found");
    return;
  }

  const { data: cases, error } = await supabaseAdmin
    .from('case')
    .select(`
      case_id:id,
      patient_id,
      patient:patient_id (
        patient_id:id,
        first_name,
        last_name
      )
    `)
    .eq('hc_id', hcUser.id)
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    // Console log the requested raw format
    cases.forEach(c => {
      console.log(`case_id: ${c.case_id} | case.patient_id: ${c.patient_id} | patient.id: ${c.patient ? c.patient.patient_id : 'NULL'} | Name: ${c.patient ? c.patient.first_name + ' ' + c.patient.last_name : 'NULL'}`);
    });
  }
}

run();
