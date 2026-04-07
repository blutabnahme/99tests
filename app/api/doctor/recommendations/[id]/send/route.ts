export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request, { params }: { params: { id: string } }) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { id } = params;

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data: rec } = await supabaseAdmin.from('tt_recommendation').select('status, id, patient_id').eq('id', id).eq('doctor_id', doctor.id).single();
 if (!rec) return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
 if (rec.status !== 'created') return NextResponse.json({ error: 'Can only send recommendations that are in the created status' }, { status: 400 });

 // Generate unique patient token
 const generatedToken = crypto.randomUUID();
 const expiresAt = new Date();
 expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

 // Insert into tt_patient_token
 const { error: tokenError } = await supabaseAdmin
 .from('tt_patient_token')
 .insert({
 token: generatedToken,
 recommendation_id: id,
 patient_id: rec.patient_id,
 expires_at: expiresAt.toISOString(),
 });
 
 if (tokenError) throw tokenError;

 // Construct the magic link URL
 const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
 const magicLink = `${appUrl}/patient/${generatedToken}`;

 const { error } = await supabaseAdmin
 .from('tt_recommendation')
 .update({
 status: 'sent',
 sent_at: new Date().toISOString(),
 magic_link: magicLink
 })
 .eq('id', id)
 .eq('doctor_id', doctor.id);

 if (error) throw error;

 // TODO: Trigger email notification to patient here

 return NextResponse.json({ success: true, message: 'Recommendation sent successfully', magic_link: magicLink });
 } catch (error: any) {
 console.error(`POST doctor recommendation send ${params.id} error:`, error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
