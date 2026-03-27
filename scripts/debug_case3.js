const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runQueries() {
  const { data: users } = await supabase.auth.admin.listUsers();
  const matchedUser = users?.users.find(u => u.id === 'e908ac10-1fef-4096-b264-33cb2ef1c306');
  
  const { data: hcTable } = await supabase.from('healthcare_company').select('*').eq('id', 'e908ac10-1fef-4096-b264-33cb2ef1c306');
  
  const output = {
    matchedUser: matchedUser ? { id: matchedUser.id, email: matchedUser.email, role: matchedUser.user_metadata?.role } : null,
    hcTable: hcTable && hcTable.length > 0 ? hcTable[0] : null
  };
  
  fs.writeFileSync('debug_output2.json', JSON.stringify(output, null, 2));
}

runQueries();
