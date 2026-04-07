import jsPDF from 'jspdf';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface PatientInfo {
  salutation: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  is_minor?: boolean;
}

interface LabPdfConfig {
  header_name?: string;
  legal_entity?: string;
  address_full?: string;
  phone?: string;
  website?: string;
  email?: string;
  registry?: string;
  ust_id?: string;
  geschaeftsfuehrer?: string;
  privacy_url?: string;
  befund_email?: string;
}

interface LabGroup {
  lab_id: string;
  lab_name: string;
  lab_official_name?: string;
  lab_practice_name?: string;
  lab_address_street?: string;
  lab_address_zip?: string;
  lab_address_city?: string;
  pdf_config: LabPdfConfig;
  parameters: { name: string; sku: string }[];
}

interface AnamneseInput {
  order_display_id: string;
  patient: PatientInfo;
  befund_email: string;
}

interface AnamneseResult {
  lab_id: string;
  lab_name: string;
  file_path: string;
  public_url?: string;
}

// ============================================================
// HELPERS
// ============================================================

function formatSalutation(gender: string): string {
  if (gender === 'M' || gender === 'Herr') return 'Herr';
  if (gender === 'W' || gender === 'Frau') return 'Frau';
  return '';
}

function formatDateDE(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch {
    return isoDate;
  }
}

function drawSectionBar(doc: jsPDF, y: number, text: string, margin: number, contentWidth: number): number {
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(text, margin + 3, y + 5);
  doc.setTextColor(0, 0, 0);
  return y + 10;
}

// ============================================================
// PDF GENERATOR — ONE PDF PER LAB
// ============================================================

function generateAnamnesePdf(input: AnamneseInput, labGroup: LabGroup): Uint8Array {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let y = 15;

  const cfg = labGroup.pdf_config || {};
  const salutation = formatSalutation(input.patient.salutation);
  const patientFullName = `${salutation} ${input.patient.first_name} ${input.patient.last_name}`.trim();
  const dobFormatted = formatDateDE(input.patient.date_of_birth);
  const labDisplayName = cfg.header_name || labGroup.lab_official_name || labGroup.lab_name;
  const befundEmail = cfg.befund_email || input.befund_email || '';

  // =============================================
  // HEADER: 99Tests | Lab Laborauftrag | Bestellnummer
  // =============================================

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 128, 133);
  doc.text('99Tests', margin, y + 5);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const headerTitle = `${labDisplayName} Laborauftrag`;
  const titleWidth = doc.getTextWidth(headerTitle);
  doc.text(headerTitle, (pageWidth - titleWidth) / 2, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const orderLabel = 'BESTELLNUMMER';
  const orderLabelWidth = doc.getTextWidth(orderLabel);
  doc.text(orderLabel, pageWidth - margin - orderLabelWidth, y + 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  const orderIdWidth = doc.getTextWidth(input.order_display_id);
  doc.text(input.order_display_id, pageWidth - margin - orderIdWidth, y + 7);

  y += 15;

  // =============================================
  // PERSÖNLICHE INFORMATIONEN
  // =============================================

  y = drawSectionBar(doc, y, 'PERSÖNLICHE INFORMATIONEN', margin, contentWidth);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('NAME, VORNAME', margin + 4, y + 5);
  doc.text('GEBURTSDATUM', margin + contentWidth * 0.65, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(patientFullName, margin + 4, y + 13);
  doc.text(dobFormatted, margin + contentWidth * 0.65, y + 13);

  y += 22;

  // =============================================
  // LABORAUFTRAG - IGEL / PRIVAT
  // =============================================

  y = drawSectionBar(doc, y, 'LABORAUFTRAG - IGEL / PRIVAT', margin, contentWidth);

  doc.setDrawColor(220, 220, 220);
  doc.rect(margin, y, contentWidth, 18);

  const col1 = margin + 4;
  const col2 = margin + contentWidth * 0.33;
  const col3 = margin + contentWidth * 0.55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('DATUM (TT/MM/JJJJ)', col1, y + 5);
  doc.text('UHRZEIT BLUTENTNAHME', col2, y + 5);
  doc.text('ALTERNATIVER BEFUNDVERSAND AN: MEINEN ARZT/HP', col3, y + 5);

  if (befundEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(befundEmail, col3, y + 13);
  }

  y += 22;

  // =============================================
  // PARAMETER CHECKLIST (3-column grid)
  // =============================================

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const colCount = 3;
  const colWidth = contentWidth / colCount;
  const params = labGroup.parameters;
  const rowHeight = 8;

  for (let i = 0; i < params.length; i++) {
    const col = i % colCount;
    const rowIndex = Math.floor(i / colCount);
    const currentRowY = y + rowIndex * rowHeight;

    if (currentRowY > 255) {
      doc.addPage();
      y = margin;
      // Recalculate: reset i to reprocess remaining from new page
      // Actually easier to just break rows naturally
    }

    const xPos = margin + col * colWidth;
    const yPos = y + rowIndex * rowHeight;

    // Filled checkbox
    doc.setDrawColor(100, 100, 100);
    doc.setFillColor(100, 100, 100);
    doc.rect(xPos, yPos - 2.5, 3, 3, 'FD');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(xPos + 0.6, yPos - 0.8, xPos + 1.2, yPos);
    doc.line(xPos + 1.2, yPos, xPos + 2.4, yPos - 1.8);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    // Parameter name (truncate if too long for column)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    let paramName = params[i].name;
    const maxTextWidth = colWidth - 8;
    while (doc.getTextWidth(paramName) > maxTextWidth && paramName.length > 3) {
      paramName = paramName.substring(0, paramName.length - 1);
    }
    if (paramName !== params[i].name) paramName += '…';
    doc.text(paramName, xPos + 5, yPos);
  }

  // Advance y past all parameter rows
  const totalRows = Math.ceil(params.length / colCount);
  y += totalRows * rowHeight + 6;

  // =============================================
  // RECHTLICHE EINWILLIGUNG
  // =============================================

  if (y > 200) { doc.addPage(); y = margin; }

  y = drawSectionBar(doc, y, 'RECHTLICHE EINWILLIGUNG', margin, contentWidth);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);

  const labLegalName = cfg.legal_entity || labGroup.lab_official_name || labGroup.lab_name;

  // Intro
  const introText = 'Standardmäßig erhalten Sie den Befund per E-Mail durch die Wir sind immun GmbH – Betreiber der Webseiten (99Tests.de und bin-ich-schon-immun.de). Bitte beachten Sie, dass wir bei fehlender Unterschrift den oben genannten test nicht ansetzen dürfen.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  y += introLines.length * 3.2 + 4;

  // Patientenerklärung
  doc.setFont('helvetica', 'bold');
  doc.text('Patientenerklärung:', margin, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  const patientDecl = 'Ich fordere die Untersuchungen auf eigenen ausdrücklichen Wunsch an. Mir ist bekannt, dass diese individuellen Gesundheitsleistungen außerhalb der Zuständigkeit der gesetzlichen Krankenversicherung erbracht und abgerechnet werden.';
  const declLines = doc.splitTextToSize(patientDecl, contentWidth);
  doc.text(declLines, margin, y);
  y += declLines.length * 3.2 + 4;

  // Datenschutzrechtliche Einwilligung
  doc.setFont('helvetica', 'bold');
  doc.text('Datenschutzrechtliche Einwilligung:', margin, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  const privacyText = `Ich bin einverstanden, dass ${labLegalName === labGroup.lab_name ? 'das' : 'die'} ${labLegalName} im Rahmen dieses Laborauftrags meine personenbezogenen Daten, wozu auch Informationen über meine Gesundheit gehören, erhebt, verarbeitet und diese insbesondere für die oben vereinbarten Zwecke gespeichert und analysiert werden.`;
  const privLines = doc.splitTextToSize(privacyText, contentWidth);
  doc.text(privLines, margin, y);
  y += privLines.length * 3.2 + 4;

  // Rechte des Betroffenen
  doc.setFont('helvetica', 'bold');
  doc.text('Rechte des Betroffenen:', margin, y);
  y += 3.5;
  doc.setFont('helvetica', 'normal');
  let rightsText = 'Ich weiß zudem, dass ich meine Einwilligung jederzeit ohne die Angabe von Gründen mit Wirkung für die Zukunft widerrufen kann.';
  if (cfg.privacy_url) {
    rightsText += ` Weitere Informationen dazu, wie meine personenbezogenen Daten verarbeitet werden, erhalte ich unter ${cfg.privacy_url}.`;
  }
  const rightsLines = doc.splitTextToSize(rightsText, contentWidth);
  doc.text(rightsLines, margin, y);
  y += rightsLines.length * 3.2 + 6;

  doc.setTextColor(0, 0, 0);

  // =============================================
  // UNTERSCHRIFTEN
  // =============================================

  if (y > 230) { doc.addPage(); y = margin; }

  y = drawSectionBar(doc, y, 'UNTERSCHRIFTEN', margin, contentWidth);

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  // Patient signature
  doc.text('ORT, DATUM', margin + 4, y);
  doc.text('UNTERSCHRIFT DES PATIENTEN', margin + contentWidth * 0.4, y);
  y += 8;
  doc.setDrawColor(0, 128, 133);
  doc.setLineWidth(0.4);
  doc.line(margin + 4, y, margin + contentWidth * 0.35, y);
  doc.line(margin + contentWidth * 0.4, y, pageWidth - margin - 4, y);
  y += 10;

  // Guardian signature (always shown — matches existing template)
  doc.text('ORT, DATUM', margin + 4, y);
  doc.text('UNTERSCHRIFT DES/DER ERZIEHUNGSBERECHTIGTEN ODER DES VORMUNDS', margin + contentWidth * 0.4, y);
  y += 8;
  doc.line(margin + 4, y, margin + contentWidth * 0.35, y);
  doc.line(margin + contentWidth * 0.4, y, pageWidth - margin - 4, y);

  doc.setDrawColor(0, 0, 0);

  // =============================================
  // FOOTER
  // =============================================

  const footerY = 275;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);

  // Left: 99Tests
  doc.text('99Tests.de | Wir Sind Immun GmbH', margin, footerY);
  doc.text('Geschäftsführer Christian Hannig und Dominik Schleyer', margin, footerY + 3);
  doc.text('Münchener Str. 38 - 60329 | Frankfurt | HRB 122672 Amtsgericht', margin, footerY + 6);

  // Right: Lab
  const labFooterLines: string[] = [];
  labFooterLines.push(cfg.legal_entity || labGroup.lab_name);
  if (cfg.address_full) labFooterLines.push(cfg.address_full);
  if (cfg.geschaeftsfuehrer) labFooterLines.push(`Geschäftsführer: ${cfg.geschaeftsfuehrer}`);
  const contactParts: string[] = [];
  if (cfg.phone) contactParts.push(`Tel: ${cfg.phone}`);
  if (cfg.website) contactParts.push(cfg.website);
  if (cfg.email) contactParts.push(cfg.email);
  if (contactParts.length > 0) labFooterLines.push(contactParts.join(' | '));
  const regParts: string[] = [];
  if (cfg.registry) regParts.push(cfg.registry);
  if (cfg.ust_id) regParts.push(`USt-IDNr: ${cfg.ust_id}`);
  if (regParts.length > 0) labFooterLines.push(regParts.join(' | '));

  labFooterLines.forEach((line, idx) => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, pageWidth - margin - lineWidth, footerY + idx * 3);
  });

  doc.setTextColor(0, 0, 0);

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

// ============================================================
// MAIN EXPORT: Generate + Upload all Anamnese PDFs for an order
// ============================================================

export async function generateAnamnese(
  orderId: string,
  orderDisplayId: string,
  recommendationId: string
): Promise<{ success: boolean; files: AnamneseResult[]; error?: string }> {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Fetch patient data
    const { data: rec, error: recError } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        patient:patient_id(
          first_name, last_name, date_of_birth, gender,
          is_minor, guardian_first_name, guardian_last_name
        )
      `)
      .eq('id', recommendationId)
      .single();

    if (recError || !rec?.patient) throw new Error('Failed to fetch patient data');

    const patient: PatientInfo = {
      salutation: (rec.patient as any).gender || '',
      first_name: (rec.patient as any).first_name || '',
      last_name: (rec.patient as any).last_name || '',
      date_of_birth: (rec.patient as any).date_of_birth || '',
      is_minor: (rec.patient as any).is_minor || false,
    };

    // 2. Fetch recommendation items with test + lab data (including pdf_config)
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('tt_recommendation_item')
      .select(`
        id, test_id, test_type,
        test:test_id(
          id, name, sku, type, included_parameters,
          lab:lab_id(id, name, official_name, practice_name, address_street, address_zip, address_city, pdf_config)
        )
      `)
      .eq('recommendation_id', recommendationId);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      return { success: true, files: [], error: 'No items in recommendation' };
    }

    // 3. Group parameters by laboratory (expand profiles into individual parameters)
    const labGroupsMap = new Map<string, LabGroup>();

    const allParamIds = new Set<string>();
    for (const item of items) {
      const test = item.test as any;
      if (test?.type === 'profile' && Array.isArray(test.included_parameters)) {
        test.included_parameters.forEach((id: string) => allParamIds.add(id));
      }
    }

    const paramNameMap = new Map<string, { name: string; sku: string }>();
    if (allParamIds.size > 0) {
      const ids = Array.from(allParamIds);
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const { data: params } = await supabaseAdmin
          .from('tt_test_catalog')
          .select('id, name, sku')
          .in('id', batch);
        params?.forEach(p => paramNameMap.set(p.id, { name: p.name, sku: p.sku }));
      }
    }

    for (const item of items) {
      const test = item.test as any;
      if (!test?.lab) continue;

      const lab = test.lab;
      const labId = lab.id;

      if (!labGroupsMap.has(labId)) {
        labGroupsMap.set(labId, {
          lab_id: labId,
          lab_name: lab.name,
          lab_official_name: lab.official_name || undefined,
          lab_practice_name: lab.practice_name || undefined,
          lab_address_street: lab.address_street || undefined,
          lab_address_zip: lab.address_zip || undefined,
          lab_address_city: lab.address_city || undefined,
          pdf_config: lab.pdf_config || {},
          parameters: [],
        });
      }

      const group = labGroupsMap.get(labId)!;

      if (test.type === 'profile' && Array.isArray(test.included_parameters)) {
        for (const paramId of test.included_parameters) {
          const paramInfo = paramNameMap.get(paramId);
          if (paramInfo && !group.parameters.some(p => p.sku === paramInfo.sku)) {
            group.parameters.push(paramInfo);
          }
        }
      } else {
        if (!group.parameters.some(p => p.sku === test.sku)) {
          group.parameters.push({ name: test.name, sku: test.sku });
        }
      }
    }

    const labGroups = Array.from(labGroupsMap.values());
    if (labGroups.length === 0) {
      return { success: true, files: [], error: 'No lab groups found' };
    }

    // 4. Generate PDFs and upload to Supabase Storage
    const results: AnamneseResult[] = [];
    const anamneseInput: AnamneseInput = {
      order_display_id: orderDisplayId,
      patient,
      befund_email: 'support@bin-ich-schon-immun.de',
    };

    for (const labGroup of labGroups) {
      const pdfBytes = generateAnamnesePdf(anamneseInput, labGroup);
      const buffer = Buffer.from(pdfBytes);

      const fileName = `orders/${orderId}/anamnese-${labGroup.lab_id.substring(0, 8)}.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error(`[Anamnese] Upload failed for lab ${labGroup.lab_name}:`, uploadError);
        continue;
      }

      const { data: signedUrl } = await supabaseAdmin.storage
        .from('documents')
        .createSignedUrl(fileName, 365 * 24 * 60 * 60);

      results.push({
        lab_id: labGroup.lab_id,
        lab_name: labGroup.lab_name,
        file_path: fileName,
        public_url: signedUrl?.signedUrl || undefined,
      });
    }

    // 5. Store file references on the order
    await supabaseAdmin
      .from('tt_order')
      .update({
        anamnese_pdf_urls: results.map(r => ({
          lab_id: r.lab_id,
          lab_name: r.lab_name,
          file_path: r.file_path,
          url: r.public_url,
        })),
      })
      .eq('id', orderId);

    return { success: true, files: results };
  } catch (err: any) {
    console.error('[Anamnese] Generation failed:', err);
    return { success: false, files: [], error: err.message };
  }
}
