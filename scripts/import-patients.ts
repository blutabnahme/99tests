/**
 * 99Tests Patient Migration Import Script
 * 
 * Reads patient data from XLS, creates Supabase Auth users (magic link),
 * and creates tt_patient profiles linked to their doctors.
 * 
 * Usage:
 *   npx tsx scripts/import-patients.ts --file ./data/Patients_Import.xlsx --dry-run
 *   npx tsx scripts/import-patients.ts --file ./data/Patients_Import.xlsx
 * 
 * Options:
 *   --file <path>       Path to the XLS file (required)
 *   --dry-run           Validate and log without creating users
 *   --skip-auth         Skip Supabase Auth user creation
 *   --verbose           Show detailed per-row output
 * 
 * Prerequisites:
 *   npm install xlsx @supabase/supabase-js dotenv
 *   .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 
 * XLS Columns:
 *   wp_post_id, doctor_id (email), salutation, first_name (required),
 *   last_name (required), gender, date_of_birth (required, DD/MM/YYYY),
 *   is_minor, guardian_salutation, guardian_first_name, guardian_last_name,
 *   email, phone, address_line1, address_line2, address_city, address_state,
 *   address_zip, address_country, insured_status, family_doctor, observations
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── CLI Args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const skipAuth = args.includes('--skip-auth');

if (!filePath) {
  console.error('Usage: npx tsx scripts/import-patients.ts --file <path.xlsx> [--dry-run] [--skip-auth] [--verbose]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ─── Column Mapping ──────────────────────────────────────────
const COL = {
  wp_post_id: 'wp_post_id',
  doctor_id: 'doctor_id',
  salutation: 'salutation',
  first_name: 'first_name',
  last_name: 'last_name',
  gender: 'gender',
  date_of_birth: 'date_of_birth',
  is_minor: 'is_minor',
  guardian_salutation: 'guardian_salutation',
  guardian_first_name: 'guardian_first_name',
  guardian_last_name: 'guardian_last_name',
  email: 'email',
  phone: 'phone',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  address_city: 'address_city',
  address_state: 'address_state',
  address_zip: 'address_zip',
  address_country: 'address_country',
  insured_status: 'insured_status',
  family_doctor: 'family_doctor',
  observations: 'observations',
};

// ─── Helpers ─────────────────────────────────────────────────
function cleanStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return (s && s !== 'None') ? s : null;
}

function parseDateOfBirth(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s || s === 'None') return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY or DD.MM.YYYY
  const match = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Excel serial date number
  if (/^\d{5}$/.test(s)) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + parseInt(s) * 86400000);
    return date.toISOString().substring(0, 10);
  }

  return null;
}

function normalizePhone(val: any): string | null {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (!s || s === 'None') return null;

  if (s.startsWith('+')) return s;

  const digits = s.replace(/[\s\-().]/g, '');

  if (/^\d{10,15}$/.test(digits)) {
    if (digits.startsWith('49') || digits.startsWith('43') || digits.startsWith('41') ||
        digits.startsWith('48') || digits.startsWith('31') || digits.startsWith('1')) {
      return '+' + digits;
    }
    if (digits.startsWith('0')) {
      return '+49' + digits.substring(1);
    }
    return '+' + digits;
  }

  return s;
}

function parseInsuredStatus(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  if (s === 'privat versichert' || s === 'privat_versichert') return 'privat_versichert';
  if (s === 'selbstzahler') return 'selbstzahler';
  if (s === 'gesetzlich') return 'gesetzlich';
  return null;
}

function parseBoolean(val: any): boolean {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === 'ja' || s === '1' || s === 'x';
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  99Tests Patient Migration Import');
  console.log(`  File: ${filePath}`);
  console.log(`  Mode: ${dryRun ? '🔍 DRY RUN' : '🚀 LIVE IMPORT'}`);
  if (skipAuth) console.log('  ⚠️  Skipping Auth user creation');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Load lookup data
  console.log('📦 Loading lookup data...');

  // Doctors lookup by email
  const { data: doctors } = await supabase.from('tt_doctor').select('id, email');
  const doctorLookup = new Map<string, string>();
  for (const doc of doctors || []) {
    if (doc.email) doctorLookup.set(doc.email.toLowerCase(), doc.id);
  }
  console.log(`  Doctors: ${doctorLookup.size} loaded`);

  // Existing patients
  const { data: existingPatients } = await supabase.from('tt_patient').select('id, email, wp_post_id');
  console.log(`  Existing patients: ${existingPatients?.length || 0}`);

  // 2. Read XLS
  console.log('\n📄 Reading XLS...');
  const workbook = XLSX.readFile(filePath!);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`  Sheet: ${sheetName}, Rows: ${rows.length}`);

  // 3. Validate
  console.log('\n🔍 Validating...');
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRows: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const firstName = cleanStr(row[COL.first_name]);
    const lastName = cleanStr(row[COL.last_name]);
    const wpPostId = row[COL.wp_post_id];

    // Skip empty rows
    if (!firstName && !lastName) continue;

    // Required fields
    if (!firstName) { errors.push(`Row ${rowNum}: Missing first_name`); continue; }
    if (!lastName) { errors.push(`Row ${rowNum}: Missing last_name`); continue; }

    // Date of birth (optional — patient fills in on first access if missing)
    const dob = parseDateOfBirth(row[COL.date_of_birth]);
    if (!dob) {
      warnings.push(`Row ${rowNum}: Missing date_of_birth for ${firstName} ${lastName}`);
    }

    // Doctor lookup
    const doctorEmail = cleanStr(row[COL.doctor_id])?.toLowerCase();
    let doctorId: string | null = null;
    if (doctorEmail) {
      doctorId = doctorLookup.get(doctorEmail) || null;
      if (!doctorId) {
        warnings.push(`Row ${rowNum}: Unknown doctor email '${doctorEmail}' for ${firstName} ${lastName}`);
      }
    }

    // Minor detection: check from field first, then calculate from DOB
    let isMinor = parseBoolean(row[COL.is_minor]);
    if (!isMinor && dob) {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        isMinor = true;
      }
    }

    // Guardian warning for minors
    const guardianFirstName = cleanStr(row[COL.guardian_first_name]);
    const guardianLastName = cleanStr(row[COL.guardian_last_name]);
    if (isMinor && !guardianFirstName && !guardianLastName) {
      warnings.push(`Row ${rowNum}: Minor ${firstName} ${lastName} has no guardian data`);
    }

    // Gender
    const rawGender = cleanStr(row[COL.gender]);
    const gender = rawGender ? rawGender.toUpperCase().charAt(0) : null;
    const validGender = gender && ['M', 'W', 'D'].includes(gender) ? gender : null;

    // Insured status
    const insuredStatus = parseInsuredStatus(row[COL.insured_status]);

    validRows.push({
      wp_post_id: wpPostId ? parseInt(String(wpPostId)) : null,
      doctor_id: doctorId,
      salutation: cleanStr(row[COL.salutation]),
      first_name: firstName,
      last_name: lastName,
      gender: validGender,
      date_of_birth: dob,
      is_minor: isMinor,
      guardian_salutation: cleanStr(row[COL.guardian_salutation]),
      guardian_first_name: guardianFirstName,
      guardian_last_name: guardianLastName,
      email: cleanStr(row[COL.email])?.toLowerCase() || null,
      phone: normalizePhone(row[COL.phone]),
      address_line1: cleanStr(row[COL.address_line1]),
      address_line2: cleanStr(row[COL.address_line2]),
      address_city: cleanStr(row[COL.address_city]),
      address_state: cleanStr(row[COL.address_state]),
      address_zip: cleanStr(row[COL.address_zip]),
      address_country: cleanStr(row[COL.address_country]) || 'D',
      insured_status: insuredStatus,
      family_doctor: cleanStr(row[COL.family_doctor]),
      observations: cleanStr(row[COL.observations]),
    });

    if (verbose) {
      console.log(`  ✓ Row ${rowNum}: ${firstName} ${lastName} (${doctorEmail || 'no doctor'})`);
    }
  }

  // 4. Stats
  const uniqueEmails = new Set(validRows.filter(r => r.email).map(r => r.email));
  const minorCount = validRows.filter(r => r.is_minor).length;
  const noDoctorCount = validRows.filter(r => !r.doctor_id).length;
  const noEmailCount = validRows.filter(r => !r.email).length;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total XLS rows:       ${rows.length}`);
  console.log(`  Valid:                 ${validRows.length}`);
  console.log(`  Unique emails:        ${uniqueEmails.size}`);
  console.log(`  Auth users to create: ${uniqueEmails.size} (1 per unique email)`);
  console.log(`  Minors:               ${minorCount}`);
  console.log(`  Without doctor:       ${noDoctorCount}`);
  console.log(`  Without email:        ${noEmailCount}`);
  console.log(`  Errors (blocked):     ${errors.length}`);
  console.log(`  Warnings:             ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n  ❌ ERRORS:');
    for (const e of errors) console.log(`    ${e}`);
  }

  if (warnings.length > 0) {
    console.log(`\n  ⚠️  WARNINGS (first 20):`);
    for (const w of warnings.slice(0, 20)) console.log(`    ${w}`);
    if (warnings.length > 20) console.log(`    ... and ${warnings.length - 20} more`);
  }

  if (errors.length > 0) {
    console.log('\n❌ Import blocked due to errors. Fix the XLS and retry.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN — no changes made.');
    console.log('\n  Sample (first 3):');
    for (const r of validRows.slice(0, 3)) {
      console.log(`    ${r.first_name} ${r.last_name} — ${r.email || 'no email'} (doctor: ${r.doctor_id ? 'linked' : 'none'}, minor: ${r.is_minor})`);
    }
    process.exit(0);
  }

  // 5. Create Auth users (one per unique email)
  const emailToUserId = new Map<string, string>();

  if (!skipAuth) {
    console.log(`\n🔐 Creating ${uniqueEmails.size} auth users (magic link only)...`);

    // Load existing auth users
    const { data: existingAuthData } = await supabase.auth.admin.listUsers();
    const existingAuthEmails = new Map<string, string>();
    for (const u of existingAuthData?.users || []) {
      if (u.email) existingAuthEmails.set(u.email.toLowerCase(), u.id);
    }

    let authCreated = 0;
    let authExisted = 0;

    for (const email of uniqueEmails) {
      // Check if auth user already exists
      const existingId = existingAuthEmails.get(email);
      if (existingId) {
        emailToUserId.set(email, existingId);
        authExisted++;
        if (verbose) console.log(`  ↻ Auth exists: ${email}`);
        continue;
      }

      // Create new auth user with random password (patient uses magic link)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: require('crypto').randomBytes(32).toString('hex'),
        email_confirm: true,
        user_metadata: { role: 'patient' }
      });

      if (authError) {
        console.error(`  ❌ Auth failed for ${email}: ${authError.message}`);
        continue;
      }

      emailToUserId.set(email, authData.user.id);
      authCreated++;
      if (verbose) console.log(`  ✓ Auth created: ${email}`);
    }

    console.log(`  Auth created: ${authCreated}, already existed: ${authExisted}`);
  }

  // 6. Insert patients
  console.log(`\n🚀 Inserting ${validRows.length} patients...`);
  let created = 0;
  let failed = 0;

  // Batch insert for performance
  const BATCH_SIZE = 50;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);

    const insertData = batch.map(row => ({
      wp_post_id: row.wp_post_id,
      doctor_id: row.doctor_id,
      user_id: row.email ? (emailToUserId.get(row.email) || null) : null,
      salutation: row.salutation,
      first_name: row.first_name,
      last_name: row.last_name,
      gender: row.gender,
      date_of_birth: row.date_of_birth,
      is_minor: row.is_minor,
      guardian_salutation: row.guardian_salutation,
      guardian_first_name: row.guardian_first_name,
      guardian_last_name: row.guardian_last_name,
      email: row.email,
      phone: row.phone,
      address_line1: row.address_line1,
      address_line2: row.address_line2,
      address_city: row.address_city,
      address_state: row.address_state,
      address_zip: row.address_zip,
      address_country: row.address_country,
      insured_status: row.insured_status,
      family_doctor: row.family_doctor,
      observations: row.observations,
    }));

    const { data, error } = await supabase
      .from('tt_patient')
      .insert(insertData)
      .select('id');

    if (error) {
      console.error(`  ❌ Batch ${batchNum}/${totalBatches} failed: ${error.message}`);
      // Try one by one to find the problem row
      for (const row of insertData) {
        const { error: singleErr } = await supabase.from('tt_patient').insert(row);
        if (singleErr) {
          console.error(`    ❌ ${row.first_name} ${row.last_name} (${row.email}): ${singleErr.message}`);
          failed++;
        } else {
          created++;
        }
      }
    } else {
      created += data?.length || 0;
      console.log(`  ✓ Batch ${batchNum}/${totalBatches}: ${data?.length || 0} patients`);
    }
  }

  // 7. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Auth users:     ${emailToUserId.size}`);
  console.log(`  Patients created: ${created}`);
  console.log(`  Failed:           ${failed}`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n  ✅ All patients imported successfully!');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});