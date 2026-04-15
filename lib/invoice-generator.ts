import jsPDF from 'jspdf';
import fs from 'fs';
import path from 'path';

export interface ServiceConfig {
  company_name: string;
  company_street: string;
  company_zip_city: string;
  company_country: string;
  company_email: string;
  company_website: string;
  company_registry: string;
  company_ust_id: string;
  company_tax_id: string;
  company_bank_name: string;
  bank_iban: string;
  bank_bic: string;
  company_ceo: string;
  invoice_footer_text?: string;
}

export interface DoctorInfo {
  full_name: string;
  practice_name: string;
  email: string;
}

export interface InvoiceItem {
  display_id: string;
  patient_name: string;
  test_total: number;
  service_fee: number;
}

export interface InvoiceInput {
  invoice_number: string;
  invoice_date: string; // ISO or formatted
  period_start: string; // ISO
  period_end: string; // ISO
  due_date: string; // ISO or formatted
  doctor: DoctorInfo;
  items: InvoiceItem[];
  test_costs: number;
  service_fee_total: number;
  shipping_total: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
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

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

export function generateInvoicePdf(input: InvoiceInput, config: ServiceConfig): Uint8Array {
  // Read logo PNG and convert to base64
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-invoice.png');
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = logoBuffer.toString('base64');
  } catch (e) {
    console.error('[Invoice] Failed to load logo:', e);
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = 210; // page width
  const m = 20;   // margin
  const re = pw - m; // right edge
  const cw = pw - 2 * m; // content width
  let y = m;

  // Color constants
  const TEAL: [number, number, number] = [0, 128, 133];
  const DARK: [number, number, number] = [30, 30, 30];
  const GRAY: [number, number, number] = [120, 120, 120];
  const LIGHT: [number, number, number] = [180, 180, 180];

  // ═══════════════════════════════════════════
  // HEADER: Logo + Company | Invoice Details
  // ═══════════════════════════════════════════

  // Logo image
  const logoW = 36; // width in mm
  const logoH = 6.5; // height in mm (matches 200x36px aspect ratio)
  if (logoBase64) {
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', m, y - 2, logoW, logoH);
  } else {
    // Fallback: text logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...TEAL);
    doc.text('99Tests', m, y + 6);
  }

  // Company details below logo
  y += logoH + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(config.company_name || '', m, y); y += 3.5;
  doc.text(config.company_street || '', m, y); y += 3.5;
  doc.text(config.company_zip_city || '', m, y); y += 3.5;
  doc.text(config.company_country || 'Deutschland', m, y);

  // Invoice detail box (right side, aligned with logo)
  const boxX = m + cw * 0.58;
  const boxW = cw * 0.42;
  const boxY = m - 3; // align with top of page
  doc.setFillColor(247, 248, 250);
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(boxX, boxY, boxW, 24, 1.5, 1.5, 'FD');

  const dlX = boxX + 4;
  const dvX = boxX + boxW - 4;
  let by = boxY + 5;

  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Rechnungsnr.', dlX, by);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEAL);
  doc.text(input.invoice_number, dvX, by, { align: 'right' });
  by += 5;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Datum', dlX, by);
  doc.setTextColor(...DARK);
  doc.text(formatDateDE(input.invoice_date), dvX, by, { align: 'right' });
  by += 5;

  doc.setTextColor(...GRAY);
  doc.text('Zeitraum', dlX, by);
  doc.setTextColor(...DARK);
  doc.text(`${formatDateDE(input.period_start)} - ${formatDateDE(input.period_end)}`, dvX, by, { align: 'right' });
  by += 5;

  doc.setTextColor(...GRAY);
  doc.text('Zahlbar bis', dlX, by);
  doc.setTextColor(...DARK);
  doc.text(formatDateDE(input.due_date), dvX, by, { align: 'right' });

  y += 12;

  // ═══════════════════════════════════════════
  // BILL TO
  // ═══════════════════════════════════════════

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(m, y, re, y);
  doc.setLineWidth(0.2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TEAL);
  doc.text('RECHNUNG AN', m, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(input.doctor.full_name || '', m, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  if (input.doctor.practice_name) {
    doc.text(input.doctor.practice_name, m, y); y += 4;
  }
  if (input.doctor.email) {
    doc.text(input.doctor.email, m, y); y += 4;
  }
  y += 6;

  // ═══════════════════════════════════════════
  // LINE ITEMS TABLE
  // ═══════════════════════════════════════════

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(m, y, re, y);
  doc.setLineWidth(0.2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TEAL);
  doc.text('LEISTUNGEN', m, y);
  y += 7;

  // Table columns
  const c1 = m;          // Order
  const c2 = m + 25;     // Patient
  const c3 = m + 85;     // Tests (right)
  const c4 = m + 110;    // Fee (right)
  const c5 = m + 135;    // Shipping (right)
  const c6 = re;         // Total (right)

  // Header row
  doc.setFillColor(245, 247, 249);
  doc.rect(m, y - 4, cw, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('BESTELLUNG', c1, y);
  doc.text('PATIENT', c2, y);
  doc.text('TESTS', c3, y, { align: 'right' });
  doc.text('GEBUEHR', c4, y, { align: 'right' });
  doc.text('VERSAND', c5, y, { align: 'right' });
  doc.text('GESAMT', c6, y, { align: 'right' });
  y += 7; // was 5

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  for (let i = 0; i < input.items.length; i++) {
    if (y > 240) { doc.addPage(); y = m; }

    const item = input.items[i];
    const perShipping = input.items.length > 0 ? input.shipping_total / input.items.length : 0;
    const lineTotal = item.test_total + item.service_fee + perShipping;

    // Zebra striping
    if (i % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(m, y - 3.5, cw, 7.5, 'F');
    }

    doc.setTextColor(...TEAL);
    doc.setFont('helvetica', 'bold');
    doc.text(item.display_id, c1, y);

    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(item.patient_name || '', c2, y);
    doc.text(formatCurrency(item.test_total), c3, y, { align: 'right' });
    doc.text(formatCurrency(item.service_fee), c4, y, { align: 'right' });
    doc.text(formatCurrency(perShipping), c5, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineTotal), c6, y, { align: 'right' });

    y += 7.5;
  }

  y += 3;
  doc.setDrawColor(220, 220, 220);
  doc.line(m, y, re, y);
  y += 8;

  // ═══════════════════════════════════════════
  // TOTALS (right-aligned block)
  // ═══════════════════════════════════════════

  const slX = re - 50; // summary label x
  const svX = re;       // summary value x

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const summaryRows = [
    ['Testkosten', formatCurrency(input.test_costs)],
    ['Servicegebuehr', formatCurrency(input.service_fee_total)],
    ['Versandkosten', formatCurrency(input.shipping_total)],
  ];

  for (const [label, value] of summaryRows) {
    doc.setTextColor(...GRAY);
    doc.text(label + ':', slX, y, { align: 'right' });
    doc.setTextColor(...DARK);
    doc.text(value, svX, y, { align: 'right' });
    y += 5;
  }

  // Subtotal separator
  y += 1;
  doc.setDrawColor(200, 200, 200);
  doc.line(slX - 15, y, svX, y);
  y += 5;

  doc.setTextColor(...GRAY);
  doc.text('Nettobetrag:', slX, y, { align: 'right' });
  doc.setTextColor(...DARK);
  doc.text(formatCurrency(input.subtotal), svX, y, { align: 'right' });
  y += 5;

  doc.setTextColor(...GRAY);
  doc.text(`USt. (${Number(input.vat_rate).toFixed(0)}%):`, slX, y, { align: 'right' });
  doc.setTextColor(...DARK);
  doc.text(formatCurrency(input.vat_amount), svX, y, { align: 'right' });
  y += 2;

  // VAT note (right-aligned under USt line)
  doc.setFontSize(6);
  doc.setTextColor(170, 170, 170);
  doc.text('* Laborkosten gem. §4 Nr. 14 UStG umsatzsteuerbefreit', svX, y + 1, { align: 'right' });
  y += 5;

  // Grand total - teal double line
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.3);
  doc.line(slX - 15, y, svX, y);
  doc.line(slX - 15, y + 0.8, svX, y + 0.8);
  doc.setLineWidth(0.2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEAL);
  doc.text('GESAMT:', slX, y, { align: 'right' });
  doc.text(formatCurrency(input.total), svX, y, { align: 'right' });
  y += 14;

  // ═══════════════════════════════════════════
  // PAYMENT INFO
  // ═══════════════════════════════════════════

  if (y > 225) { doc.addPage(); y = m; }

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.4);
  doc.line(m, y, re, y);
  doc.setLineWidth(0.2);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...TEAL);
  doc.text('ZAHLUNGSINFORMATIONEN', m, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text('Bitte ueberweisen Sie den Betrag bis zum ' + formatDateDE(input.due_date) + ' auf folgendes Konto:', m, y);
  y += 8;

  // Payment box
  doc.setFillColor(247, 248, 250);
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(m, y - 3, cw, 26, 2, 2, 'FD');

  const plX = m + 5;
  const prX = m + 38;
  let py = y + 2;

  const paymentRows = [
    ['Bank', config.company_bank_name || '\u2014'],
    ['IBAN', config.bank_iban || '\u2014'],
    ['BIC', config.bank_bic || '\u2014'],
    ['Betreff', input.invoice_number],
  ];

  for (const [label, value] of paymentRows) {
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(label, plX, py);
    doc.setTextColor(...DARK);
    if (label === 'IBAN' || label === 'Betreff') {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(value, prX, py);
    doc.setFont('helvetica', 'normal');
    py += 5.5;
  }

  // ═══════════════════════════════════════════
  // FOOTER (pinned to bottom)
  // ═══════════════════════════════════════════

  const fy = 272;
  doc.setDrawColor(220, 220, 220);
  doc.line(m, fy - 3, re, fy - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(160, 160, 160);

  // 3-column footer
  const f1 = m;
  const f2 = m + cw * 0.38;
  const f3 = m + cw * 0.68;

  doc.text(config.company_name || '', f1, fy);
  doc.text(`${config.company_street || ''} | ${config.company_zip_city || ''}`, f1, fy + 3);

  doc.text(`Steuernr: ${config.company_tax_id || ''}`, f2, fy);
  doc.text(`USt-IdNr: ${config.company_ust_id || ''}`, f2, fy + 3);

  if (config.company_ceo) doc.text(`GF: ${config.company_ceo}`, f3, fy);
  if (config.company_registry) doc.text(config.company_registry, f3, fy + 3);

  // Custom footer text
  if (config.invoice_footer_text) {
    doc.setFontSize(6);
    doc.setTextColor(170, 170, 170);
    const ft = doc.splitTextToSize(config.invoice_footer_text, cw);
    doc.text(ft, m, fy + 8);
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}
