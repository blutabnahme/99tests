import { NextResponse } from 'next/server';
import { createServerSupabaseClient, supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

 // Ensure the patient belongs to the logged-in doctor
 const { data: patient, error } = await supabaseAdmin
 .from('tt_patient')
 .select(`
 *,
 recommendations:tt_recommendation (
 id, display_id, status, created_at,
 items:tt_recommendation_item ( unit_price, quantity )
 )
 `)
 .eq('id', params.id)
 .eq('doctor_id', doc.id)
 .single();

 if (error || !patient) {
 return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
 }

 return NextResponse.json({ patient });
 } catch (err: any) {
 console.error('Fetch Patient Error:', err);
 return NextResponse.json({ error: 'Failed to retrieve patient' }, { status: 500 });
 }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

 // Verify patient ownership first
 const { data: verifyPatient } = await supabaseAdmin
 .from('tt_patient')
 .select('id')
 .eq('id', params.id)
 .eq('doctor_id', doc.id)
 .single();

 if (!verifyPatient) {
 return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
 }

 const body = await request.json();

 const updateFields = {
 first_name: body.first_name,
 last_name: body.last_name,
 date_of_birth: body.date_of_birth,
 gender: body.gender,
 salutation: body.salutation,
 email: body.email,
 phone: body.phone,
 is_minor: body.is_minor,
 guardian_salutation: body.guardian_salutation,
 guardian_first_name: body.guardian_first_name,
 guardian_last_name: body.guardian_last_name,
 address_line1: body.address_line1,
 address_line2: body.address_line2,
 address_city: body.address_city,
 address_state: body.address_state,
 address_zip: body.address_zip,
 address_country: body.address_country,
 insured_status: body.insured_status,
 family_doctor: body.family_doctor,
 observations: body.observations
 };

 // Filter undefined values precisely
 const cleanFields = Object.fromEntries(Object.entries(updateFields).filter(([_, v]) => v !== undefined));

 const { data, error } = await supabaseAdmin
 .from('tt_patient')
 .update(cleanFields)
 .eq('id', params.id)
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json({ patient: data });
 } catch (err: any) {
 console.error('Update Patient Error:', err);
 return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
 }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

 // Verify patient ownership
 const { data: verifyPatient } = await supabaseAdmin
 .from('tt_patient')
 .select('id')
 .eq('id', params.id)
 .eq('doctor_id', doc.id)
 .single();

 if (!verifyPatient) {
 return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 });
 }

 // Check dependency constraints (Recommendations)
 const { count: recCount } = await supabaseAdmin
 .from('tt_recommendation')
 .select('*', { count: 'exact', head: true })
 .eq('patient_id', params.id);

 if (recCount && recCount > 0) {
 return NextResponse.json({ error: 'Cannot delete patient with existing recommendations' }, { status: 400 });
 }

 const { error: delError } = await supabaseAdmin
 .from('tt_patient')
 .delete()
 .eq('id', params.id);

 if (delError) {
 throw delError;
 }

 return NextResponse.json({ success: true });
 } catch (err: any) {
 console.error('Delete Patient Error:', err);
 return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
 }
}
