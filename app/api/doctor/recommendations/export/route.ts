import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user } } = await supabaseClient.auth.getUser();

 if (!user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const status = searchParams.get('status');
 const search = searchParams.get('search');
 const dateFrom = searchParams.get('date_from');
 const dateTo = searchParams.get('date_to');

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 let query = supabaseAdmin
 .from('tt_recommendation')
 .select(`
 *,
 patient:patient_id(first_name, last_name, email, dob),
 items:tt_recommendation_item(
 quantity, unit_price,
 test:tt_test_catalog(name, laboratory:tt_laboratory(name))
 )
 `)
 .eq('doctor_id', doctor.id)
 .order('created_at', { ascending: false });

 if (status && status !== 'all') {
 query = query.eq('status', status);
 }
 if (dateFrom) {
 query = query.gte('created_at', new Date(dateFrom).toISOString());
 }
 if (dateTo) {
 query = query.lte('created_at', new Date(dateTo).toISOString());
 }
 if (search) {
 query = query.or(`display_id.ilike.%${search}%`);
 }

 const { data, error } = await query;
 if (error) throw error;

 const rows = (data || []).map((r: any) => {
 let testCosts = 0;
 let serviceFee = 0;
 let shippingEstimate = 0;
 let vat = 0;

 const testNamesArr: string[] = [];
 const labNamesArr: string[] = [];

 (r.items || []).forEach((item: any) => {
 const qty = Number(item.quantity) || 1;
 const price = Number(item.unit_price) || 0;
 testCosts += (qty * price);

 if (item.test) {
 testNamesArr.push(item.test.name);
 if (item.test.laboratory && item.test.laboratory.name && !labNamesArr.includes(item.test.laboratory.name)) {
 labNamesArr.push(item.test.laboratory.name);
 }
 }
 });

 // Recalculate or use API calculated constants if saved, we fallback to recalc using total_amount diffs generally,
 // but the table tt_recommendation might not store decomposed amounts unless we added them. Let's map what we have:
 return {
 'ID': r.display_id,
 'Patient Name': r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : 'Unknown',
 'Patient Email': r.patient?.email || '',
 'Patient DOB': r.patient?.dob || '',
 'Status': r.status.toUpperCase(),
 'Test Names': testNamesArr.join(', '),
 'Lab Names': labNamesArr.join(', '),
 'Test Costs Total': testCosts,
 'Grand Total': r.total_amount,
 'Collection Method': r.collection_preference || 'Unspecified',
 'Results Delivery': r.results_delivery || 'app',
 'Created Date': new Date(r.created_at).toLocaleString(),
 'Sent Date': r.sent_at ? new Date(r.sent_at).toLocaleString() : '',
 'Paid Date': r.paid_at ? new Date(r.paid_at).toLocaleString() : ''
 };
 });

 const worksheet = XLSX.utils.json_to_sheet(rows);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, "Recommendations");

 const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

 const filename = `99tests-recommendations-${new Date().toISOString().split('T')[0]}.xlsx`;

 return new NextResponse(buf, {
 status: 200,
 headers: {
 'Content-Disposition': `attachment; filename="${filename}"`,
 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
 }
 });

 } catch (err: any) {
 console.error("Export error:", err);
 return NextResponse.json({ error: err.message }, { status: 500 });
 }
}
