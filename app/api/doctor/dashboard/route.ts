import { NextResponse } from 'next/server';
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const role = session.user.user_metadata?.role;

    if (role !== 'doctor' && role !== 'doctor_practice') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Resolve doctor_id mapped to this User ID
    const { data: docProfile, error: docError } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (docError || !docProfile) {
      return NextResponse.json({ error: 'Doctor profile missing' }, { status: 404 });
    }

    const doctorId = docProfile.id;

    // 1. Total Recommendations
    const { count: totalRecs } = await supabaseAdmin
      .from('tt_recommendation')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId);

    // 2. Pending Results (tt_order linked to doctor_id with specific status)
    const { count: pendingResults } = await supabaseAdmin
      .from('tt_order')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .in('status', ['at_lab', 'returning_to_lab']);

    // 3. Active Patients
    const { count: activePatients } = await supabaseAdmin
      .from('tt_patient')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId);

    // 4. Last 10 Recommendations
    const { data: recentRecs } = await supabaseAdmin
      .from('tt_recommendation')
      .select(`
        id, 
        display_id, 
        status, 
        pricing_tier, 
        created_at,
        patient:patient_id ( first_name, last_name ),
        items:tt_recommendation_item ( id, unit_price, quantity )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Map the shape for the consumer
    const mappedRecommendations = (recentRecs || []).map(r => {
      const p = r.patient as any;
      const patientName = p ? `${p.first_name} ${p.last_name}` : "Unknown Patient";
      const items = Array.isArray(r.items) ? r.items : [];
      const total = items.reduce((acc, curr) => acc + (parseFloat(curr.unit_price || 0) * (curr.quantity || 1)), 0);
      
      return {
        id: r.id,
        display_id: r.display_id,
        patientName,
        status: r.status,
        testsCount: items.length,
        total,
        created_at: r.created_at
      };
    });

    return NextResponse.json({
      metrics: {
        total_recommendations: totalRecs || 0,
        pending_results: pendingResults || 0,
        active_patients: activePatients || 0
      },
      recent_recommendations: mappedRecommendations
    });

  } catch (err: any) {
    console.error('Dashboard Error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching dashboard metrics.' },
      { status: 500 }
    );
  }
}
