/**
 * LDT 4.20 Generator for MVZ Labor Ravensburg
 * 
 * Generates LDT files (ISO-8859-15 encoded) and companion TIFF documents.
 * Validated against lab feedback — all corrections applied.
 * 
 * LDT line format: {3-digit length}{4-digit FK code}{value}\r\n
 * Length = length of value + 9 (3 for length prefix + 4 for FK code + 2 for CRLF)
 */

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================
// TYPES
// ============================================================

interface LdtPatient {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO or DD.MM.YYYY or YYYYMMDD
  gender: string;
  address_street?: string;
  address_house_no?: string;
  address_zip?: string;
  address_city?: string;
}

interface LdtItem {
  name: string;
  edv_code: string;
  barcode: string; // Kit index only (e.g., "1", "2") — NOT order number + index
  material_name: string;
  material_volume: string;
  material_unit: string;
  profile_name?: string; // If expanded from a profile, the parent profile name
}

interface LdtConfig {
  einsender_id: string;
  customer_number: string; // FK 8312 — required in every header
  charset: number;
  version: string;
}

interface LdtResult {
  lab_id: string;
  lab_name: string;
  ldt_path: string;
  tif_path: string;
  ldt_url?: string;
  tif_url?: string;
}

// ============================================================
// FIELD LENGTH LIMITS (from LDT 4.20 spec)
// ============================================================

const LIMITS: Record<string, number> = {
  FK_8310: 13,  // Anforderungs-Ident (Order ID)
  FK_8410: 8,   // Test-Ident (EDV code)
  FK_8411: 60,  // Testbezeichnung (Test name)
  FK_8430: 60,  // Probenmaterial (Material name)
  FK_8520: 10,  // Menge (Volume/quantity)
  FK_8521: 60,  // Maßeinheit (Unit)
  FK_3101: 45,  // Nachname (Last name)
  FK_3102: 45,  // Vorname (First name)
  FK_3107: 46,  // Straße (Street)
  FK_3109: 9,   // Hausnummer (House number)
  FK_3112: 10,  // PLZ (ZIP)
  FK_3113: 40,  // Ort (City)
};

// FK 8428 (Barcode/ProbenID) has NO length limit — do not truncate

// ============================================================
// LDT LINE BUILDER
// ============================================================

/**
 * Format a single LDT field line.
 * Format: {3-digit length}{4-digit FK code}{value}\r\n
 * Length includes: 3 (length) + 4 (FK) + value length + 2 (CRLF) = value.length + 9
 */
function ldtField(fk: number, value: string): string {
  const val = String(value);
  const len = val.length + 9;
  const lenStr = String(len).padStart(3, '0');
  const fkStr = String(fk).padStart(4, '0');
  return `${lenStr}${fkStr}${val}\r\n`;
}

/**
 * Truncate string to max length
 */
function ldtTrim(s: string, max: number): string {
  if (max > 0 && s.length > max) return s.substring(0, max);
  return s;
}

// ============================================================
// DATE HANDLING
// ============================================================

/**
 * Normalize date to YYYYMMDD format for LDT.
 * 
 * CRITICAL: The lab requires YYYYMMDD. Input can be:
 * - DD.MM.YYYY (German format)
 * - YYYY-MM-DD (ISO format)
 * - DDMMYYYY (8 raw digits, German order)
 * - YYYYMMDD (8 raw digits, already correct)
 * 
 * Detection: if first 4 digits are 1900-2099, assume YYYYMMDD.
 * Otherwise assume DDMMYYYY and flip.
 */
function formatDateLDT(dateStr: string): string {
  if (!dateStr) return '';
  const d = dateStr.trim();

  // DD.MM.YYYY
  const dotMatch = d.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotMatch) {
    return `${dotMatch[3]}${dotMatch[2]}${dotMatch[1]}`;
  }

  // YYYY-MM-DD (ISO)
  const isoMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
  }

  // 8 raw digits — detect DDMMYYYY vs YYYYMMDD
  const digits = d.replace(/\D+/g, '');
  if (digits.length === 8) {
    const first4 = parseInt(digits.substring(0, 4), 10);
    // If first 4 digits look like a year, it's already YYYYMMDD
    if (first4 >= 1900 && first4 <= 2099) {
      return digits;
    }
    // Otherwise assume DDMMYYYY → flip to YYYYMMDD
    const dd = digits.substring(0, 2);
    const mm = digits.substring(2, 4);
    const yy = digits.substring(4, 8);
    return `${yy}${mm}${dd}`;
  }

  return '';
}

// ============================================================
// GENDER / BILLING MAPPING
// ============================================================

/**
 * Map gender to LDT code: M/W/D
 */
function mapGender(g: string): string {
  const lower = (g || '').toLowerCase().trim();
  if (lower === 'm' || lower.startsWith('mann') || lower.startsWith('male') || lower === 'herr') return 'M';
  if (lower === 'w' || lower === 'f' || lower.startsWith('weib') || lower.startsWith('female') || lower === 'frau') return 'W';
  if (lower === 'd' || lower.startsWith('div')) return 'D';
  return 'M'; // default
}

/**
 * Map insurance type to Gebührenordnung code.
 * 1 = EBM (Kassenpatient/gesetzlich)
 * 3 = GOÄ 96 (Privat) — default
 * 4 = BG-Tarif (Selbstzahler)
 */
function mapGebuehrenordnung(insuranceType: string): string {
  const t = (insuranceType || '').toLowerCase().trim();
  if (t.includes('selbst') || t === 'x' || t === 'uninsured') return '4';
  if (t.includes('kasse') || t === 'k' || t === 'gesetzlich') return '1';
  return '3'; // GOÄ 96 — default for privately insured
}

/**
 * Map insurance type to Abrechnungstyp code for FK 8609.
 * X = Selbstzahler, P = Privat, K = Kasse, E = Einsender
 */
function mapAbrechnungstyp(insuranceType: string): string {
  const t = (insuranceType || '').toLowerCase().trim();
  if (t.includes('selbst') || t === 'uninsured') return 'X';
  if (t.includes('privat') || t === 'private') return 'P';
  if (t.includes('kasse') || t === 'gesetzlich' || t === 'public') return 'K';
  return 'X'; // default: Selbstzahler
}

// ============================================================
// LDT CONTENT BUILDER
// ============================================================

/**
 * Build the complete LDT file content.
 * 
 * Structure:
 * 1. Header (Satzart 8230) — version, charset, date, customer number
 * 2. Order block (Satzart 8218) — order ID, sender, billing, patient, tests
 * 3. Footer (Satzart 8231)
 * 
 * CRITICAL lab corrections applied:
 * - FK 8312 (customer_number "25997") MUST be in header block
 * - FK 3103 (DOB) MUST be YYYYMMDD format
 * - FK 8428 (ProbenID/barcode) = kit index ONLY, not order number + index
 */
export function buildLdtContent(
  patient: LdtPatient,
  orderNumber: string,
  insuranceType: string,
  items: LdtItem[],
  ldtConfig: LdtConfig
): string {
  const lines: string[] = [];

  // === HEADER (Satzart 8230) ===
  lines.push(ldtField(8000, '8230'));
  lines.push(ldtField(9212, ldtConfig.version));       // LDT4.20
  lines.push(ldtField(9106, String(ldtConfig.charset))); // 4 = ISO-8859-15
  lines.push(ldtField(9103, formatDateLDT(new Date().toISOString()))); // Today YYYYMMDD
  lines.push(ldtField(8312, ldtConfig.customer_number)); // Lab customer number — REQUIRED

  // === ORDER BLOCK (Satzart 8218) ===
  lines.push(ldtField(8000, '8218'));

  // Order identification
  const orderDigits = orderNumber.replace(/\D+/g, '');
  lines.push(ldtField(8310, ldtTrim(orderDigits, LIMITS.FK_8310)));
  lines.push(ldtField(8615, ldtConfig.einsender_id)); // Sender ID

  // Fee schedule (Gebührenordnung)
  lines.push(ldtField(8403, mapGebuehrenordnung(insuranceType)));

  // Billing type (Abrechnungstyp)
  const abrTyp = mapAbrechnungstyp(insuranceType);
  if (abrTyp) {
    lines.push(ldtField(8609, abrTyp));
  }

  // Patient data
  lines.push(ldtField(3101, ldtTrim(patient.last_name, LIMITS.FK_3101)));
  lines.push(ldtField(3102, ldtTrim(patient.first_name, LIMITS.FK_3102)));

  const dob = formatDateLDT(patient.date_of_birth);
  if (dob) lines.push(ldtField(3103, dob));

  const gender = mapGender(patient.gender);
  if (gender) lines.push(ldtField(3110, gender));

  // Address (optional)
  if (patient.address_street) {
    lines.push(ldtField(3107, ldtTrim(patient.address_street, LIMITS.FK_3107)));
  }
  if (patient.address_house_no) {
    lines.push(ldtField(3109, ldtTrim(patient.address_house_no, LIMITS.FK_3109)));
  }
  if (patient.address_zip) {
    lines.push(ldtField(3112, ldtTrim(patient.address_zip.replace(/\D+/g, ''), LIMITS.FK_3112)));
  }
  if (patient.address_city) {
    lines.push(ldtField(3113, ldtTrim(patient.address_city, LIMITS.FK_3113)));
  }

  // === TEST PARAMETERS ===
  for (const item of items) {
    // EDV code (Test-Ident) — FK 8410
    if (item.edv_code) {
      lines.push(ldtField(8410, ldtTrim(item.edv_code, LIMITS.FK_8410)));
    }

    // Test name — FK 8411
    lines.push(ldtField(8411, ldtTrim(item.name, LIMITS.FK_8411)));

    // Barcode / ProbenID — FK 8428 (NO length limit, NO truncation)
    // CRITICAL: This is the kit index ONLY (e.g., "1", "2"), NOT order number + index
    if (item.barcode) {
      lines.push(ldtField(8428, item.barcode));
    }

    // Material name — FK 8430
    if (item.material_name) {
      lines.push(ldtField(8430, ldtTrim(item.material_name, LIMITS.FK_8430)));
    }

    // Volume — FK 8520
    if (item.material_volume) {
      lines.push(ldtField(8520, ldtTrim(item.material_volume, LIMITS.FK_8520)));
    }

    // Unit — FK 8521
    lines.push(ldtField(8521, ldtTrim(item.material_unit || 'ml', LIMITS.FK_8521)));
  }

  // === FOOTER (Satzart 8231) ===
  lines.push(ldtField(8000, '8231'));

  return lines.join('');
}

// ============================================================
// ISO-8859-15 ENCODING
// ============================================================

/**
 * Convert UTF-8 string to ISO-8859-15 Buffer.
 * LDT 4.20 requires ISO-8859-15 encoding (charset=4).
 * 
 * Manual mapping for common German characters:
 * ä=0xE4, ö=0xF6, ü=0xFC, Ä=0xC4, Ö=0xD6, Ü=0xDC, ß=0xDF, €=0xA4
 */
export function toISO885915(str: string): Buffer {
  const bytes: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code <= 0x7F) {
      // ASCII range — pass through
      bytes.push(code);
    } else {
      // Map common Unicode to ISO-8859-15
      const mapping: Record<number, number> = {
        0x00E4: 0xE4, // ä
        0x00F6: 0xF6, // ö
        0x00FC: 0xFC, // ü
        0x00C4: 0xC4, // Ä
        0x00D6: 0xD6, // Ö
        0x00DC: 0xDC, // Ü
        0x00DF: 0xDF, // ß
        0x20AC: 0xA4, // €
        0x0160: 0xA6, // Š
        0x0161: 0xA8, // š
        0x017D: 0xB4, // Ž
        0x017E: 0xB8, // ž
        0x0152: 0xBC, // Œ
        0x0153: 0xBD, // œ
        0x0178: 0xBE, // Ÿ
      };

      if (mapping[code] !== undefined) {
        bytes.push(mapping[code]);
      } else if (code <= 0xFF) {
        // Latin-1 compatible range
        bytes.push(code);
      } else {
        // Unknown character — replace with '?'
        bytes.push(0x3F);
      }
    }
  }

  return Buffer.from(bytes);
}

// ============================================================
// TIFF COMPANION DOCUMENT
// ============================================================

/**
 * Generate a 1-bit TIFF companion document for the lab.
 * 
 * Uses sharp (Node.js) to create a TIFF from an SVG rendered text layout.
 * Output: 300 DPI, 1-bit bilevel, Group4 compression, single file.
 * 
 * CRITICAL: Lab requires exactly ONE TIF per order.
 * If content exceeds A4 height, the image extends vertically (no multi-page).
 */
export async function generateTiff(
  patient: LdtPatient,
  orderNumber: string,
  items: LdtItem[]
): Promise<Buffer> {
  const sharp = (await import('sharp')).default;

  const DPI = 300;
  const PAGE_WIDTH_INCHES = 8.27; // A4 width
  const MARGIN_INCHES = 0.6;
  const width = Math.round(PAGE_WIDTH_INCHES * DPI); // ~2481px
  const contentWidth = width - Math.round(MARGIN_INCHES * DPI * 2);

  // Calculate height dynamically based on content
  const LINE_HEIGHT = 36; // px at 300dpi ≈ ~12pt
  const HEADER_HEIGHT = 200;
  const PATIENT_HEIGHT = LINE_HEIGHT * 8;
  const TABLE_HEADER_HEIGHT = LINE_HEIGHT * 2;
  const itemRows = items.length;
  const TABLE_HEIGHT = TABLE_HEADER_HEIGHT + (itemRows * LINE_HEIGHT);
  const FOOTER_HEIGHT = 100;

  const totalHeight = HEADER_HEIGHT + PATIENT_HEIGHT + TABLE_HEIGHT + FOOTER_HEIGHT + 100; // 100px padding
  const margin = Math.round(MARGIN_INCHES * DPI);

  // Build SVG content
  const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Format DOB for display (DD.MM.YYYY)
  const dobRaw = formatDateLDT(patient.date_of_birth);
  let dobDisplay = dobRaw;
  const dobMatch = dobRaw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dobMatch) {
    dobDisplay = `${dobMatch[3]}.${dobMatch[2]}.${dobMatch[1]}`;
  }

  const genderDisplay: Record<string, string> = { M: 'Männlich', W: 'Weiblich', D: 'Divers' };
  const genderText = genderDisplay[mapGender(patient.gender)] || '-';
  const address = [patient.address_street, patient.address_house_no].filter(Boolean).join(' ');
  const location = [patient.address_zip, patient.address_city].filter(Boolean).join(' ');

  let y = margin;
  let svgContent = '';

  // Title
  svgContent += `<text x="${margin}" y="${y + 40}" font-size="34" font-weight="bold" font-family="Courier, monospace">Auftragsübersicht - Auftrag ${escXml(orderNumber)}</text>`;
  y += 60;
  svgContent += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="black" stroke-width="2"/>`;
  y += 30;

  // Patient data
  svgContent += `<text x="${margin}" y="${y + 24}" font-size="22" font-weight="bold" font-family="Courier, monospace">Patientendaten:</text>`;
  y += LINE_HEIGHT;

  const patientLines = [
    `Vorname: ${patient.first_name || '-'}`,
    `Nachname: ${patient.last_name || '-'}`,
    `Geburtsdatum: ${dobDisplay || '-'}`,
    `Geschlecht: ${genderText}`,
    address ? `Adresse: ${address}` : '',
    location ? `PLZ/Ort: ${location}` : '',
  ].filter(Boolean);

  for (const line of patientLines) {
    svgContent += `<text x="${margin + 20}" y="${y + 22}" font-size="21" font-family="Courier, monospace">${escXml(line)}</text>`;
    y += LINE_HEIGHT;
  }
  y += 20;

  // Table header
  const col1 = margin;
  const col2 = margin + Math.round(contentWidth * 0.55);
  const col3 = margin + Math.round(contentWidth * 0.80);

  svgContent += `<text x="${col1}" y="${y + 22}" font-size="22" font-weight="bold" font-family="Courier, monospace">Parameter</text>`;
  svgContent += `<text x="${col2}" y="${y + 22}" font-size="22" font-weight="bold" font-family="Courier, monospace">Barcode</text>`;
  svgContent += `<text x="${col3}" y="${y + 22}" font-size="22" font-weight="bold" font-family="Courier, monospace">Material</text>`;
  y += LINE_HEIGHT + 10;
  svgContent += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="black" stroke-width="1"/>`;
  y += 10;

  // Table rows
  for (const item of items) {
    const paramText = escXml(item.name.substring(0, 52));
    const barcodeText = escXml(item.barcode || '-');
    const materialText = escXml((item.material_name || '-').substring(0, 24));

    svgContent += `<text x="${col1}" y="${y + 21}" font-size="21" font-family="Courier, monospace">${paramText}</text>`;
    svgContent += `<text x="${col2}" y="${y + 21}" font-size="21" font-family="Courier, monospace">${barcodeText}</text>`;
    svgContent += `<text x="${col3}" y="${y + 21}" font-size="21" font-family="Courier, monospace">${materialText}</text>`;
    y += LINE_HEIGHT;
  }

  // Footer
  y += 40;
  svgContent += `<line x1="${margin}" y1="${y}" x2="${width - margin}" y2="${y}" stroke="black" stroke-width="1"/>`;
  y += 20;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  svgContent += `<text x="${margin}" y="${y + 16}" font-size="16" font-family="Courier, monospace">Erstellt am: ${dateStr} | LDT Export | 99tests</text>`;

  const finalHeight = y + 60;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${finalHeight}" viewBox="0 0 ${width} ${finalHeight}">
    <rect width="100%" height="100%" fill="white"/>
    ${svgContent}
  </svg>`;

  // Render SVG → TIFF (1-bit, Group4, 300 DPI)
  const tiffBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer()
    .then(pngBuf =>
      sharp(pngBuf)
        .grayscale()
        .threshold(128)
        .tiff({
          compression: 'lzw',
          bitdepth: 1,
          xres: DPI,
          yres: DPI,
        })
        .toBuffer()
    );

  return tiffBuffer;
}

// ============================================================
// DATA ASSEMBLY — Query Supabase and build LDT items
// ============================================================

/**
 * Material merge pairs: base material gets merged into the lichtgeschützt variant.
 * If both "Serum" and "Serum lichtgeschützt" exist in the same order,
 * all Serum tests join the "Serum lichtgeschützt" tube.
 * Same for EDTA / EDTA lichtgeschützt.
 */
const MATERIAL_MERGE_PAIRS: Record<string, string> = {
  'Serum': 'Serum lichtgeschützt',
  'EDTA': 'EDTA lichtgeschützt',
};

/**
 * Assemble LDT items from order data.
 * 
 * This is the bridge between Supabase data and the LDT builder.
 * It queries recommendation items, expands profiles into individual parameters,
 * matches items to kits from tt_recommendation_material, and assigns barcodes.
 * 
 * CRITICAL: Profile expansion must carry profile_name so kit matching works.
 * When a profile like "Großes Blutbild" is expanded into individual parameters
 * (Leukozyten, Erythrozyten, etc.), those parameters need to find their parent
 * profile's kit in tt_recommendation_material to get the correct barcode.
 */
export async function assembleLdtItems(
  orderId: string,
  recommendationId: string
): Promise<{ items: LdtItem[]; labConfig: LdtConfig | null; labId: string; labName: string }> {
  const supabase = getSupabaseAdmin();

  // 1. Get recommendation items with test catalog data
  const { data: recItems, error: recError } = await supabase
    .from('tt_recommendation_item')
    .select(`
      id,
      test_id,
      test_type,
      quantity,
      lab_id,
      tt_test_catalog (
        id,
        name,
        type,
        edv_code,
        materials,
        included_parameters
      ),
      tt_laboratory (
        id,
        name,
        customer_number,
        ldt_config
      )
    `)
    .eq('recommendation_id', recommendationId);

  if (recError || !recItems?.length) {
    console.error('[LDT] Failed to fetch recommendation items:', recError);
    return { items: [], labConfig: null, labId: '', labName: '' };
  }

  // 2. Get kit data from materials calculator
  const { data: kits } = await supabase
    .from('tt_recommendation_material')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .order('kit_index', { ascending: true });

  // 3. Get the lab config (use first MVZ lab found)
  let labConfig: LdtConfig | null = null;
  let labId = '';
  let labName = '';

  for (const item of recItems) {
    const lab = item.tt_laboratory as any;
    if (lab?.ldt_config?.einsender_id) {
      labConfig = {
        ...lab.ldt_config,
        customer_number: lab.ldt_config.customer_number || lab.customer_number?.replace(/\D/g, '') || '',
      } as LdtConfig;
      labId = lab.id;
      labName = lab.name;
      break;
    }
  }

  if (!labConfig) {
    console.error('[LDT] No lab with LDT config found');
    return { items: [], labConfig: null, labId: '', labName: '' };
  }

  // 4. Build items array — expand profiles, match to kits
  const ldtItems: LdtItem[] = [];

  for (const recItem of recItems) {
    const test = recItem.tt_test_catalog as any;
    if (!test) continue;

    // Only include tests from labs with LDT config
    const lab = recItem.tt_laboratory as any;
    if (!lab?.ldt_config?.einsender_id) continue;

    if (test.type === 'profile' && Array.isArray(test.included_parameters) && test.included_parameters.length > 0) {
      // Profile: expand into individual parameters
      // Fetch the actual parameter details
      const { data: params } = await supabase
        .from('tt_test_catalog')
        .select('id, name, edv_code, materials')
        .in('id', test.included_parameters);

      if (params) {
        for (const param of params) {
          const mat = Array.isArray(param.materials) && param.materials.length > 0 ? param.materials[0] : null;
          const kitMatch = matchItemToKit(param.name, test.name, kits || []);

          ldtItems.push({
            name: param.name || '',
            edv_code: param.edv_code || '',
            barcode: kitMatch ? String(kitMatch.kit_index) : '1',
            material_name: kitMatch?.material_name || mat?.name || '',
            material_volume: kitMatch?.total_volume != null
              ? Number(kitMatch.total_volume).toFixed(2)
              : (mat?.required_volume != null ? Number(mat.required_volume).toFixed(2) : ''),
            material_unit: mat?.volume_unit || 'ml',
            profile_name: test.name, // Carry parent profile name
          });
        }
      }
    } else {
      // Single parameter
      const mat = Array.isArray(test.materials) && test.materials.length > 0 ? test.materials[0] : null;
      const kitMatch = matchItemToKit(test.name, undefined, kits || []);

      ldtItems.push({
        name: test.name || '',
        edv_code: test.edv_code || '',
        barcode: kitMatch ? String(kitMatch.kit_index) : '1',
        material_name: kitMatch?.material_name || mat?.name || '',
        material_volume: kitMatch?.total_volume != null
          ? Number(kitMatch.total_volume).toFixed(2)
          : (mat?.required_volume != null ? Number(mat.required_volume).toFixed(2) : ''),
        material_unit: mat?.volume_unit || 'ml',
      });
    }
  }

  return { items: ldtItems, labConfig, labId, labName };
}

/**
 * Match a test item to its kit from tt_recommendation_material.
 * 
 * First tries matching by the test's own name.
 * If that fails and the test came from a profile expansion,
 * tries matching by the parent profile name.
 * 
 * This is critical for expanded profiles: "Leukozyten" (expanded from
 * "Großes Blutbild") won't appear in the kit's test list by its own name,
 * but "Großes Blutbild" will.
 */
function matchItemToKit(
  testName: string,
  profileName: string | undefined,
  kits: any[]
): any | null {
  const normName = testName.toLowerCase().trim();

  // Try matching by test name first
  for (const kit of kits) {
    const kitTests = (kit.test_names || kit.tests || '').toLowerCase();
    if (normName && kitTests.includes(normName)) {
      return kit;
    }
  }

  // If item came from a profile, try matching by parent profile name
  if (profileName) {
    const normProfile = profileName.toLowerCase().trim();
    for (const kit of kits) {
      const kitTests = (kit.test_names || kit.tests || '').toLowerCase();
      if (normProfile && kitTests.includes(normProfile)) {
        return kit;
      }
    }
  }

  return null;
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

/**
 * Generate LDT + TIFF files for an order and upload to Supabase Storage.
 * 
 * Returns file URLs for storage on the order record.
 */
export async function generateLdtExport(
  orderId: string,
  orderDisplayId: string,
  recommendationId: string,
  patient: LdtPatient,
  insuranceType: string
): Promise<{ success: boolean; ldtUrl?: string; tifUrl?: string; error?: string }> {
  try {
    // 1. Assemble items from database
    const { items, labConfig, labId, labName } = await assembleLdtItems(orderId, recommendationId);

    if (!labConfig || items.length === 0) {
      return { success: false, error: 'No LDT-capable lab items found' };
    }

    // 2. Build LDT content (UTF-8 string)
    const ldtContent = buildLdtContent(patient, orderDisplayId, insuranceType, items, labConfig);

    // 3. Encode to ISO-8859-15
    const ldtBuffer = toISO885915(ldtContent);

    // 4. Generate TIFF companion
    const tifBuffer = await generateTiff(patient, orderDisplayId, items);

    // 5. Upload to Supabase Storage
    const supabase = getSupabaseAdmin();
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').substring(0, 14);
    const orderDigits = orderDisplayId.replace(/\D+/g, '') || 'NA';
    const baseName = `Z${orderDigits}${timestamp}`;

    const ldtPath = `ldt/${orderId}/${baseName}.ldt`;
    const tifPath = `ldt/${orderId}/${baseName}.tif`;

    const { error: ldtUpErr } = await supabase.storage
      .from('documents')
      .upload(ldtPath, ldtBuffer, {
        contentType: 'application/octet-stream',
        upsert: true,
      });

    if (ldtUpErr) {
      console.error('[LDT] Upload LDT failed:', ldtUpErr);
      return { success: false, error: `LDT upload failed: ${ldtUpErr.message}` };
    }

    const { error: tifUpErr } = await supabase.storage
      .from('documents')
      .upload(tifPath, tifBuffer, {
        contentType: 'image/tiff',
        upsert: true,
      });

    if (tifUpErr) {
      console.error('[LDT] Upload TIFF failed:', tifUpErr);
    }

    // 6. Get public URLs
    const { data: ldtUrlData } = supabase.storage.from('documents').getPublicUrl(ldtPath);
    const { data: tifUrlData } = supabase.storage.from('documents').getPublicUrl(tifPath);

    console.log(`[LDT] Generated for order ${orderId}: ${ldtPath}`);

    return {
      success: true,
      ldtUrl: ldtUrlData?.publicUrl || ldtPath,
      tifUrl: tifUrlData?.publicUrl || tifPath,
    };

  } catch (err: any) {
    console.error('[LDT] Generation error:', err);
    return { success: false, error: err.message };
  }
}
