const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runQueries() {
  const { data: searchData, error } = await supabase.auth.admin.listUsers();
  const exactUser = searchData?.users?.find(u => u.email === 'hc@99tests.de');
  
  if (!exactUser) {
    // try paginating to find it
    let found = null;
    let page = 1;
    while (!found && page < 20) {
      const { data } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
      if (!data || !data.users || data.users.length === 0) break;
      found = data.users.find(u => u.email === 'hc@99tests.de');
      page++;
    }
    fs.writeFileSync('debug_output4.json', JSON.stringify({ user: found }, null, 2));
  } else {
    fs.writeFileSync('debug_output4.json', JSON.stringify({ user: exactUser }, null, 2));
  }
}

runQueries();
