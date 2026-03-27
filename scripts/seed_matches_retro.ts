import { createClient } from "@supabase/supabase-js";
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Fetching active BCs...");
  const { data: bcs, error: bcErr } = await supabaseAdmin
    .from('blood_collector')
    .select('id')
    .eq('status', 'active');

  if (bcErr) {
    console.error("Error fetching BCs:", bcErr);
    process.exit(1);
  }

  if (!bcs || bcs.length === 0) {
    console.log("No active BCs found.");
    process.exit(0);
  }

  console.log(`Found ${bcs.length} active BCs. Seeding match records for BLT-2026-6147...`);
  const payloads = bcs.map(bc => ({
    case_id: 'BLT-2026-6147',
    bc_id: bc.id,
    status: 'available',
    rank: 0,
    score: 0
  }));

  const { error: matchErr } = await supabaseAdmin.from('match').insert(payloads);
  if (matchErr) {
    console.error("Match Insert Error:", matchErr);
  } else {
    console.log("Successfully seeded records retroactively!");
  }
}

main().catch(console.error);
