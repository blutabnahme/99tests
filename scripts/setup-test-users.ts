import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!SCKey || !apiUrl) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

const supabase = createClient(apiUrl, SCKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getAllUsers() {
  const allUsers: any[] = [];
  let page = 1;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !users || users.length === 0) break;
    allUsers.push(...users);
    if (users.length < 1000) break;
    page++;
  }
  return allUsers;
}

async function assignEmailToId(id: string, email: string, role: string, allUsers: any[]) {
  const existingUser = allUsers.find(u => u.email === email);
  
  if (existingUser && existingUser.id !== id) {
     await supabase.auth.admin.deleteUser(existingUser.id);
  }
  
  const { error } = await supabase.auth.admin.updateUserById(id, {
    email,
    password: 'Test1234!',
    email_confirm: true,
    user_metadata: { role }
  });
  
  if (error) {
     console.error(`Failed to assign ${email} to ${id}:`, error.message);
     return false;
  }
  return true;
}

async function setup() {
  console.log("Setting up test users...");

  const allUsers = await getAllUsers();
  
  // 1. Admin (pure auth user, not in public tables)
  const existingAdmin = allUsers.find(u => u.email === 'admin@99tests.de');
  
  if (!existingAdmin) {
    const { error } = await supabase.auth.admin.createUser({
      email: 'admin@99tests.de',
      password: 'Test1234!',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (error) {
        console.error("Failed to create admin:", error.message);
    } else {
        console.log("Created admin user.");
    }
  } else {
    const { error } = await supabase.auth.admin.updateUserById(existingAdmin.id, {
      password: 'Test1234!',
      email_confirm: true,
      user_metadata: { role: 'admin' }
    });
    if (error) {
        console.error("Failed to update admin:", error.message);
    } else {
        console.log("Updated admin user password.");
    }
  }

  // 2. Healthcare Company
  const { data: hcData, error: hcError } = await supabase.from('healthcare_company').select('id, name').limit(1).single();
  if (hcError || !hcData) {
    console.log("No healthcare company found. Did you run `npm run seed`?");
  } else {
    const success = await assignEmailToId(hcData.id, 'hc@99tests.de', 'healthcare_company', allUsers);
    if (success) console.log(`Linked HC to hc@99tests.de (${hcData.name})`);
  }

  // 3. Blood Collector
  const { data: bcData, error: bcError } = await supabase.from('blood_collector').select('id, first_name, last_name').limit(1).single();
  if (bcError || !bcData) {
    console.log("No blood collector found. Did you run `npm run seed`?");
  } else {
    const success = await assignEmailToId(bcData.id, 'bc@99tests.de', 'blood_collector', allUsers);
    if (success) console.log(`Linked BC to bc@99tests.de (${bcData.first_name} ${bcData.last_name})`);
  }

  console.log("\n--- TEST CREDENTIALS ---");
  console.log("Admin: admin@99tests.de / Test1234! / role: admin");
  console.log("Healthcare Company: hc@99tests.de / Test1234! / role: healthcare_company");
  console.log("Blood Collector: bc@99tests.de / Test1234! / role: blood_collector");
  console.log("------------------------\n");
}

setup().catch(console.error);
