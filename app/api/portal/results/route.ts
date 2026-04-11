import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = await validateSession(sessionToken);
    if (!patientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all orders for this patient
    const { data: orders } = await supabaseAdmin
      .from('tt_order')
      .select('id')
      .eq('patient_id', patientId);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Get released results visible to patient
    const { data: results, error } = await supabaseAdmin
      .from('tt_order_result')
      .select(`
        *,
        laboratory:laboratory_id(name, address_city),
        order:order_id(
          id,
          display_id,
          doctor:doctor_id(id, full_name, practice_name),
          recommendation:recommendation_id(
            id,
            items:tt_recommendation_item(
              id,
              test:test_id(id, name)
            )
          )
        )
      `)
      .in('order_id', orderIds)
      .in('visibility', ['doctor_and_patient', 'patient_only'])
      .eq('status', 'released')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Portal Results] DB error:', error);
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
    }

    return NextResponse.json({ results: results || [] });
  } catch (error: any) {
    console.error('[Portal Results] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
