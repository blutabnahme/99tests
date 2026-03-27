const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runQueries() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const hcUser = users?.users.find(u => u.email === 'hc@99tests.de' || u.user_metadata?.role === 'healthcare_company');
  
  const { data: caseData } = await supabase.from('case').select('id, status, hc_id, created_at').eq('id', 'BLT-2026-6147');
  
  const output = {
    hc_user_from_auth: hcUser ? { id: hcUser.id, email: hcUser.email } : null,
    case_6147: caseData && caseData.length > 0 ? caseData[0] : null
  };
  
  fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
}

runQueries();
