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
  const hcUser = { id: 'e908ac10-1fef-4096-b264-33cb2ef1c306' }; // the generic hc ID we know

  const { data: casesList, error } = await supabaseAdmin
    .from("case")
    .select(`
      id, created_at,
      patient:patient_id (
        id, first_name, last_name, date_of_birth, contact_email, phone
      )
    `)
    .eq("hc_id", hcUser.id)
    .order("created_at", { ascending: false });

  console.log(JSON.stringify(casesList, null, 2));

  // Loop simulation
  const validCases = casesList || [];
  const patientMap = new Map();

  validCases.forEach(c => {
    const p = c.patient;
    if (!p) return;

    if (!patientMap.has(p.id)) {
      patientMap.set(p.id, {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
      });
    }
  });

  const uniquePatients = Array.from(patientMap.values());
  console.log("Unique Patients:", uniquePatients);
}
run();
