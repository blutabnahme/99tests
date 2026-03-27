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

async function cleanDummy() {
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .ilike('title', '%Appointment Booked%');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Dummy notifications deleted');
  }
}

cleanDummy();
