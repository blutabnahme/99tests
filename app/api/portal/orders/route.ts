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

    const { data: orders, error } = await supabaseAdmin
      .from('tt_order')
      .select(`
        *,
        patient:patient_id(id, first_name, last_name, email),
        doctor:doctor_id(id, full_name, practice_name),
        recommendation:recommendation_id(
          id,
          display_id,
          status,
          items:tt_recommendation_item(
            *,
            test:test_id(*)
          )
        ),
        shipments:tt_order_shipment(
          *,
          laboratory:laboratory_id(name, address_city)
        ),
        resends:tt_order_resend(*),
        results:tt_order_result(id, file_name, status, visibility, tests_covered, doctor_notes, created_at)
      `)
      .eq('patient_id', patientId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Portal Orders] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('[Portal Orders] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
