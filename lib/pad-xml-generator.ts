/**
 * PAD XML Generator — ADL v2.12
 * 
 * Generates PAD XML billing files for German healthcare (PVS format).
 * Supports single-order and batch export (multiple orders grouped by lab).
 * 
 * GOÄ field parsing handles the catalog notation:
 * - "4780, 4783 (2x), 4785" → [{ziffer: "4780", count: 1}, {ziffer: "4783", count: 2}, {ziffer: "4785", count: 1}]
 * - Costs follow same pattern: "52.46, 29.15 (2x), 17.49"
 */

// ============================================================
// TYPES
// ============================================================

interface PadGoaePosition {
  ziffer: string;
  anzahl: number;
  text: string;        // Parameter names (comma-separated if grouped)
  faktor: number;
  einzelbetrag: number; // Base cost per unit
  gesamtbetrag: number; // einzelbetrag * anzahl
  datum: string;        // YYYY-MM-DD
}

interface PadInvoice {
  id: string;           // Order display_id
  patient: {
    anrede: string;
    vorname: string;
    nachname: string;
    gebdatum: string;   // YYYY-MM-DD
    geschlecht: string; // M/W/D
    land: string;
    plz: string;
    ort: string;
    strasse: string;
  };
  empfaenger?: {        // Bill recipient (if different from patient)
    anrede: string;
    vorname: string;
    nachname: string;
    land: string;
    plz: string;
    ort: string;
    strasse: string;
  };
  positionen: PadGoaePosition[];
  anfangstext: string;
}

interface PadLabConfig {
  name: string;
  namezusatz: string;
  land: string;
  plz: string;
  ort: string;
  strasse: string;
  aisid: string;
}

// ============================================================
// GOÄ FIELD PARSER
// ============================================================

/**
 * Parse GOÄ digit/cost fields with (Nx) multiplier notation.
 * 
 * Input: "4780, 4783 (2x), 4785"
 * Output: [{value: "4780", count: 1}, {value: "4783", count: 2}, {value: "4785", count: 1}]
 * 
 * Also handles: "A4210", "3587.H1", "A3905.H3"
 */
function parseGoaeField(raw: string): { value: string; count: number }[] {
  if (!raw || raw.trim() === '') return [];
  
  const results: { value: string; count: number }[] = [];
  
  // Split by comma, handling spaces
  const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
  
  for (const part of parts) {
    // Check for (Nx) multiplier
    const multiplierMatch = part.match(/^(.+?)\s*\((\d+)x\)\s*$/i);
    if (multiplierMatch) {
      results.push({
        value: multiplierMatch[1].trim(),
        count: parseInt(multiplierMatch[2], 10),
      });
    } else {
      results.push({
        value: part.trim(),
        count: 1,
      });
    }
  }
  
  return results;
}

/**
 * Expand GOÄ data from catalog fields into individual positions.
 * 
 * Takes the raw goae_digit, goae_cost, goae_name, goae_factor fields
 * and expands them into flat position entries, repeating for (Nx) multipliers.
 */
function expandGoaePositions(
  goaeDigit: string,
  goaeCost: string,
  goaeName: string,
  goaeFaktor: string,
  parameterName: string,
  datum: string
): PadGoaePosition[] {
  const digits = parseGoaeField(goaeDigit);
  const costs = parseGoaeField(goaeCost);
  const names = goaeName ? goaeName.split(',').map(n => n.trim()) : [];
  const faktor = parseFloat(goaeFaktor) || 1.0;
  
  const positions: PadGoaePosition[] = [];
  
  // Expand digits with their counts
  let costIdx = 0;
  for (const digit of digits) {
    const cost = costs[costIdx]
      ? parseFloat(costs[costIdx].value) || 0
      : 0;
    
    // For multiplied entries, the cost is per-unit
    const einzelbetrag = cost;
    const anzahl = digit.count;
    
    positions.push({
      ziffer: digit.value,
      anzahl,
      text: parameterName, // Will be updated during grouping
      faktor,
      einzelbetrag,
      gesamtbetrag: parseFloat((einzelbetrag * anzahl * faktor).toFixed(2)),
      datum,
    });
    
    costIdx++;
  }
  
  return positions;
}

// ============================================================
// POSITION GROUPING
// ============================================================

/**
 * Group positions by GOÄ ziffer within an invoice.
 * 
 * When multiple parameters share the same ziffer, they become one position:
 * - anzahl = sum of all counts
 * - text = comma-separated parameter names
 * - einzelbetrag = cost per unit (should be same for same ziffer)
 * - gesamtbetrag = einzelbetrag * total anzahl * faktor
 */
function groupPositionsByZiffer(positions: PadGoaePosition[]): PadGoaePosition[] {
  const groups = new Map<string, {
    ziffer: string;
    anzahl: number;
    texts: string[];
    faktor: number;
    einzelbetrag: number;
    datum: string;
  }>();
  
  for (const pos of positions) {
    const key = `${pos.ziffer}_${pos.faktor}_${pos.einzelbetrag}`;
    
    if (groups.has(key)) {
      const existing = groups.get(key)!;
      existing.anzahl += pos.anzahl;
      if (!existing.texts.includes(pos.text)) {
        existing.texts.push(pos.text);
      }
    } else {
      groups.set(key, {
        ziffer: pos.ziffer,
        anzahl: pos.anzahl,
        texts: [pos.text],
        faktor: pos.faktor,
        einzelbetrag: pos.einzelbetrag,
        datum: pos.datum,
      });
    }
  }
  
  return Array.from(groups.values()).map(g => ({
    ziffer: g.ziffer,
    anzahl: g.anzahl,
    text: g.texts.join(', '),
    faktor: g.faktor,
    einzelbetrag: g.einzelbetrag,
    gesamtbetrag: parseFloat((g.einzelbetrag * g.anzahl * g.faktor).toFixed(2)),
    datum: g.datum,
  }));
}

// ============================================================
// GENDER / ANREDE MAPPING
// ============================================================

function mapAnrede(gender: string): string {
  const g = (gender || '').toUpperCase().trim();
  if (g === 'M') return 'Herr';
  if (g === 'W' || g === 'F') return 'Frau';
  return 'Herr';
}

function mapAnredeInformal(gender: string): string {
  const g = (gender || '').toUpperCase().trim();
  if (g === 'M') return 'Mr.';
  if (g === 'W' || g === 'F') return 'Frau';
  return 'Mr.';
}

function mapGeschlecht(gender: string): string {
  const g = (gender || '').toUpperCase().trim();
  if (g === 'M' || g === 'MALE') return 'M';
  if (g === 'W' || g === 'F' || g === 'FEMALE') return 'W';
  if (g === 'D') return 'D';
  return 'M';
}

// ============================================================
// XML BUILDER
// ============================================================

function escXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build the complete PAD XML string for a batch of invoices.
 */
export function buildPadXml(
  lab: PadLabConfig,
  invoices: PadInvoice[]
): string {
  const lines: string[] = [];
  
  lines.push('<?xml version="1.0" encoding="utf-8"?>');
  lines.push(`<rechnungen xmlns="http://padinfo.de/ns/pad" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://padinfo.de/ns/pad http://padinfo.de/ns/pad/padx_auf_v2.12.xsd" anzahl="${invoices.length}">`);
  lines.push('  <nachrichtentyp version="02.12">ADL</nachrichtentyp>');
  
  // Rechnungsersteller (invoice creator)
  lines.push('  <rechnungsersteller>');
  lines.push(`    <n>${escXml(lab.name)}</n>`);
  if (lab.namezusatz) lines.push(`    <namezusatz>${escXml(lab.namezusatz)}</namezusatz>`);
  lines.push('    <anschrift>');
  lines.push('      <hausadresse>');
  lines.push(`        <land>${escXml(lab.land)}</land>`);
  lines.push(`        <plz>${escXml(lab.plz)}</plz>`);
  lines.push(`        <ort>${escXml(lab.ort)}</ort>`);
  lines.push(`        <strasse>${escXml(lab.strasse)}</strasse>`);
  if (lab.namezusatz) lines.push(`        <namezusatz>${escXml(lab.namezusatz)}</namezusatz>`);
  lines.push('      </hausadresse>');
  lines.push('    </anschrift>');
  lines.push('  </rechnungsersteller>');
  
  // Leistungserbringer (service provider = same as lab)
  lines.push(`  <leistungserbringer id="01" aisid="${escXml(lab.aisid)}">`);
  lines.push(`    <n>${escXml(lab.name)}</n>`);
  if (lab.namezusatz) lines.push(`    <namezusatz>${escXml(lab.namezusatz)}</namezusatz>`);
  lines.push('    <anschrift>');
  lines.push('      <hausadresse>');
  lines.push(`        <land>${escXml(lab.land)}</land>`);
  lines.push(`        <plz>${escXml(lab.plz)}</plz>`);
  lines.push(`        <ort>${escXml(lab.ort)}</ort>`);
  lines.push(`        <strasse>${escXml(lab.strasse)}</strasse>`);
  if (lab.namezusatz) lines.push(`        <namezusatz>${escXml(lab.namezusatz)}</namezusatz>`);
  lines.push('      </hausadresse>');
  lines.push('    </anschrift>');
  lines.push('  </leistungserbringer>');
  
  // Individual invoices (Rechnungen)
  for (const inv of invoices) {
    lines.push(`  <rechnung id="${escXml(inv.id)}" aisrechnungsnr="${escXml(inv.id)}">`);
    
    // Rechnungsempfänger (bill recipient)
    const emp = inv.empfaenger || inv.patient;
    lines.push('    <rechnungsempfaenger>');
    lines.push('      <person>');
    lines.push(`        <anrede>${escXml(emp.anrede || mapAnredeInformal(inv.patient.geschlecht))}</anrede>`);
    lines.push(`        <vorname>${escXml(emp.vorname || inv.patient.vorname)}</vorname>`);
    lines.push(`        <n>${escXml(emp.nachname || inv.patient.nachname)}</n>`);
    lines.push('        <anschrift>');
    lines.push('          <hausadresse>');
    lines.push(`            <land>${escXml(emp.land || inv.patient.land || 'D')}</land>`);
    if (emp.plz || inv.patient.plz) lines.push(`            <plz>${escXml(emp.plz || inv.patient.plz)}</plz>`);
    if (emp.ort || inv.patient.ort) lines.push(`            <ort>${escXml(emp.ort || inv.patient.ort)}</ort>`);
    if (emp.strasse || inv.patient.strasse) lines.push(`            <strasse>${escXml(emp.strasse || inv.patient.strasse)}</strasse>`);
    lines.push('          </hausadresse>');
    lines.push('        </anschrift>');
    lines.push('      </person>');
    lines.push('    </rechnungsempfaenger>');
    
    // Abrechnungsfall
    lines.push('    <abrechnungsfall>');
    lines.push('      <humanmedizin>');
    
    // Behandelter (patient treated)
    lines.push('        <behandelter>');
    lines.push(`          <anrede>${escXml(mapAnrede(inv.patient.geschlecht))}</anrede>`);
    lines.push(`          <vorname>${escXml(inv.patient.vorname)}</vorname>`);
    lines.push(`          <n>${escXml(inv.patient.nachname)}</n>`);
    lines.push(`          <gebdatum>${escXml(inv.patient.gebdatum)}</gebdatum>`);
    lines.push(`          <geschlecht>${escXml(mapGeschlecht(inv.patient.geschlecht))}</geschlecht>`);
    lines.push('        </behandelter>');
    
    // Versicherter (insured person = same as patient for now)
    lines.push('        <versicherter>');
    lines.push(`          <anrede>${escXml(mapAnrede(inv.patient.geschlecht))}</anrede>`);
    lines.push(`          <vorname>${escXml(inv.patient.vorname)}</vorname>`);
    lines.push(`          <n>${escXml(inv.patient.nachname)}</n>`);
    lines.push(`          <gebdatum>${escXml(inv.patient.gebdatum)}</gebdatum>`);
    lines.push(`          <geschlecht>${escXml(mapGeschlecht(inv.patient.geschlecht))}</geschlecht>`);
    lines.push('        </versicherter>');
    
    // Positionen (GOÄ positions)
    lines.push(`        <positionen posanzahl="${inv.positionen.length}">`);
    
    inv.positionen.forEach((pos, idx) => {
      lines.push(`          <goziffer positionsnr="${idx + 1}" go="GOAE" ziffer="${escXml(pos.ziffer)}">`);
      lines.push(`            <datum>${escXml(pos.datum)}</datum>`);
      lines.push(`            <anzahl>${pos.anzahl}</anzahl>`);
      lines.push(`            <text>${escXml(pos.text)}</text>`);
      lines.push(`            <faktor>${pos.faktor.toFixed(pos.faktor % 1 === 0 ? 2 : 4)}</faktor>`);
      lines.push(`            <einzelbetrag>${pos.einzelbetrag.toFixed(2)}</einzelbetrag>`);
      lines.push(`            <gesamtbetrag>${pos.gesamtbetrag.toFixed(2)}</gesamtbetrag>`);
      lines.push('          </goziffer>');
    });
    
    lines.push('        </positionen>');
    lines.push('      </humanmedizin>');
    lines.push('    </abrechnungsfall>');
    
    // Anfangstext
    if (inv.anfangstext) {
      lines.push(`    <anfangstext>${escXml(inv.anfangstext)}</anfangstext>`);
    }
    
    lines.push('  </rechnung>');
  }
  
  lines.push('</rechnungen>');
  
  return lines.join('\r\n');
}

// ============================================================
// DATA ASSEMBLY FROM PAD SNAPSHOT
// ============================================================

/**
 * Convert a PAD/PVS snapshot (stored as JSON on the order) into PadInvoice format.
 * 
 * This handles:
 * - Parsing GOÄ (Nx) notation
 * - Expanding positions
 * - Grouping by ziffer (same ziffer from different params → one position with comma-separated names)
 * - Correct einzelbetrag/gesamtbetrag calculation
 */
export function snapshotToInvoice(
  snapshot: any,
  orderDate: string
): PadInvoice | null {
  if (!snapshot || !snapshot.positions || snapshot.positions.length === 0) {
    return null;
  }
  
  const patient = snapshot.patient || {};
  const doctor = snapshot.doctor || {};
  const datum = orderDate ? orderDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
  
  // Expand all GOÄ positions from snapshot
  const allPositions: PadGoaePosition[] = [];
  
  for (const pos of snapshot.positions) {
    const expanded = expandGoaePositions(
      pos.goae_digit || '',
      pos.goae_cost || '',
      pos.goae_name || '',
      pos.goae_factor || '1.00',
      pos.parameter_name || '',
      datum
    );
    allPositions.push(...expanded);
  }
  
  // Group by ziffer (same ziffer → combine names, sum anzahl)
  const grouped = groupPositionsByZiffer(allPositions);
  
  if (grouped.length === 0) return null;
  
  // Format DOB
  let gebdatum = patient.date_of_birth || '';
  if (gebdatum.length === 8 && !gebdatum.includes('-')) {
    // YYYYMMDD → YYYY-MM-DD
    gebdatum = `${gebdatum.substring(0, 4)}-${gebdatum.substring(4, 6)}-${gebdatum.substring(6, 8)}`;
  }
  
  // Build anfangstext
  const doctorName = doctor.full_name || '';
  const anfangstext = doctorName
    ? \`Auf Veranlassung von \${doctorName}. Rechnungsbetrag wurde bereits bezahlt.\`
    : 'Rechnungsbetrag wurde bereits bezahlt.';
  
  return {
    id: snapshot.order_display_id || '',
    patient: {
      anrede: mapAnrede(patient.gender || ''),
      vorname: patient.first_name || '',
      nachname: patient.last_name || '',
      gebdatum,
      geschlecht: mapGeschlecht(patient.gender || ''),
      land: 'D',
      plz: '',  // From patient address if available
      ort: '',
      strasse: '',
    },
    positionen: grouped,
    anfangstext,
  };
}

// ============================================================
// BATCH EXPORT
// ============================================================

/**
 * Generate a batch PAD XML file from multiple orders.
 * Groups orders by lab and generates one XML file per lab.
 */
export async function generatePadBatchExport(
  orderIds: string[]
): Promise<{ success: boolean; files: { labName: string; xml: string; filename: string }[]; error?: string }> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Fetch orders with their PAD snapshots
    const { data: orders, error } = await supabase
      .from('tt_order')
      .select(\`
        id, display_id, created_at, pad_pvs_data,
        recommendation:recommendation_id(
          patient:patient_id(first_name, last_name, date_of_birth, gender, 
            address_line1, address_zip, address_city, address_country)
        )
      \`)
      .in('id', orderIds)
      .not('pad_pvs_data', 'is', null);
    
    if (error) throw error;
    if (!orders || orders.length === 0) {
      return { success: false, files: [], error: 'No orders with PAD data found' };
    }
    
    // Group orders by lab
    const labGroups = new Map<string, { labName: string; invoices: PadInvoice[] }>();
    
    for (const order of orders) {
      const snapshot = order.pad_pvs_data as any;
      if (!snapshot) continue;
      
      const invoice = snapshotToInvoice(snapshot, order.created_at);
      if (!invoice) continue;
      
      // Enrich patient address from the recommendation.patient join
      const patientData = (order.recommendation as any)?.patient;
      if (patientData) {
        invoice.patient.plz = patientData.address_zip || '';
        invoice.patient.ort = patientData.address_city || '';
        invoice.patient.strasse = patientData.address_line1 || '';
        invoice.patient.land = patientData.address_country || 'D';
        // Also set as empfaenger (bill goes to patient)
        invoice.empfaenger = {
          anrede: mapAnredeInformal(patientData.gender || ''),
          vorname: patientData.first_name || '',
          nachname: patientData.last_name || '',
          land: patientData.address_country || 'D',
          plz: patientData.address_zip || '',
          ort: patientData.address_city || '',
          strasse: patientData.address_line1 || '',
        };
      }
      
      // Group by each lab involved
      const labs = snapshot.totals?.labs_involved || ['Unknown'];
      for (const labName of labs) {
        if (!labGroups.has(labName)) {
          labGroups.set(labName, { labName, invoices: [] });
        }
        labGroups.get(labName)!.invoices.push(invoice);
      }
    }
    
    // Fetch lab configs
    const labNames = Array.from(labGroups.keys());
    const { data: labConfigs } = await supabase
      .from('tt_laboratory')
      .select('id, name, official_name, practice_name, address_street, address_zip, address_city, address_country, aisid, pad_config')
      .in('name', labNames);
    
    const labConfigMap = new Map<string, any>();
    labConfigs?.forEach(l => labConfigMap.set(l.name, l));
    
    // Generate XML files per lab
    const files: { labName: string; xml: string; filename: string }[] = [];
    
    for (const [labName, group] of labGroups) {
      const labData = labConfigMap.get(labName);
      
      const labConfig: PadLabConfig = {
        name: labData?.official_name || labData?.name || labName,
        namezusatz: labData?.practice_name || '',
        land: labData?.address_country || 'D',
        plz: labData?.address_zip || '',
        ort: labData?.address_city || '',
        strasse: labData?.address_street || '',
        aisid: labData?.aisid || '999999999',
      };
      
      const xml = buildPadXml(labConfig, group.invoices);
      
      // Filename pattern: PV345000_YYYYMMDD_labname_count_padx.xml
      const date = new Date().toISOString().substring(0, 10).replace(/-/g, '');
      const labSlug = labName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      const filename = \`PV345000_\${date}_\${labSlug}_\${group.invoices.length}_padx.xml\`;
      
      files.push({ labName, xml, filename });
    }
    
    return { success: true, files };
    
  } catch (err: any) {
    console.error('[PAD XML] Batch export error:', err);
    return { success: false, files: [], error: err.message };
  }
}
