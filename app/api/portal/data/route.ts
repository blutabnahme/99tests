export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateSession } from '@/lib/patient-auth';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const patientId = await validateSession(sessionToken);
    if (!patientId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    if (section === 'tests') {
      // All recommendations with their orders
      const { data: recommendations } = await supabaseAdmin
        .from('tt_recommendation')
        .select(`
          id, display_id, status, billing_mode, magic_link,
          collection_preference, results_delivery,
          expected_appointment_date, created_at, sent_at, paid_at,
          doctor:doctor_id(id, full_name, practice_name),
          items:tt_recommendation_item(
            id, quantity, unit_price, test_type,
            test:test_id(id, name, sku, type)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      // Fetch orders for these recommendations
      const recIds = (recommendations || []).map((r: any) => r.id);
      let orders: any[] = [];
      if (recIds.length > 0) {
        const { data: orderData } = await supabaseAdmin
          .from('tt_order')
          .select(`
            id, display_id, status, total, test_costs_total, service_fee_amount,
            shipping_cost, vat_amount, payment_method, created_at, shipped_at, completed_at,
            dhl_tracking_outbound, dhl_tracking_return,
            preparation_status, recommendation_id
          `)
          .in('recommendation_id', recIds);
        orders = orderData || [];
      }

      // Merge orders into recommendations
      const merged = (recommendations || []).map((rec: any) => ({
        ...rec,
        order: orders.find((o: any) => o.recommendation_id === rec.id) || null,
      }));

      return NextResponse.json({ recommendations: merged });
    }

    if (section === 'orders') {
      // All orders for this patient
      const { data: orders } = await supabaseAdmin
        .from('tt_order')
        .select(`
          id, display_id, status, total, test_costs_total, service_fee_amount,
          shipping_cost, vat_amount, payment_method, created_at, shipped_at, completed_at,
          dhl_tracking_outbound, dhl_tracking_return,
          preparation_status,
          recommendation:recommendation_id(id, display_id, status,
            doctor:doctor_id(full_name, practice_name)
          )
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      return NextResponse.json({ orders: orders || [] });
    }

    if (section === 'doctors') {
      // All doctors who have created recommendations for this patient
      const { data: recs } = await supabaseAdmin
        .from('tt_recommendation')
        .select(`
          doctor:doctor_id(id, full_name, practice_name, specialty, email, phone)
        `)
        .eq('patient_id', patientId);

      // Deduplicate doctors
      const doctorMap = new Map<string, any>();
      (recs || []).forEach((r: any) => {
        if (r.doctor?.id && !doctorMap.has(r.doctor.id)) {
          doctorMap.set(r.doctor.id, r.doctor);
        }
      });

      // Count recommendations per doctor
      const doctors = Array.from(doctorMap.values()).map(doc => {
        const recCount = (recs || []).filter((r: any) => r.doctor?.id === doc.id).length;
        return { ...doc, recommendation_count: recCount };
      });

      return NextResponse.json({ doctors });
    }

    if (section === 'profile') {
      const { data: patient } = await supabaseAdmin
        .from('tt_patient')
        .select('*')
        .eq('id', patientId)
        .single();

      return NextResponse.json({ patient });
    }

    // Overview — summary stats
    const { count: testCount } = await supabaseAdmin
      .from('tt_recommendation')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    const { count: orderCount } = await supabaseAdmin
      .from('tt_order')
      .select('id', { count: 'exact', head: true })
      .eq('patient_id', patientId);

    const { data: activeOrders } = await supabaseAdmin
      .from('tt_order')
      .select('id, status')
      .eq('patient_id', patientId)
      .not('status', 'in', '("completed","cancelled")');

    return NextResponse.json({
      stats: {
        total_tests: testCount || 0,
        total_orders: orderCount || 0,
        active_orders: activeOrders?.length || 0,
      },
    });
  } catch (error: any) {
    console.error('[Portal Data] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('patient_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const patientId = await validateSession(sessionToken);
    if (!patientId) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();

    // Whitelist allowed fields
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone',
      'date_of_birth', 'gender', 'insured_status',
      'address_line1', 'address_zip', 'address_city', 'address_country',
    ];

    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updates[key] = body[key] || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('tt_patient')
      .update(updates)
      .eq('id', patientId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Portal Data] Update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
