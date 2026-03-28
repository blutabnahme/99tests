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


    // 3. Active Patients
    const { count: activePatients } = await supabaseAdmin
      .from('tt_patient')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId);

    // 3. Fetch Recommendations (up to 250 for pipeline)
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
      .limit(250);

    const status_counts = {
      created: 0,
      sent: 0,
      paid: 0,
      kit_shipped: 0,
      collection_organized: 0,
      at_lab: 0,
      results_ready: 0
    };

    if (recentRecs) {
      recentRecs.forEach(r => {
        const s = r.status;
        if (s === 'created') status_counts.created++;
        else if (s === 'sent') status_counts.sent++;
        else if (s === 'paid') status_counts.paid++;
        else if (s === 'preparing' || s === 'kit_shipped') status_counts.kit_shipped++;
        else if (s === 'collection_organized' || s === 'awaiting_collection') status_counts.collection_organized++;
        else if (s === 'returning_to_lab' || s === 'at_lab') status_counts.at_lab++;
        else if (s === 'results_ready' || s === 'completed') status_counts.results_ready++;
      });
    }

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
        active_patients: activePatients || 0,
        status_counts
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
