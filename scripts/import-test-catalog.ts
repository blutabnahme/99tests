/**
 * 99Tests Test Catalog Import Script
 * 
 * Reads the test catalog XLS and upserts into tt_test_catalog via Supabase.
 * 
 * Usage:
 *   npx tsx scripts/import-test-catalog.ts --file ./Tests_Export.xlsx --dry-run
 *   npx tsx scripts/import-test-catalog.ts --file ./Tests_Export.xlsx
 *   npx tsx scripts/import-test-catalog.ts --file ./Tests_Export.xlsx --lab "MVZ Labor Ravensburg"
 * 
 * Options:
 *   --file <path>     Path to the XLS file (required)
 *   --dry-run         Validate and log without inserting
 *   --lab <name>      Only import tests for this laboratory
 *   --verbose         Show detailed per-row output
 * 
 * Prerequisites:
 *   npm install xlsx @supabase/supabase-js dotenv
 *   .env.local must have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CLI Args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const filePath = fileIdx >= 0 ? args[fileIdx + 1] : null;
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const labFilterIdx = args.indexOf('--lab');
const labFilter = labFilterIdx >= 0 ? args[labFilterIdx + 1] : null;

if (!filePath) {
  console.error('Usage: npx tsx scripts/import-test-catalog.ts --file <path.xlsx> [--dry-run] [--lab <name>] [--verbose]');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1);
}

// ─── Column Mapping (XLS header → index) ─────────────────────
const COL = {
  sku: 'sku',                           // A
  laboratory: 'laboratory',             // B
  type: 'type',                         // C
  status: 'status',                     // D
  restricted_to: 'restricted_to',       // E
  name: 'name',                         // F
  included_parameters: 'included_parameters', // G
  anamnese_parameters: 'anamnese_parameters', // H
  material: 'material',                 // I
  sample: 'sample',                     // J
  method: 'method',                     // K
  sample_shipping: 'sample_shipping',   // L
  preanalytics: 'preanalytics',         // M
  more_info_url: 'more_info_url',       // N
  anamnese_type_biovis: 'anamnese_type_biovis', // O
  test_kit: 'test_kit',                 // P
  edv_code: 'edv_code',                 // Q
  goae_digit: 'goae_digit',             // R
  goae_names: 'goae_names',             // S
  goae_factor: 'goae_factor',           // T
  goae_costs: 'goae_costs',             // U
  lab_cost: 'lab_cost',                 // V
  price_insured: 'price_insured',       // W
  price_uninsured: 'price_uninsured',   // X
  price_zone1: 'price_zone1',           // Y
  price_zone2: 'price_zone2',           // Z
  price_zone3: 'price_zone3',           // AA
};

// ─── Type & Status Mapping ───────────────────────────────────
const TYPE_MAP: Record<string, string> = {
  'Parameter': 'parameter',
  'parameter': 'parameter',
  'Profile': 'profile',
  'profile': 'profile',
};

const SHIPPING_MAP: Record<string, string> = {
  'standard': 'standard',
  'prio': 'prio',
  'express': 'express',
  'gologistik': 'gologistik',
};

// ─── Material Parser ─────────────────────────────────────────
interface ParsedMaterial {
  name: string;
  qty: number;
  required_volume: number | null;
  volume_unit: string;
  raw: string;
}

function parseMaterialString(matStr: string): ParsedMaterial[] {
  if (!matStr || !matStr.trim()) return [];

  const results: ParsedMaterial[] = [];

  // Split on commas NOT inside parentheses
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of matStr) {
    if (ch === '(') { depth++; current += ch; }
    else if (ch === ')') { depth--; current += ch; }
    else if (ch === ',' && depth === 0) { parts.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) parts.push(current.trim());

  for (const part of parts) {
    if (!part) continue;

    // Pattern: "MaterialName (2x 8,5ml)" or "MaterialName (2,7ml)" or "MaterialName" or "2x Stuhl"
    let name = part;
    let qty = 1;
    let volume: number | null = null;
    let unit = 'ml';

    // Check for leading quantity: "2x Stuhl", "3x Stuhl"
    const leadingQty = part.match(/^(\d+)x\s+(.+)$/);
    if (leadingQty) {
      qty = parseInt(leadingQty[1]);
      name = leadingQty[2];
    }

    // Extract parenthesized info: "Name (2x 8,5ml)" or "Name (2,7ml)" or "Name (0.5 ml)"
    const parenMatch = name.match(/^(.+?)\s*\((.+?)\)\s*$/);
    if (parenMatch) {
      name = parenMatch[1].trim();
      const info = parenMatch[2].trim();

      // Parse qty and volume from parenthesized content
      // Patterns: "2x 8,5ml", "2,7ml", "0.5ml", "0.5 ml", "2x"
      const qtyVolMatch = info.match(/^(\d+)x\s+([\d,.]+)\s*(ml|µl|g)?$/i);
      const volMatch = info.match(/^([\d,.]+)\s*(ml|µl|g)?$/i);
      const qtyOnlyMatch = info.match(/^(\d+)x$/);

      if (qtyVolMatch) {
        qty = parseInt(qtyVolMatch[1]);
        volume = parseGermanDecimal(qtyVolMatch[2]);
        unit = qtyVolMatch[3] || 'ml';
      } else if (volMatch) {
        volume = parseGermanDecimal(volMatch[1]);
        unit = volMatch[2] || 'ml';
      } else if (qtyOnlyMatch) {
        qty = parseInt(qtyOnlyMatch[1]);
      }
    }

    results.push({
      name: name.trim(),
      qty,
      required_volume: volume,
      volume_unit: unit,
      raw: part,
    });
  }

  return results;
}

function parseGermanDecimal(s: string): number {
  // Handle both "8,5" (German) and "8.5" (English) formats
  return parseFloat(s.replace(',', '.'));
}

// ─── Build Materials JSONB ───────────────────────────────────
function buildMaterialsJson(
  parsed: ParsedMaterial[],
  materialLookup: Map<string, { id: string; code: string; measurement_type: string; default_volume: number | null; default_unit: string }>
): any[] {
  return parsed.map((p) => {
    const mat = materialLookup.get(p.name);
    if (!mat) {
      return {
        name: p.name,
        qty: p.qty,
        required_volume: p.required_volume,
        volume_unit: p.volume_unit,
        material_id: null, // Unknown material
        material_code: '??',
        measurement_type: 'quantity',
      };
    }

    return {
      name: p.name,
      qty: p.qty,
      required_volume: p.required_volume,
      volume_unit: p.volume_unit || mat.default_unit || 'ml',
      material_id: mat.id,
      material_code: mat.code,
      measurement_type: mat.measurement_type,
      unit: mat.default_unit || 'ml',
      volume: mat.default_volume, // tube capacity
    };
  });
}

// ─── Price Parser ────────────────────────────────────────────
function parsePrice(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Math.round(val * 100) / 100;
  const s = String(val).replace(',', '.').replace(/[^\d.]/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

// ─── String Cleaner ──────────────────────────────────────────
function cleanStr(val: any): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s || null;
}

// ─── Main Import Function ────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  99Tests Test Catalog Import');
  console.log(`  File: ${filePath}`);
  console.log(`  Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '🚀 LIVE IMPORT'}`);
  if (labFilter) console.log(`  Lab filter: ${labFilter}`);
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Load lookup data from Supabase
  console.log('📦 Loading lookup data...');

  // Labs
  const { data: labs, error: labErr } = await supabase.from('tt_laboratory').select('id, name').eq('is_active', true);
  if (labErr) { console.error('❌ Failed to load laboratories:', labErr.message); process.exit(1); }
  const labLookup = new Map<string, string>();
  for (const lab of labs || []) {
    labLookup.set(lab.name, lab.id);
    labLookup.set(lab.name.toLowerCase(), lab.id); // case-insensitive fallback
  }
  console.log(`  Labs: ${labLookup.size / 2} loaded`);

  // Materials
  const { data: materials, error: matErr } = await supabase.from('tt_material').select('id, code, name, measurement_type, default_volume, default_unit').eq('is_active', true);
  if (matErr) { console.error('❌ Failed to load materials:', matErr.message); process.exit(1); }
  const materialLookup = new Map<string, { id: string; code: string; measurement_type: string; default_volume: number | null; default_unit: string }>();
  for (const mat of materials || []) {
    materialLookup.set(mat.name, { id: mat.id, code: mat.code, measurement_type: mat.measurement_type, default_volume: mat.default_volume, default_unit: mat.default_unit || 'ml' });
  }
  console.log(`  Materials: ${materialLookup.size} loaded`);

  // Doctors (for restricted_to lookup)
  const { data: doctors, error: docErr } = await supabase.from('tt_doctor').select('id, email');
  if (docErr) { console.error('❌ Failed to load doctors:', docErr.message); process.exit(1); }
  const doctorLookup = new Map<string, string>();
  for (const doc of doctors || []) {
    if (doc.email) doctorLookup.set(doc.email.toLowerCase(), doc.id);
  }
  console.log(`  Doctors: ${doctorLookup.size} loaded`);

  // 2. Read XLS
  console.log('\n📄 Reading XLS...');
  const workbook = XLSX.readFile(filePath!);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`  Sheet: ${sheetName}, Rows: ${rows.length}`);

  // 3. Validate & Transform
  console.log('\n🔍 Validating...');
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRows: any[] = [];
  const restrictedTests: { sku: string; emails: string[] }[] = [];
  const skuSet = new Set<string>();
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Excel row number (1-indexed + header)
    const sku = cleanStr(row[COL.sku]);

    // Skip empty rows
    if (!sku) { skipped++; continue; }

    // Lab filter
    const labName = cleanStr(row[COL.laboratory]);
    if (labFilter && labName !== labFilter) { skipped++; continue; }

    // Duplicate SKU check
    if (skuSet.has(sku)) {
      errors.push(`Row ${rowNum}: Duplicate SKU '${sku}'`);
      continue;
    }
    skuSet.add(sku);

    // Required fields
    const name = cleanStr(row[COL.name]);
    if (!name) { errors.push(`Row ${rowNum}: Missing name for SKU '${sku}'`); continue; }
    if (!labName) { errors.push(`Row ${rowNum}: Missing laboratory for SKU '${sku}'`); continue; }

    // Lab lookup
    const labId = labLookup.get(labName) || labLookup.get(labName.toLowerCase());
    if (!labId) {
      errors.push(`Row ${rowNum}: Unknown laboratory '${labName}' for SKU '${sku}'`);
      continue;
    }

    // Type
    const rawType = cleanStr(row[COL.type]) || 'Parameter';
    const type = TYPE_MAP[rawType];
    if (!type) {
      errors.push(`Row ${rowNum}: Invalid type '${rawType}' for SKU '${sku}'`);
      continue;
    }

    // Status → is_active
    const rawStatus = cleanStr(row[COL.status]) || 'active';
    const isActive = rawStatus.toLowerCase() === 'active';

    // Restricted → is_private
    const restrictedTo = cleanStr(row[COL.restricted_to]);
    const isPrivate = !!restrictedTo;
    if (restrictedTo) {
      const emails = restrictedTo.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
      const unknownEmails = emails.filter(e => !doctorLookup.has(e));
      if (unknownEmails.length > 0) {
        warnings.push(`Row ${rowNum}: Unknown doctor email(s): ${unknownEmails.join(', ')} for SKU '${sku}'`);
      }
      restrictedTests.push({ sku, emails });
    }

    // Sample shipping
    const rawShipping = cleanStr(row[COL.sample_shipping]);
    const sampleShipping = rawShipping ? (SHIPPING_MAP[rawShipping.toLowerCase()] || 'standard') : 'standard';

    // Materials parsing
    const rawMaterial = cleanStr(row[COL.material]);
    const parsedMaterials = rawMaterial ? parseMaterialString(rawMaterial) : [];
    const unknownMaterials = parsedMaterials.filter(p => !materialLookup.has(p.name));
    if (unknownMaterials.length > 0) {
      warnings.push(`Row ${rowNum}: Unknown material(s): ${unknownMaterials.map(m => `'${m.name}'`).join(', ')} for SKU '${sku}'`);
    }
    const materialsJson = buildMaterialsJson(parsedMaterials, materialLookup);

    // Prices
    const labCost = parsePrice(row[COL.lab_cost]);
    const priceInsured = parsePrice(row[COL.price_insured]);
    const priceUninsured = parsePrice(row[COL.price_uninsured]);
    const priceZone1 = parsePrice(row[COL.price_zone1]);
    const priceZone2 = parsePrice(row[COL.price_zone2]);
    const priceZone3 = parsePrice(row[COL.price_zone3]);

    // GOÄ fields (store as-is, text)
    const goaeDigit = cleanStr(row[COL.goae_digit]);
    const goaeNames = cleanStr(row[COL.goae_names]);
    const goaeFactor = cleanStr(row[COL.goae_factor]);
    const goaeCosts = cleanStr(row[COL.goae_costs]);
    const edvCode = cleanStr(row[COL.edv_code]);

    // Profile fields
    const includedParameters = cleanStr(row[COL.included_parameters]);
    const anamneseParameters = cleanStr(row[COL.anamnese_parameters]);

    // Additional fields
    const method = cleanStr(row[COL.method]);
    const preanalytics = cleanStr(row[COL.preanalytics]);
    const moreInfoUrl = cleanStr(row[COL.more_info_url]);
    const anamneseTypeBiovis = cleanStr(row[COL.anamnese_type_biovis]);
    const testKit = cleanStr(row[COL.test_kit]);
    const sample = cleanStr(row[COL.sample]);

    // Build the DB row
    const dbRow = {
      sku,
      name,
      name_translations: { DE: name, EN: '', ES: '', FR: '', NL: '' },
      type,
      lab_id: labId,
      is_active: isActive,
      is_private: isPrivate,
      lab_cost: labCost,
      price_insured: priceInsured,
      price_uninsured: priceUninsured,
      price_zone1: priceZone1,
      price_zone2: priceZone2,
      price_zone3: priceZone3,
      materials: materialsJson,
      sample_shipping: sampleShipping,
      preanalytics,
      more_info_url: moreInfoUrl,
      edv_code: edvCode,
      goae_digit: goaeDigit,
      goae_names: goaeNames,
      goae_factor: goaeFactor,
      goae_costs: goaeCosts,
      // Extra columns (added via migration 025)
      method,
      anamnese_type: anamneseTypeBiovis,
      test_kit: testKit,
      included_parameters_text: includedParameters,
      anamnese_parameters: anamneseParameters,
    };

    validRows.push(dbRow);

    if (verbose) {
      console.log(`  ✓ Row ${rowNum}: ${sku} — ${name} (${type}, ${labName})`);
      if (parsedMaterials.length > 0) {
        console.log(`    Materials: ${parsedMaterials.map(m => `${m.name}${m.qty > 1 ? ` x${m.qty}` : ''}${m.required_volume ? ` ${m.required_volume}ml` : ''}`).join(', ')}`);
      }
    }
  }

  // 4. Report
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Total XLS rows:     ${rows.length}`);
  console.log(`  Valid for import:   ${validRows.length}`);
  console.log(`  Skipped:            ${skipped}`);
  console.log(`  Errors (blocked):   ${errors.length}`);
  console.log(`  Warnings (imported):${warnings.length}`);
  console.log(`  Restricted tests:   ${restrictedTests.length}`);

  // Type breakdown
  const typeCount: Record<string, number> = {};
  const labCount: Record<string, number> = {};
  for (const row of validRows) {
    typeCount[row.type] = (typeCount[row.type] || 0) + 1;
    // Find lab name from ID
    for (const [name, id] of labLookup.entries()) {
      if (id === row.lab_id && !name.includes(name.toLowerCase())) {
        labCount[name] = (labCount[name] || 0) + 1;
        break;
      }
    }
  }
  console.log(`\n  By type:`);
  for (const [t, c] of Object.entries(typeCount)) console.log(`    ${t}: ${c}`);

  if (errors.length > 0) {
    console.log('\n  ❌ ERRORS (these rows will NOT be imported):');
    for (const e of errors) console.log(`    ${e}`);
  }

  if (warnings.length > 0) {
    console.log(`\n  ⚠️  WARNINGS (${warnings.length} total, showing first 20):`);
    for (const w of warnings.slice(0, 20)) console.log(`    ${w}`);
    if (warnings.length > 20) console.log(`    ... and ${warnings.length - 20} more`);
  }

  if (errors.length > 0) {
    console.log('\n❌ Import blocked due to errors. Fix the XLS and retry.');
    process.exit(1);
  }

  // 5. Dry run stops here
  if (dryRun) {
    console.log('\n🔍 DRY RUN — no changes made. Remove --dry-run to import.');

    // Show sample of what would be inserted
    console.log('\n  Sample rows (first 3):');
    for (const row of validRows.slice(0, 3)) {
      console.log(`    SKU: ${row.sku}`);
      console.log(`    Name: ${row.name}`);
      console.log(`    Type: ${row.type}`);
      console.log(`    Materials: ${JSON.stringify(row.materials).substring(0, 120)}...`);
      console.log(`    Prices: insured=${row.price_insured}, uninsured=${row.price_uninsured}`);
      console.log('');
    }
    process.exit(0);
  }

  // 6. Upsert in batches
  console.log(`\n🚀 Importing ${validRows.length} tests in batches of 500...`);
  const BATCH_SIZE = 500;
  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const batch = validRows.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(validRows.length / BATCH_SIZE);

    console.log(`  Batch ${batchNum}/${totalBatches} (${batch.length} rows)...`);

    const { data, error } = await supabase
      .from('tt_test_catalog')
      .upsert(batch, {
        onConflict: 'sku',
        ignoreDuplicates: false,
      })
      .select('id, sku');

    if (error) {
      console.error(`  ❌ Batch ${batchNum} failed:`, error.message);
      failed += batch.length;
    } else {
      const count = data?.length || 0;
      inserted += count;
      console.log(`  ✓ Batch ${batchNum}: ${count} rows upserted`);
    }
  }

  // 7. Handle restricted tests (is_private + tt_doctor_test)
  if (restrictedTests.length > 0) {
    console.log(`\n🔒 Processing ${restrictedTests.length} restricted test assignments...`);

    // First, look up the test IDs by SKU
    const restrictedSkus = restrictedTests.map(rt => rt.sku);
    const { data: testRows } = await supabase
      .from('tt_test_catalog')
      .select('id, sku')
      .in('sku', restrictedSkus);

    const skuToId = new Map<string, string>();
    for (const t of testRows || []) {
      skuToId.set(t.sku, t.id);
    }

    // Check if tt_doctor_test table exists (it may not yet — we planned migration 024)
    const { error: tableCheck } = await supabase
      .from('tt_doctor_test')
      .select('id')
      .limit(1);

    if (tableCheck && tableCheck.message?.includes('does not exist')) {
      console.log('  ⚠️  tt_doctor_test table does not exist yet. Skipping doctor assignments.');
      console.log('  Run migration 024 first, then re-run import to assign doctors.');
    } else {
      for (const rt of restrictedTests) {
        const testId = skuToId.get(rt.sku);
        if (!testId) { console.log(`  ⚠️  Test ${rt.sku} not found in DB, skipping`); continue; }

        for (const email of rt.emails) {
          const doctorId = doctorLookup.get(email);
          if (!doctorId) { console.log(`  ⚠️  Doctor ${email} not found, skipping`); continue; }

          const { error: insertErr } = await supabase
            .from('tt_doctor_test')
            .upsert({ doctor_id: doctorId, test_id: testId }, { onConflict: 'doctor_id,test_id' });

          if (insertErr) {
            console.log(`  ⚠️  Failed to assign ${email} → ${rt.sku}: ${insertErr.message}`);
          } else {
            console.log(`  ✓ ${email} → ${rt.sku}`);
          }
        }
      }
    }
  }

  // 8. Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  IMPORT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Upserted:  ${inserted}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Restricted:${restrictedTests.length}`);
  if (failed > 0) {
    console.log('\n  ⚠️  Some rows failed. Check errors above.');
    process.exit(1);
  } else {
    console.log('\n  ✅ All rows imported successfully!');
  }
}

// Run
main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});