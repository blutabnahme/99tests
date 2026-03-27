import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
   const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/031_faq_table.sql'), 'utf-8');
   const client = new Client({
      connectionString: "postgresql://postgres:h9T%23mK2p%24L5vR8xQ@db.vrlhrmdlkycvmajgdmdw.supabase.co:5432/postgres",
      ssl: { rejectUnauthorized: false }
   });

   try {
      await client.connect();
      await client.query(sql);
      console.log("FAQ Migration executed successfully!");
   } catch(e) {
      console.error("Migration failed:", e);
   } finally {
      await client.end();
   }
}
run();
