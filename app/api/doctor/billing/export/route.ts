export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || session.user.user_metadata?.role !== 'doctor_practice') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hcId = session.user.id;

    // Fetch the identical ledger data
    const { data: recommendations, error } = await supabase
      .from('recommendation')
      .select(`
        id, created_at, status, test_types,
        patient(first_name, last_name),
        payment(patient_amount, vat_amount, paid_at, status)
      `)
      .eq('doctor_id', hcId)
      .eq('status', 'paid');

    if (error) throw error;

    let csvContent = "Paid Date,Recommendation ID,Patient Name,Tests,Subtotal,VAT,Gross Total,Payer\n";

    recommendations?.forEach(c => {
       let totalPaid = 0;
       let vatPaid = 0;
       let paidDate = c.created_at;

       if (c.payment && c.payment.length > 0) {
          c.payment.forEach((p: any) => {
             if (p.status === 'completed') {
                totalPaid += p.patient_amount;
                vatPaid += p.vat_amount;
                paidDate = p.paid_at || paidDate;
             }
          });
       }

       if (totalPaid > 0) {
          const p = Array.isArray(c.patient) ? c.patient[0] : c.patient;
          const patientName = p ? `${p.first_name} ${p.last_name}` : 'Unknown';
          const tests = c.test_types?.join('; ') || '';
          const subtotal = (totalPaid - vatPaid).toFixed(2);
          const vat = vatPaid.toFixed(2);
          const total = totalPaid.toFixed(2);
          const pDate = new Date(paidDate).toISOString().split('T')[0];

          // Escape commas in names/tests
          const cleanName = patientName.replace(/,/g, '');
          const cleanTests = tests.replace(/,/g, '');

          csvContent += `${pDate},${c.id},${cleanName},${cleanTests},${subtotal},${vat},${total},Patient Covered\n`;
       }
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing-ledger-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
