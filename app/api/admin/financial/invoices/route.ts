export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
 try {
 // 1. Group all available unbilled payments by Doctor ID where completed > 0
 const { data: unbilledPayments, error: pErr } = await supabaseAdmin
 .from('payment')
 .select('id, b2b_fee, material_revenue, logistics_revenue, patient_amount, recommendation!inner(doctor_id)')
 .is('doctor_invoice_id', null)
 .not('recommendation.doctor_id', 'is', null);

 if (pErr) throw pErr;

 if (!unbilledPayments || unbilledPayments.length === 0) {
 return NextResponse.json({ success: true, message: 'No unbilled payments available.' });
 }

 const hcGroup: Record<string, any[]> = {};
 unbilledPayments.forEach((p: any) => {
 const hcId = p.case?.doctor_id || (Array.isArray(p.case) ? p.case[0]?.doctor_id : null);
 if (!hcId) return;
 if (!hcGroup[hcId]) hcGroup[hcId] = [];
 hcGroup[hcId].push(p);
 });

 const now = new Date();
 const invoicePrefix = `INV-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

 const newInvoices = [];
 let inc = 1;

 for (const [hcId, payments] of Object.entries(hcGroup)) {
 let casesCount = 0;
 let orgFeesTotal = 0;
 let logisticsTotal = 0;
 let materialsTotal = 0;

 for (const p of payments) {
 casesCount++;
 orgFeesTotal += Number(p.b2b_fee || 0);
 materialsTotal += Number(p.material_revenue || 0);
 logisticsTotal += Number(p.logistics_revenue || 0);
 }

 const subtotal = orgFeesTotal + materialsTotal + logisticsTotal;
 const vat = subtotal * 0.19;
 const total = subtotal + vat;
 
 const invNumber = `${invoicePrefix}-${String(inc++).padStart(3, '0')}`;
 
 newInvoices.push({
 doctor_id: hcId,
 invoice_number: invNumber,
 period_start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
 period_end: now.toISOString(),
 case_count: casesCount,
 org_fees_total: orgFeesTotal,
 material_fees_total: materialsTotal,
 logistics_fees_total: logisticsTotal,
 subtotal: subtotal,
 vat_amount: vat,
 total_amount: total,
 status: 'due',
 due_date: new Date(now.getTime() + 30 * 86400000).toISOString() // NET30
 });
 }

 // Insert Invoices
 const { data: inserted, error: iErr } = await supabaseAdmin
 .from('doctor_invoice')
 .insert(newInvoices)
 .select('id, doctor_id');

 if (iErr) throw iErr;

 // Link Payments properly
 if (inserted) {
 for (const inv of (inserted as any[])) {
 const payIds = hcGroup[inv.doctor_id].map((p: any) => p.id);
 await supabaseAdmin
 .from('payment')
 .update({ doctor_invoice_id: inv.id })
 .in('id', payIds);
 }
 }

 return NextResponse.json({ success: true, generated: inserted?.length || 0 });

 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
