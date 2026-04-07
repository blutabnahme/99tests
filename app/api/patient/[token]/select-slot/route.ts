export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(
 request: Request,
 { params }: { params: { token: string } }
) {
 try {
 const recommendationId = params.token;
 
 // Auth validation
 const { data: recommendationData, error: caseError } = await supabaseAdmin
 .from('recommendation')
 .select('patient_id, status')
 .eq('id', recommendationId)
 .single();

 if (caseError || !recommendationData) {
 return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 });
 }

 const patientId = recommendationData.patient_id;
 const body = await request.json();
 const { application_id, slot_id } = body;

 // Fetch slot
 const { data: slot, error: slotError } = await supabaseAdmin
 .from('bc_proposed_slots')
 .select('*')
 .eq('id', slot_id)
 .single();

 if (slotError || !slot) {
 return NextResponse.json({ success: false, error: 'Slot not found' }, { status: 404 });
 }

 if (slot.status !== 'proposed' || slot.case_application_id !== application_id) {
 return NextResponse.json({ success: false, error: 'Slot cannot be selected' }, { status: 400 });
 }

 // Fetch application
 const { data: application, error: appError } = await supabaseAdmin
 .from('case_application')
 .select('recommendation_id, bc_id')
 .eq('id', application_id)
 .single();

 if (appError || !application || application.recommendation_id !== recommendationId) {
 return NextResponse.json({ success: false, error: 'Application not found or invalid' }, { status: 404 });
 }

 // Update selected slot
 await supabaseAdmin
 .from('bc_proposed_slots')
 .update({ status: 'accepted' })
 .eq('id', slot_id);

 // Release other slots for this application
 await supabaseAdmin
 .from('bc_proposed_slots')
 .update({ status: 'released' })
 .match({ case_application_id: application_id, status: 'proposed' })
 .neq('id', slot_id);

 // Update recommendation
 await supabaseAdmin
 .from('recommendation')
 .update({ status: 'pending_payment' })
 .eq('id', application.recommendation_id);

 // Update case_application
 await supabaseAdmin
 .from('case_application')
 .update({ scheduling_status: 'scheduled' })
 .eq('id', application_id);

 // Free other BCs slots since patient made final selection
 // TODO: 99Tests - removed 99Tests dependency

 return NextResponse.json({ success: true, slot, application });

 } catch (err: any) {
 console.error('Error in select-slot:', err);
 return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
 }
}
