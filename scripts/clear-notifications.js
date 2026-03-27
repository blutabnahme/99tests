require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('Deleting test notifications...');
  
  // Delete notifications containing 'test', 'dummy', 'Late Arrival'
  const { data, error } = await supabase
    .from('notifications')
    .delete()
    .or("title.ilike.%test%,title.ilike.%Late Arrival%,message.ilike.%test%,message.ilike.%dummy%");

  if (error) {
    console.error('Error deleting notifications:', error);
  } else {
    console.log('Successfully deleted test notifications.');
  }
}

main();
