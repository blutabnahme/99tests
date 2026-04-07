export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
 request: Request,
 { params }: { params: { token: string } }
) {
 try {
 const recommendationId = params.token;

 const { data: recommendationData, error: caseError } = await supabaseAdmin
 .from('recommendation')
 .select('patient_id')
 .eq('id', recommendationId)
 .single();

 if (caseError || !recommendationData) {
 return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 });
 }

 const body = await request.json();
 const { application_id, message } = body;

 if (!message || message.length > 200) {
 return NextResponse.json({ success: false, error: 'Message must be between 1 and 200 characters' }, { status: 400 });
 }

 // Verify application belongs to the recommendation
 const { data: appData, error: appError } = await supabaseAdmin
 .from('case_application')
 .select('recommendation_id')
 .eq('id', application_id)
 .single();

 if (appError || !appData || appData.recommendation_id !== recommendationId) {
 return NextResponse.json({ success: false, error: 'Application not found or invalid' }, { status: 404 });
 }

 const { error: updateError } = await supabaseAdmin
 .from('case_application')
 .update({
 scheduling_message: message,
 scheduling_status: 'failed'
 })
 .eq('id', application_id);

 if (updateError) {
 return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
 }

 return NextResponse.json({ success: true });

 } catch (err: any) {
 console.error('Error in scheduling-message:', err);
 return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
 }
}
