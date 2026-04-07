export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
 try {
 const { searchParams } = new URL(request.url);
 const email = searchParams.get('email');

 if (!email) {
 return NextResponse.json({ error: "Missing email parameter" }, { status: 400 });
 }

 // Bypass RLS to find the patient across the platform
 const { data: patient, error } = await supabaseAdmin
 .from('patient')
 .select('*')
 .eq('contact_email', email)
 .single();

 if (error || !patient) {
 // It's perfectly normal for a patient not to exist yet
 return NextResponse.json({ found: false }, { status: 200 });
 }

 return NextResponse.json({ 
 found: true,
 patient: {
 firstName: patient.first_name,
 lastName: patient.last_name,
 dob: patient.date_of_birth,
 gender: patient.gender,
 email: patient.contact_email,
 phone: patient.phone,
 address: patient.address,
 insuranceType: patient.insurance_type,
 guardianNames: patient.guardian_names
 }
 });

 } catch (error: any) {
 console.error("Patient Search Error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
