export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create a service role client to bypass RLS issues
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request, { params }: { params: { id: string } }) {
 try {
 const recommendationId = params.id;
 if (!recommendationId) {
 return NextResponse.json({ error: 'Recommendation ID is required' }, { status: 400 });
 }

 const cookieStore = cookies();
 const supabaseClient = createServerClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 cookies: {
 get(name: string) {
 return cookieStore.get(name)?.value;
 },
 },
 }
 );

 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
 if (authError || !user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Verify ownership
 const { data: recommendationObj, error: caseError } = await supabaseAdmin
 .from('recommendation')
 .select('doctor_id')
 .eq('id', recommendationId)
 .single();

 if (caseError || !recommendationObj || recommendationObj.doctor_id !== user.id) {
 return NextResponse.json({ error: 'Recommendation not found or unauthorized' }, { status: 403 });
 }

 // Fetch applications joined with blood_collector
 const { data: applications, error: appsError } = await supabaseAdmin
 .from('case_application')
 .select(`
 id, status, applied_at, bc_message,
 blood_collector (
 id, first_name, last_name, qualification, rating, total_collections,
 special_experience, equipment, practice_fee, home_visit_fee, bio
 )
 `)
 .eq('recommendation_id', recommendationId)
 .order('applied_at', { ascending: false });

 if (appsError) {
 console.error('Error fetching applications in API route:', appsError);
 return NextResponse.json({ error: appsError.message }, { status: 500 });
 }

 return NextResponse.json({ applications, count: applications.length });
 } catch (error: any) {
 console.error('Unexpected error in /api/doctor/recommendations/[id]/applications:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
