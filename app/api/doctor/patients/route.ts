import { NextResponse } from 'next/server';
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['doctor', 'doctor_practice'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Doctor profile missing' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Build query
    let query = supabaseAdmin
      .from('tt_patient')
      .select(`
        *,
        recommendations:tt_recommendation(count)
      `)
      .eq('doctor_id', doc.id);

    // If search param exists, ilike on first_name, last_name, email
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Order by last_name, first_name
    query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;

    // Transform count from [{count:X}] array output format into a flat number
    const formattedData = data.map(patient => ({
      ...patient,
      recommendation_count: Array.isArray(patient.recommendations) ? patient.recommendations[0]?.count || 0 : 0
    }));

    return NextResponse.json({ patients: formattedData });

  } catch (err: any) {
    console.error('Fetch Patients Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve patients' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !['doctor', 'doctor_practice'].includes(session.user.user_metadata?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doc } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (!doc) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();

    // Required fields: first_name, last_name, date_of_birth, gender
    if (!body.first_name || !body.last_name || !body.date_of_birth || !body.gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPatient = {
      doctor_id: doc.id,
      first_name: body.first_name,
      last_name: body.last_name,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      salutation: body.salutation || null,
      email: body.email || null,
      phone: body.phone || null,
      is_minor: body.is_minor || false,
      guardian_salutation: body.guardian_salutation || null,
      guardian_first_name: body.guardian_first_name || null,
      guardian_last_name: body.guardian_last_name || null,
      address_line1: body.address_line1 || null,
      address_line2: body.address_line2 || null,
      address_city: body.address_city || null,
      address_state: body.address_state || null,
      address_zip: body.address_zip || null,
      address_country: body.address_country || 'Deutschland',
      insured_status: body.insured_status || null,
      family_doctor: body.family_doctor || null,
      observations: body.observations || null
    };

    const { data, error } = await supabaseAdmin
      .from('tt_patient')
      .insert([newPatient])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ patient: data });
  } catch (err: any) {
    console.error('Create Patient Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create patient' }, { status: 500 });
  }
}
