export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [
      recommendationsResult,
      ordersResult,
      doctorsResult,
      patientsResult,
      recItemsResult,
      catalogResult,
      shipmentsResult,
      resultsResult,
      resendsResult,
    ] = await Promise.all([
      // Recommendations
      supabaseAdmin
        .from('tt_recommendation')
        .select('id, display_id, status, doctor_id, patient_id, created_at')
        .order('created_at', { ascending: false }),

      // Orders
      supabaseAdmin
        .from('tt_order')
        .select('id, display_id, recommendation_id, status, payment_method, total, test_costs_total, created_at, doctor_id, patient_id')
        .order('created_at', { ascending: false }),

      // Doctors
      supabaseAdmin
        .from('tt_doctor')
        .select('id, full_name, practice_name, created_at')
        .order('created_at', { ascending: false }),

      // Patients
      supabaseAdmin
        .from('tt_patient')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false }),

      // Recommendation items (for test popularity)
      supabaseAdmin
        .from('tt_recommendation_item')
        .select('id, recommendation_id, test_id, lab_id, laboratory:lab_id(name)')
        .order('recommendation_id'),

      // Test catalog (for test names)
      supabaseAdmin
        .from('tt_test_catalog')
        .select('id, test_name, short_name, laboratory_id')
        .limit(500),

      // Shipments
      supabaseAdmin
        .from('tt_order_shipment')
        .select('id, order_id, leg, status, carrier, created_at')
        .order('created_at', { ascending: false }),

      // Results
      supabaseAdmin
        .from('tt_order_result')
        .select('id, order_id, created_at')
        .order('created_at', { ascending: false }),

      // Resends
      supabaseAdmin
        .from('tt_order_resend')
        .select('id, order_id, reason, failed_tests, status, created_at, notes, order:order_id(display_id, doctor_id, recommendation_id)')
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      recommendations: recommendationsResult.data || [],
      orders: ordersResult.data || [],
      doctors: doctorsResult.data || [],
      patients: patientsResult.data || [],
      recommendation_items: recItemsResult.data || [],
      test_catalog: catalogResult.data || [],
      shipments: shipmentsResult.data || [],
      results: resultsResult.data || [],
      resends: resendsResult.data || [],
    });
  } catch (error: any) {
    console.error('[Insights] API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
