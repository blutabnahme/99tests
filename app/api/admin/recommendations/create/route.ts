export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications-helper';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hcId = searchParams.get('doctor_id');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (hcId) {
      const { data: patients } = await supabaseAdmin.from('patient').select('*').eq('doctor_id', hcId).order('first_name', { ascending: true });
      return NextResponse.json({ patients: patients || [] });
    }

    const { data: hcs } = await supabaseAdmin.from('doctor_practice').select('*').order('name', { ascending: true });
    
    // Attempt fetching materials from material_catalog
    const { data: materials, error: matError } = await supabaseAdmin.from('material_catalog').select('*').eq('is_active', true).order('name');
    console.log('Materials:', materials?.length, matError);

    return NextResponse.json({ hcs: hcs || [], materials: materials || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      doctor_id,
      patient_id, // can be valid UUID OR 'new'
      new_patient, // object of { first_name, last_name, email, phone, date_of_birth }
      visit_type,
      urgency_level,
      bc_selection_mode,
      reason,
      admin_notes,
      materials
    } = body;

    if (!doctor_id) return NextResponse.json({ error: 'Missing Healthcare Company' }, { status: 400 });
    if (!visit_type || !urgency_level || !bc_selection_mode || !reason) {
      return NextResponse.json({ error: 'Missing required recommendation config fields' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let activePatientId = patient_id;

    // CREATE NEW PATIENT IF REQUESTED
    if (patient_id === 'new' && new_patient) {
      const { data: createdPatient, error: pErr } = await supabaseAdmin
        .from('patient')
        .insert({
           doctor_id,
           first_name: new_patient.first_name,
           last_name: new_patient.last_name,
           email: new_patient.email || null,
           phone: new_patient.phone || null,
           date_of_birth: new_patient.date_of_birth || null
        })
        .select('id')
        .single();
      
      if (pErr) throw new Error(`Failed to create patient: ${pErr.message}`);
      activePatientId = createdPatient.id;
    }

    if (!activePatientId || activePatientId === 'new') {
      return NextResponse.json({ error: 'Failed to establish patient record' }, { status: 400 });
    }

    // GENERATE CASE ID
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const generatedCaseId = `BLT-${year}-${random}`;

    // CREATE CASE
    const { data: newRecommendation, error: recommendationErr } = await supabaseAdmin
      .from('recommendation')
      .insert({
        id: generatedCaseId,
        doctor_id,
        patient_id: activePatientId,
        status: 'created',
        visit_type,
        urgency_level,
        bc_selection_mode,
        reason,
        admin_notes: admin_notes || null,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (recommendationErr) throw new Error(`Failed to create case: ${recommendationErr.message}`);

    // INSERT MATERIALS IF ANY
    if (materials && Array.isArray(materials) && materials.length > 0) {
       for (const matId of materials) {
         await supabaseAdmin.from('case_material').insert({
            recommendation_id: generatedCaseId,
            material_id: matId,
            quantity: 1
         });
       }
    }

    // TODO: 99Tests - removed 99Tests dependency
    // TRIGGER BROADCAST
    //   try {
    //   } catch(e) { console.error('Broadcast failed implicitly:', e); }
    // }

    // NOTIFY Doctor
    await createNotification({
      userId: doctor_id,
      type: 'case_update',
      title: 'Platform Generated Recommendation',
      message: `Admin has created recommendation ${generatedCaseId} on behalf of your organization.`,
      link: `/dashboard/recommendations/${generatedCaseId}`
    });

    // RETURN NEW ID
    return NextResponse.json({ success: true, recommendationId: generatedCaseId });

  } catch (err: any) {
    console.error("POST admin recommendation creation error:", err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
