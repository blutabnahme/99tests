import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Load .env.local
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SCKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!SCKey || !apiUrl) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.");
  process.exit(1);
}

const supabase = createClient(apiUrl, SCKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log("Starting seed script...");

  // Since Supabase `listUsers` is paginated, we need to fetch all to safely find existing
  async function getAllUsers() {
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      allUsers = allUsers.concat(data.users);
      hasMore = data.users.length === 1000;
      page++;
    }
    return allUsers;
  }

  const existingUsers = await getAllUsers();
  
  // Helper to create users with known passwords
  async function createOrUpdateAuthUser(email: string, role: string) {
    let user = existingUsers.find(u => u.email === email);
    
    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: 'Test1234!',
        email_confirm: true,
        user_metadata: { role }
      });
      if (error) {
         if (error.message.includes('already exists')) {
             // Parallel creation edge case
             user = existingUsers.find(u => u.email === email);
         } else {
             throw error;
         }
      } else {
         user = data.user;
      }
    } else {
      // Update password and metadata to guarantee it works
      await supabase.auth.admin.updateUserById(user.id, {
        password: 'Test1234!',
        email_confirm: true,
        user_metadata: { role }
      });
    }
    return user!.id;
  }

  try {
    const defaultPassword = 'Test1234!';
    console.log("Users will be created with password:", defaultPassword);

    // 0. Admin User
    console.log("Creating Admin...");
    const adminEmail = "admin@99tests.de";
    await createOrUpdateAuthUser(adminEmail, 'admin');

    // 1. Healthcare Companies
    console.log("Creating Healthcare Companies...");
    const hc1Email = "hc@99tests.de";
    const hc1Id = await createOrUpdateAuthUser(hc1Email, 'healthcare_company');
    await supabase.from('healthcare_company').upsert({
      id: hc1Id,
      name: 'Berlin Health Lab',
      contact_email: hc1Email,
      type: 'lab',
      status: 'active',
      default_bc_selection_mode: 'patient_decides'
    });

    const hc2Email = "hc2@99tests.de";
    const hc2Id = await createOrUpdateAuthUser(hc2Email, 'healthcare_company');
    await supabase.from('healthcare_company').upsert({
      id: hc2Id,
      name: 'Munich Diagnostic Center',
      contact_email: hc2Email,
      type: 'practice',
      status: 'active',
      default_bc_selection_mode: 'hc_curates'
    });

    // 2. Blood Collectors
    console.log("Creating Blood Collectors...");
    const bc1Email = "bc@99tests.de";
    const bc1Id = await createOrUpdateAuthUser(bc1Email, 'blood_collector');
    await supabase.from('blood_collector').upsert({
      id: bc1Id,
      first_name: 'Anna',
      last_name: 'Weber',
      contact_email: bc1Email,
      address: { city: 'Berlin', street: 'Alexanderplatz 1', zip: '10178' },
      qualification: 'MFA',
      status: 'active',
      rating: 4.9,
      total_collections: 1247,
      base_fee: 45.0,
      travel_fee_per_km: 1.5,
      max_travel_distance_km: 50,
      special_experience: { children: true, elderly: true }
    });

    const bc2Email = "bc2@99tests.de";
    const bc2Id = await createOrUpdateAuthUser(bc2Email, 'blood_collector');
    await supabase.from('blood_collector').upsert({
      id: bc2Id,
      first_name: 'Dr. Klaus',
      last_name: 'Frey',
      contact_email: bc2Email,
      address: { city: 'Berlin', street: 'Kurfürstendamm 1', zip: '10707' },
      qualification: 'Doctor',
      status: 'active',
      rating: 4.8,
      total_collections: 634,
      base_fee: 65.0,
      travel_fee_per_km: 2.0,
      max_travel_distance_km: 30
    });

    const bc3Email = "bc3@99tests.de";
    const bc3Id = await createOrUpdateAuthUser(bc3Email, 'blood_collector');
    await supabase.from('blood_collector').upsert({
      id: bc3Id,
      first_name: 'Sophie',
      last_name: 'Lang',
      contact_email: bc3Email,
      address: { city: 'Berlin', street: 'Friedrichstraße 1', zip: '10117' },
      qualification: 'Nurse',
      status: 'active',
      rating: 4.7,
      total_collections: 1891,
      base_fee: 40.0,
      travel_fee_per_km: 1.2,
      max_travel_distance_km: 40,
      custom_commission_rate: 10.0 // Custom 10% rate for BC3 (Requirement)
    });

    // 2.5 Generate BC Availability (Mon-Fri 08:00 to 17:00 for Next 14 Days Equivalent)
    console.log("Creating Blood Collectors Availability...");
    const currentBCs = [bc1Id, bc2Id, bc3Id];
    const availabilityRecords = [];
    
    for (const bcId of currentBCs) {
       for (let day = 1; day <= 5; day++) { // Monday (1) to Friday (5)
           availabilityRecords.push({
               bc_id: bcId,
               day_of_week: day,
               start_time: '08:00',
               end_time: '17:00',
               is_blocked: false,
               visit_type: 'both' // Practice and Home Visits
           });
       }
    }
    const { error: seedError } = await supabase.from('bc_availability').insert(availabilityRecords);
    if(seedError) console.error("Availability Seed Error:", seedError);

    // 3. Patients
    console.log("Creating Patients...");
    const p1Email = `patient_1_${randomUUID().slice(0, 8)}@example.com`;
    const p1Id = await createOrUpdateAuthUser(p1Email, 'patient');
    await supabase.from('patient').upsert({
      id: p1Id,
      hc_id: hc1Id,
      first_name: 'Hans',
      last_name: 'Mueller',
      date_of_birth: '1980-01-01',
      gender: 'male',
      contact_email: p1Email,
      phone: '+49123456789',
      address: { city: 'Berlin', street: 'Musterweg 12', zip: '10115' },
      insurance_type: 'public'
    });

    // 4. Create 10 Cases (Various Statuses)
    console.log("Creating 10 Cases & Relationships...");
    const caseStatuses = [
      'created', 'matched', 'pending_booking', 'booked', 'paid',
      'completed', 'cancelled', 'completed', 'paid', 'matched'
    ];
    
    // We will accumulate payment IDs assigned to an invoice for the HC.
    const historicalPaymentIds: string[] = [];
    let invCaseCount = 0;
    let invSubtotal = 0;
    let invVat = 0;
    let invTotal = 0;
    let invOrgFees = 0;
    let invMaterialFees = 0;

    for (let i = 0; i < 10; i++) {
        // First case has a known ID for patient portal testing
        const caseId = i === 1 ? 'BLT-2026-0845' : `BLT-2026-${1000 + i}`;
        const status = caseStatuses[i];
        
        // Random days ago between 1 and 30
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const caseDate = new Date();
        caseDate.setDate(caseDate.getDate() - daysAgo);

        const bFee = 45 + (Math.random() * 20);
        const tFee = Math.random() > 0.5 ? 15 : 0;
        const subtotal = bFee + tFee;
        const vat = subtotal * 0.19;
        const total = subtotal + vat;

        await supabase.from('case').upsert({
          id: caseId,
          hc_id: hc1Id,
          patient_id: p1Id,
          test_types: ['Complete Blood Count', 'Lipid Panel'],
          urgency_level: 'normal',
          mobility: tFee > 0 ? 'home_visit' : 'practice',
          status: status,
          bc_selection_mode: 'patient_decides',
          estimated_fees: { total_incl_vat: total, total_excl_vat: subtotal, vat: vat, base_fee: bFee, travel_fee: tFee, material_cost: 0 },
          therapeutic_confirmation: true,
          created_at: caseDate.toISOString()
        });

        // Add matches for all EXCEPT 'created'
        if (status !== 'created' && status !== 'cancelled') {
           const bcIds = [bc1Id, bc2Id, bc3Id];
           const selectedBc = bcIds[i % 3]; // Round robin selection
           
           // Insert matching profiles
           await supabase.from('match').upsert([
             { id: randomUUID(), case_id: caseId, bc_id: bc1Id, rank: 1, score: 95.5, estimated_travel_km: 3.2, status: selectedBc === bc1Id && status !== 'matched' ? 'selected' : 'approved' },
             { id: randomUUID(), case_id: caseId, bc_id: bc2Id, rank: 2, score: 88.0, estimated_travel_km: 6.5, status: selectedBc === bc2Id && status !== 'matched' ? 'selected' : 'approved' },
             { id: randomUUID(), case_id: caseId, bc_id: bc3Id, rank: 3, score: 85.2, estimated_travel_km: 5.1, status: selectedBc === bc3Id && status !== 'matched' ? 'selected' : 'approved' }
           ]);

           // Add appointments and payments if booked or further
           if (['booked', 'paid', 'completed'].includes(status)) {
               const aptId = randomUUID();
               await supabase.from('appointment').upsert({
                  id: aptId,
                  case_id: caseId,
                  bc_id: selectedBc,
                  patient_id: p1Id,
                  scheduled_at: caseDate.toISOString(),
                  status: status === 'booked' ? 'scheduled' : 'completed',
                  type: tFee > 0 ? 'home' : 'practice'
               });
               
               // Add payment if paid or completed
               if (['paid', 'completed'].includes(status)) {
                  const commRate = selectedBc === bc3Id ? 0.10 : 0.15;
                  let commAmount = subtotal * commRate;
                  let payout = subtotal - commAmount;

                  if (payout < 12.50) {
                     payout = 12.50;
                     commAmount = subtotal - 12.50;
                  }

                  const paymentId = randomUUID();
                  await supabase.from('payment').upsert({
                     id: paymentId,
                     case_id: caseId,
                     appointment_id: aptId,
                     patient_amount: Number(total.toFixed(2)),
                     vat_amount: Number(vat.toFixed(2)),
                     bc_payout: Number(payout.toFixed(2)),
                     platform_commission: Number(commAmount.toFixed(2)),
                     status: 'completed',
                     paid_at: caseDate.toISOString()
                  });
                  
                  historicalPaymentIds.push(paymentId);
                  
                  invCaseCount++;
                  invSubtotal += subtotal;
                  invVat += vat;
                  invTotal += total;
                  invOrgFees += tFee > 0 ? 12.0 : 8.0;
                  invMaterialFees += 3.5;
               }
           }
        }
    }

    // 5. Generate HC Monthly Invoice
    if (invCaseCount > 0) {
        console.log("Generating HC Monthly Invoice...");
        const invoiceId = randomUUID();
        const invoiceNumber = `INV-${new Date().getFullYear()}-001`;
        
        await supabase.from('hc_invoice').upsert({
           id: invoiceId,
           hc_id: hc1Id,
           invoice_number: invoiceNumber,
           period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
           period_end: new Date().toISOString(),
           case_count: invCaseCount,
           org_fees_total: invOrgFees,
           material_fees_total: invMaterialFees,
           logistics_fees_total: 0,
           subtotal: invSubtotal,
           vat_amount: invVat,
           total_amount: invTotal,
           status: 'paid',
           due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
           paid_at: new Date().toISOString()
        });

        for (const pId of historicalPaymentIds) {
           await supabase.from('payment').update({ hc_invoice_id: invoiceId }).eq('id', pId);
        }
    }

    // 6. Generate BC Payouts (Batches)
    console.log("Generating Historic Payout Batches...");
    await supabase.from('bc_payouts').upsert([
       {
         id: randomUUID(),
         bc_id: bc1Id,
         period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
         period_end: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
         case_count: 3,
         gross_amount: 155.00,
         commission_total: 23.25,
         net_amount: 131.75,
         reference_number: `BATCH-${randomUUID().slice(0,6).toUpperCase()}`,
         status: 'processed'
       },
       {
         id: randomUUID(),
         bc_id: bc3Id,
         period_start: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
         period_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
         case_count: 5,
         gross_amount: 250.00,
         commission_total: 25.00, // 10% custom rate
         net_amount: 225.00,
         reference_number: `BATCH-${randomUUID().slice(0,6).toUpperCase()}`,
         status: 'processed'
       }
    ]);

    console.log("✅ Seed complete!");
    console.log("====== TEST CREDENTIALS (All use password: 'Test1234!') ======");
    console.log("Admin : admin@99tests.de");
    console.log("HC 1  : hc@99tests.de");
    console.log("HC 2  : hc2@99tests.de");
    console.log("BC 1  : bc@99tests.de");
    console.log("BC 2  : bc2@99tests.de");
    console.log("BC 3  : bc3@99tests.de");
    console.log("==============================================================");
    console.log("Try the patient portal here with matched cases: http://localhost:3000/patient/BLT-2026-0845");

  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
