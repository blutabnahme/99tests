import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface PadExportOptions {
  dateStart: string;       // YYYY-MM-DD
  dateEnd: string;         // YYYY-MM-DD
  labId?: string;          // filter by specific lab (optional)
  includeExported: boolean; // include already-exported orders
}

interface PadExportResult {
  files: { lab_name: string; file_path: string; url: string; order_count: number }[];
  total_orders: number;
  total_files: number;
}

// ============================================================
// HELPERS
// ============================================================

function padDate(d: string): string {
  if (!d) return '';
  // Accept YYYY-MM-DD or ISO datetime
  return d.substring(0, 10);
}

function padMoney(n: number): string {
  return n.toFixed(2);
}

function padGender(g: string): string {
  const lower = (g || '').toLowerCase().trim();
  if (lower === 'm' || lower.startsWith('mann') || lower === 'herr') return 'M';
  if (lower === 'w' || lower.startsWith('weib') || lower === 'frau') return 'W';
  return 'M';
}

function padAnrede(gender: string): string {
  const g = padGender(gender);
  return g === 'W' ? 'Frau' : 'Herr';
}

function escapeXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeLabForFilename(name: string): string {
  return (name || 'Labor')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
}

// ============================================================
// XML BUILDER
// ============================================================

function buildPadXml(
  labInfo: any,
  orders: { orderId: string; displayId: string; snap: any; paymentDate: string }[]
): string {
  const ns = 'http://padinfo.de/ns/pad';

  let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
  xml += `<rechnungen xmlns="${ns}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" `;
  xml += `xsi:schemaLocation="${ns} http://padinfo.de/ns/pad/padx_auf_v2.12.xsd" `;
  xml += `anzahl="${orders.length}">\n`;

  // nachrichtentyp
  xml += `  <nachrichtentyp version="02.12">ADL</nachrichtentyp>\n`;

  // rechnungsersteller (lab)
  xml += `  <rechnungsersteller>\n`;
  xml += `    <name>${escapeXml(labInfo.name || '')}</name>\n`;
  xml += `    <namezusatz>${escapeXml(labInfo.namezusatz || labInfo.name || '')}</namezusatz>\n`;
  xml += buildAnschriftXml(labInfo, 4);
  xml += `  </rechnungsersteller>\n`;

  // leistungserbringer (lab as service provider)
  xml += `  <leistungserbringer id="01" aisid="${escapeXml(labInfo.aisid || '')}">\n`;
  xml += `    <name>${escapeXml(labInfo.name || '')}</name>\n`;
  xml += buildAnschriftXml(labInfo, 4);
  xml += `  </leistungserbringer>\n`;

  // One <rechnung> per order
  for (const order of orders) {
    const snap = order.snap;
    if (!snap || !snap.positions || snap.positions.length === 0) continue;

    const invoiceId = order.displayId || `A-${order.orderId.substring(0, 8)}`;
    const doctorName = snap.doctor?.full_name || 'Unbekannter Arzt';

    xml += `  <rechnung id="${escapeXml(invoiceId)}" aisrechnungsnr="${escapeXml(invoiceId)}">\n`;

    // rechnungsempfaenger (patient)
    const patient = snap.patient || {};
    xml += `    <rechnungsempfaenger>\n`;
    xml += `      <person>\n`;
    xml += `        <anrede>${escapeXml(padAnrede(patient.gender))}</anrede>\n`;
    xml += `        <vorname>${escapeXml(patient.first_name || '')}</vorname>\n`;
    xml += `        <name>${escapeXml(patient.last_name || '')}</name>\n`;
    xml += `      </person>\n`;
    xml += `    </rechnungsempfaenger>\n`;

    // abrechnungsfall > humanmedizin
    xml += `    <abrechnungsfall>\n`;
    xml += `      <humanmedizin>\n`;

    // behandelter (patient being treated)
    xml += `        <behandelter>\n`;
    xml += `          <person>\n`;
    xml += `            <anrede>${escapeXml(padAnrede(patient.gender))}</anrede>\n`;
    xml += `            <vorname>${escapeXml(patient.first_name || '')}</vorname>\n`;
    xml += `            <name>${escapeXml(patient.last_name || '')}</name>\n`;
    if (patient.date_of_birth) {
      xml += `            <gebdatum>${padDate(patient.date_of_birth)}</gebdatum>\n`;
    }
    xml += `            <geschlecht>${padGender(patient.gender)}</geschlecht>\n`;
    xml += `          </person>\n`;
    xml += `        </behandelter>\n`;

    // positionen
    const positions = snap.positions || [];
    xml += `        <positionen posanzahl="${positions.length}">\n`;

    const insuranceType = (patient.insurance_type || '').toLowerCase();
    const posDate = order.paymentDate ? padDate(order.paymentDate) : padDate(snap.generated_at || '');

    positions.forEach((pos: any, idx: number) => {
      const posNr = idx + 1;
      const goDigit = pos.goae_digit || '';
      const goName = pos.goae_name || '';
      const qty = pos.quantity || 1;

      // Factor: ArminLabs always 1.15, others depend on insurance
      let faktor = 1.00;
      const labNameLower = (pos.laboratory || '').toLowerCase();
      if (labNameLower.includes('armin')) {
        faktor = 1.15;
      } else if (insuranceType.includes('privat')) {
        faktor = 1.15;
      }
      // Use per-position factor if stored
      if (pos.goae_factor) {
        const parsed = parseFloat(pos.goae_factor);
        if (!isNaN(parsed) && parsed > 0) faktor = parsed;
      }

      // Parse cost
      let einzelbetrag: number | null = null;
      if (pos.goae_cost) {
        // goae_cost might be "20.40" or "20.40 (2x)" — extract first number
        const costMatch = pos.goae_cost.match(/([\d.,]+)/);
        if (costMatch) {
          einzelbetrag = parseFloat(costMatch[1].replace(',', '.'));
        }
      }

      const gesamtbetrag = einzelbetrag != null ? einzelbetrag * qty * faktor : null;

      xml += `          <goziffer positionsnr="${posNr}" go="GOAE" ziffer="${escapeXml(goDigit)}">\n`;
      xml += `            <datum>${posDate}</datum>\n`;
      xml += `            <anzahl>${Math.max(1, qty)}</anzahl>\n`;
      if (goName) {
        xml += `            <text>${escapeXml(goName)}</text>\n`;
      }
      xml += `            <faktor>${faktor.toFixed(2)}</faktor>\n`;
      if (einzelbetrag != null) {
        xml += `            <einzelbetrag>${padMoney(einzelbetrag)}</einzelbetrag>\n`;
      }
      if (gesamtbetrag != null) {
        xml += `            <gesamtbetrag>${padMoney(gesamtbetrag)}</gesamtbetrag>\n`;
      }
      xml += `          </goziffer>\n`;
    });

    xml += `        </positionen>\n`;
    xml += `      </humanmedizin>\n`;
    xml += `    </abrechnungsfall>\n`;

    // anfangstext
    xml += `    <anfangstext>Auf Veranlassung von ${escapeXml(doctorName)} Rechnungsbetrag wurde bereits bezahlt.</anfangstext>\n`;

    xml += `  </rechnung>\n`;
  }

  xml += `</rechnungen>\n`;
  return xml;
}

function buildAnschriftXml(lab: any, indent: number): string {
  const pad = ' '.repeat(indent);
  let xml = `${pad}<anschrift>\n`;
  xml += `${pad}  <hausadresse>\n`;
  xml += `${pad}    <land>${escapeXml(lab.land || 'D')}</land>\n`;
  if (lab.plz) xml += `${pad}    <plz>${escapeXml(lab.plz)}</plz>\n`;
  if (lab.ort) xml += `${pad}    <ort>${escapeXml(lab.ort)}</ort>\n`;
  if (lab.strasse) xml += `${pad}    <strasse>${escapeXml(lab.strasse)}</strasse>\n`;
  xml += `${pad}  </hausadresse>\n`;
  xml += `${pad}</anschrift>\n`;
  return xml;
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export async function runPadExport(options: PadExportOptions): Promise<PadExportResult> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Query eligible orders
  let query = supabaseAdmin
    .from('tt_order')
    .select('id, display_id, recommendation_id, doctor_id, patient_id, pad_pvs_data, pad_export_status, created_at, payment_confirmed_at, status')
    .in('status', ['results_ready', 'completed'])
    .gte('created_at', `${options.dateStart}T00:00:00Z`)
    .lte('created_at', `${options.dateEnd}T23:59:59Z`);

  if (!options.includeExported) {
    query = query.or('pad_export_status.eq.pending,pad_export_status.is.null');
  }

  const { data: orders, error: ordersError } = await query.order('created_at', { ascending: true });

  if (ordersError) throw ordersError;
  if (!orders || orders.length === 0) {
    throw new Error('No eligible orders found for the given date range.');
  }

  // 2. Group orders by lab (from pad_pvs_data.positions[].laboratory_id)
  const labGroups = new Map<string, { labId: string; labName: string; orders: any[] }>();

  for (const order of orders) {
    const snap = order.pad_pvs_data;
    if (!snap || !snap.positions || snap.positions.length === 0) continue;

    // Collect unique labs from positions
    const labsInOrder = new Map<string, string>();
    for (const pos of snap.positions) {
      if (pos.laboratory_id && pos.laboratory) {
        labsInOrder.set(pos.laboratory_id, pos.laboratory);
      }
    }

    // Apply lab filter if specified
    for (const [labId, labName] of Array.from(labsInOrder.entries())) {
      if (options.labId && options.labId !== labId) continue;

      if (!labGroups.has(labId)) {
        labGroups.set(labId, { labId, labName, orders: [] });
      }
      labGroups.get(labId)!.orders.push({
        orderId: order.id,
        displayId: order.display_id || order.id.substring(0, 8),
        snap: {
          ...snap,
          // Filter positions to only this lab
          positions: snap.positions.filter((p: any) => p.laboratory_id === labId),
        },
        paymentDate: order.payment_confirmed_at || order.created_at,
      });
    }
  }

  if (labGroups.size === 0) {
    throw new Error('No eligible orders with billing data found for the given filters.');
  }

  // 3. Fetch lab details for XML headers
  const labIds = Array.from(labGroups.keys());
  const { data: labs } = await supabaseAdmin
    .from('tt_laboratory')
    .select('id, name, official_name, address_street, address_zip, address_city, pdf_config')
    .in('id', labIds);

  const labInfoMap = new Map<string, any>();
  for (const lab of (labs || [])) {
    const cfg = lab.pdf_config || {};
    labInfoMap.set(lab.id, {
      name: lab.official_name || cfg.legal_entity || lab.name,
      namezusatz: lab.name,
      land: 'D',
      plz: lab.address_zip || '',
      ort: lab.address_city || '',
      strasse: lab.address_street || '',
      aisid: cfg.aisid || '',
      kundennr: cfg.customer_number || '',
    });
  }

  // 4. Get export counter
  const { data: counterRow } = await supabaseAdmin
    .from('tt_service_config')
    .select('id, pad_export_counter')
    .limit(1)
    .single();

  let currentCounter = counterRow?.pad_export_counter || 0;

  // 5. Generate XML files and upload
  const results: PadExportResult = { files: [], total_orders: 0, total_files: 0 };
  const batchId = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  const exportedOrderIds: string[] = [];

  for (const group of Array.from(labGroups.values())) {
    const labId = group.labId;
    const labInfo = labInfoMap.get(labId) || { name: group.labName, land: 'D' };

    const xmlContent = buildPadXml(labInfo, group.orders);

    currentCounter++;
    const safeLab = sanitizeLabForFilename(group.labName);
    const filename = `PV345000_${dateStr}_${safeLab}_${currentCounter}_padx.xml`;
    const filePath = `exports/pad/${batchId}/${filename}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(xmlContent, 'utf-8');
    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: 'application/xml',
        upsert: true,
      });

    if (uploadError) {
      console.error(`[PAD Export] Upload failed for lab ${group.labName}:`, uploadError);
      continue;
    }

    const { data: signedUrl } = await supabaseAdmin.storage
      .from('documents')
      .createSignedUrl(filePath, 7 * 24 * 60 * 60); // 7 days

    results.files.push({
      lab_name: group.labName,
      file_path: filePath,
      url: signedUrl?.signedUrl || '',
      order_count: group.orders.length,
    });

    results.total_orders += group.orders.length;
    results.total_files++;

    // Collect order IDs for marking
    group.orders.forEach(o => exportedOrderIds.push(o.orderId));
  }

  // 6. Update export counter
  if (counterRow) {
    await supabaseAdmin
      .from('tt_service_config')
      .update({ pad_export_counter: currentCounter })
      .eq('id', counterRow.id);
  }

  // 7. Mark orders as exported
  for (const oid of Array.from(new Set(exportedOrderIds))) {
    await supabaseAdmin
      .from('tt_order')
      .update({
        pad_export_status: 'exported',
        pad_exported_at: new Date().toISOString(),
        pad_export_batch_id: batchId,
      })
      .eq('id', oid);
  }

  return results;
}
