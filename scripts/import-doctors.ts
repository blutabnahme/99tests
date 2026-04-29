/**
 * 99Tests Doctor Migration Import Script
 * 
 * Reads doctor data from XLS, creates Supabase Auth users,
 * and creates tt_doctor profiles linked to them.
 * 
 * Usage:
 *   npx tsx scripts/import-doctors.ts --file ./data/Doctors_Import.xlsx --dry-run
 *   npx tsx scripts/import-doctors.ts --file ./data/Doctors_Import.xlsx
 * 
 * Options:
 *   --file <path>       Path to the XLS file (required)
 *   --dry-run           Validate and log without creating users
 *   --skip-auth         Skip Supabase Auth user creation (only create tt_doctor rows)
 *   --send-reset        Send password reset emails after creation
 *   --verbose           Show detailed per-row output
 * 
 * Prerequisites:
 *   npm install xlsx @supabase/supabase-js dotenv
 *   .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 
 * XLS Columns:
 *   email (required), full_name (required), phone, address_street,
 *   address_zip, address_city, role (doctor|admin), is_active
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as crypto from 'crypto';

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
const sendReset = args.includes('--send-reset');

if (!filePath) {
  console.error('Usage: npx tsx scripts/import-doctors.ts --file <path.xlsx> [--dry-run] [--skip-auth] [--send-reset] [--verbose]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ─── Column Mapping ──────────────────────────────────────────
const COL = {
  wp_id: 'wp_id',
  email: 'email',
  title: 'title',
  full_name: 'full_name',
  practice_name: 'practice_name',
  specialty: 'specialty',
  date_of_birth: 'date_of_birth',
  gender: 'gender',
  phone: 'phone',
  address_line_1: 'address_line_1',
  address_line_2: 'address_line_2',
  address_zip: 'address_zip',
  address_city: 'address_city',
  address_state: 'address_state',
  address_country: 'address_country',
  referral: 'referral',
  eligible_for_pvs: 'eligible_for_pvs',
  role: 'role',
  is_active: 'is_active',
};

// ─── Helpers ─────────────────────────────────────────────────
function cleanStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s || null;
}

function generateTempPassword(): string {
  return crypto.randomBytes(16).toString('hex');
}

function normalizePhone(val: any): string | null {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (!s || s === 'None') return null;
  
  // Already formatted with +
  if (s.startsWith('+')) return s;
  
  // Remove spaces, dashes, parentheses for normalization
  const digits = s.replace(/[\s\-().]/g, '');
  
  // Pure digits starting with country code — add +
  if (/^\d{10,15}$/.test(digits)) {
    // German (49), Austrian (43), Swiss (41), Polish (48), Dutch (31), US (1)
    if (digits.startsWith('49') || digits.startsWith('43') || digits.startsWith('41') || 
        digits.startsWith('48') || digits.startsWith('31') || digits.startsWith('1')) {
      return '+' + digits;
    }
    // Fallback: assume German if starts with 0 (local format)
    if (digits.startsWith('0')) {
      return '+49' + digits.substring(1);
    }
    return '+' + digits;
  }
  
  return s;
}

function parseDateOfBirth(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  
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

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  99Tests Doctor Migration Import');
  console.log(`  File: ${filePath}`);
  console.log(`  Mode: ${dryRun ? '🔍 DRY RUN' : '🚀 LIVE IMPORT'}`);
  if (skipAuth) console.log('  ⚠️  Skipping Auth user creation');
  if (sendReset) console.log('  📧 Will send password reset emails');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Check existing doctors in DB
  console.log('📦 Loading existing data...');
  const { data: existingDoctors } = await supabase.from('tt_doctor').select('id, email, user_id');
  const existingEmails = new Set((existingDoctors || []).map(d => d.email?.toLowerCase()).filter(Boolean));
  console.log(`  Existing doctors in DB: ${existingDoctors?.length || 0}`);

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
  const emailSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    const email = cleanStr(row[COL.email])?.toLowerCase();
    const fullName = cleanStr(row[COL.full_name]);
    const wpId = row[COL.wp_id];

    // Skip empty rows
    if (!email && !fullName) continue;

    // Required fields
    if (!email) { errors.push(`Row ${rowNum}: Missing email`); continue; }
    if (!fullName) { errors.push(`Row ${rowNum}: Missing full_name for ${email}`); continue; }
    if (wpId === null || wpId === undefined || wpId === '') { errors.push(`Row ${rowNum}: Missing wp_id for ${email}`); continue; }
    const wpIdNum = parseInt(String(wpId));
    if (isNaN(wpIdNum)) { errors.push(`Row ${rowNum}: Invalid wp_id '${wpId}' for ${email} — must be a number`); continue; }

    // Email validation
    if (!email.includes('@')) { errors.push(`Row ${rowNum}: Invalid email '${email}'`); continue; }

    // Duplicate in XLS
    if (emailSet.has(email)) { errors.push(`Row ${rowNum}: Duplicate email '${email}'`); continue; }
    emailSet.add(email);

    // Already exists in DB
    if (existingEmails.has(email)) {
      warnings.push(`Row ${rowNum}: '${email}' already exists in DB — will be UPDATED`);
    }

    // Role
    const rawRole = cleanStr(row[COL.role]) || 'doctor';
    const role = rawRole.toLowerCase();
    if (!['doctor', 'admin'].includes(role)) {
      errors.push(`Row ${rowNum}: Invalid role '${rawRole}' for ${email}. Must be 'doctor' or 'admin'`);
      continue;
    }

    // Status
    const rawStatus = cleanStr(row[COL.is_active]);
    const isActive = !rawStatus || rawStatus.toLowerCase() === 'active';

    validRows.push({
      wp_id: wpIdNum,
      email,
      title: cleanStr(row[COL.title]),
      full_name: fullName,
      practice_name: cleanStr(row[COL.practice_name]),
      specialty: cleanStr(row[COL.specialty]),
      date_of_birth: parseDateOfBirth(row[COL.date_of_birth]),
      gender: cleanStr(row[COL.gender]),
      phone: normalizePhone(row[COL.phone]),
      address_line_1: cleanStr(row[COL.address_line_1]),
      address_line_2: cleanStr(row[COL.address_line_2]),
      address_zip: cleanStr(row[COL.address_zip]),
      address_city: cleanStr(row[COL.address_city]),
      address_state: cleanStr(row[COL.address_state]),
      address_country: cleanStr(row[COL.address_country]) || 'D',
      referral: cleanStr(row[COL.referral]),
      eligible_for_pvs: row[COL.eligible_for_pvs] === false || String(row[COL.eligible_for_pvs]).toLowerCase() === 'false' || String(row[COL.eligible_for_pvs]).toLowerCase() === 'no' ? false : true,
      role,
      is_active: isActive,
      is_existing: existingEmails.has(email),
    });

    if (verbose) {
      console.log(`  ✓ Row ${rowNum}: ${email} — ${fullName} (${role})`);
    }
  }

  // 4. Report
  const newCount = validRows.filter(r => !r.is_existing).length;
  const updateCount = validRows.filter(r => r.is_existing).length;
  const doctorCount = validRows.filter(r => r.role === 'doctor').length;
  const adminCount = validRows.filter(r => r.role === 'admin').length;

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total XLS rows:    ${rows.length}`);
  console.log(`  Valid:             ${validRows.length}`);
  console.log(`  New:               ${newCount}`);
  console.log(`  Updates:           ${updateCount}`);
  console.log(`  Doctors:           ${doctorCount}`);
  console.log(`  Admins:            ${adminCount}`);
  console.log(`  Errors (blocked):  ${errors.length}`);
  console.log(`  Warnings:          ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n  ❌ ERRORS:');
    for (const e of errors) console.log(`    ${e}`);
  }

  if (warnings.length > 0) {
    console.log(`\n  ⚠️  WARNINGS (first 20):`);
    for (const w of warnings.slice(0, 20)) console.log(`    ${w}`);
  }

  if (errors.length > 0) {
    console.log('\n❌ Import blocked due to errors. Fix the XLS and retry.');
    process.exit(1);
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN — no changes made.');
    console.log('\n  Sample (first 3):');
    for (const r of validRows.slice(0, 3)) {
      console.log(`    ${r.email} — ${r.full_name} (${r.role}, ${r.is_existing ? 'UPDATE' : 'NEW'})`);
    }
    process.exit(0);
  }

  // 5. Import
  console.log(`\n🚀 Importing ${validRows.length} doctors...`);
  let created = 0;
  let updated = 0;
  let authCreated = 0;
  let failed = 0;
  const resetEmails: string[] = [];

  for (const row of validRows) {
    try {
      let userId: string | null = null;

      // Check if auth user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingAuthUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === row.email
      );

      if (!skipAuth) {
        if (existingAuthUser) {
          // Auth user exists — update metadata if needed
          userId = existingAuthUser.id;
          const currentRole = existingAuthUser.user_metadata?.role;
          if (currentRole !== row.role) {
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: { role: row.role }
            });
            if (verbose) console.log(`  ↻ Auth user updated: ${row.email} (role: ${currentRole} → ${row.role})`);
          }
        } else {
          // Create new auth user
          const tempPassword = generateTempPassword();
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: row.email,
            password: tempPassword,
            email_confirm: true, // Skip email verification
            user_metadata: { role: row.role }
          });

          if (authError) {
            console.error(`  ❌ Auth creation failed for ${row.email}: ${authError.message}`);
            failed++;
            continue;
          }

          userId = authData.user.id;
          authCreated++;
          resetEmails.push(row.email);

          if (verbose) console.log(`  ✓ Auth user created: ${row.email} (${row.role})`);
        }
      } else {
        // Skip auth — use existing auth user ID if found
        userId = existingAuthUser?.id || null;
      }

      // Create or update tt_doctor profile (only for doctor role)
      if (row.role === 'doctor') {
        const doctorData: any = {
          wp_id: row.wp_id,
          email: row.email,
          title: row.title,
          full_name: row.full_name,
          practice_name: row.practice_name,
          specialty: row.specialty,
          date_of_birth: row.date_of_birth || null,
          gender: row.gender || null,
          phone: row.phone,
          address_street: row.address_line_1,
          address_line_2: row.address_line_2,
          address_zip: row.address_zip,
          address_city: row.address_city,
          address_state: row.address_state,
          address_country: row.address_country,
          referral: row.referral,
          eligible_for_pvs: row.eligible_for_pvs,
          is_active: row.is_active,
          address_country: 'D',
          language: 'de',
        };

        if (userId) {
          doctorData.user_id = userId;
        }

        if (row.is_existing) {
          // Update existing doctor
          const { error: updateErr } = await supabase
            .from('tt_doctor')
            .update(doctorData)
            .eq('email', row.email);

          if (updateErr) {
            console.error(`  ❌ Update failed for ${row.email}: ${updateErr.message}`);
            failed++;
          } else {
            updated++;
            if (verbose) console.log(`  ↻ Doctor updated: ${row.email}`);
          }
        } else {
          // Insert new doctor
          const { error: insertErr } = await supabase
            .from('tt_doctor')
            .insert(doctorData);

          if (insertErr) {
            console.error(`  ❌ Insert failed for ${row.email}: ${insertErr.message}`);
            failed++;
          } else {
            created++;
            if (verbose) console.log(`  ✓ Doctor created: ${row.email}`);
          }
        }
      } else {
        // Admin — no tt_doctor profile needed, just auth user
        if (verbose) console.log(`  ✓ Admin auth user ready: ${row.email}`);
        created++;
      }

    } catch (err: any) {
      console.error(`  ❌ Error processing ${row.email}: ${err.message}`);
      failed++;
    }
  }

  // 6. Send password reset emails
  if (sendReset && resetEmails.length > 0) {
    console.log(`\n📧 Sending password reset emails to ${resetEmails.length} new users...`);
    let sent = 0;
    for (const email of resetEmails) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SUPABASE_URL.replace('.supabase.co', '')}/auth/reset-password`,
      });
      if (error) {
        console.log(`  ⚠️  Reset email failed for ${email}: ${error.message}`);
      } else {
        sent++;
        if (verbose) console.log(`  ✓ Reset email sent: ${email}`);
      }
    }
    console.log(`  Sent: ${sent}/${resetEmails.length}`);
  }

  // 7. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Auth users created: ${authCreated}`);
  console.log(`  Doctors created:    ${created}`);
  console.log(`  Doctors updated:    ${updated}`);
  console.log(`  Failed:             ${failed}`);
  if (resetEmails.length > 0 && !sendReset) {
    console.log(`\n  💡 ${resetEmails.length} new users need password reset.`);
    console.log('     Re-run with --send-reset to email them.');
  }
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n  ✅ All doctors imported successfully!');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
