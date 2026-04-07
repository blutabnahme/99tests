export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Using Service Role to bypass RLS for direct updates, though RLS policies
// could be configured to allow BCs/Patients to update their respective fields.
const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
 request: Request,
 { params }: { params: { id: string } }
) {
 const { id } = params;
 const { role, isCompleted } = await request.json(); // role: 'bc' | 'patient'

 if (!id || !role) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 try {
 const updateData: any = {};
 if (role === 'bc') {
 updateData.bc_checklist_completed = isCompleted;
 } else if (role === 'patient') {
 updateData.patient_checklist_completed = isCompleted;
 } else {
 return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
 }

 const { data, error } = await supabaseAdmin
 .from('appointment')
 .update(updateData)
 .eq('id', id)
 .select('bc_checklist_completed, patient_checklist_completed, status')
 .single();

 if (error) throw error;

 // Transition logic: If both checklists are completed, the appointment can be considered
 // 'ready_for_collection' or 'in_progress'. The request specifies it proceeds to 'in progress'.
 // We will update the status to 'in_progress' if both are true AND it's currently 'scheduled'.
 
 if (data.bc_checklist_completed && data.patient_checklist_completed && data.status === 'scheduled') {
 await supabaseAdmin.from('appointment').update({ status: 'in_progress' }).eq('id', id);
 data.status = 'in_progress';
 } else if ((!data.bc_checklist_completed || !data.patient_checklist_completed) && data.status === 'in_progress') {
 // Fallback if someone unchecks after the fact
 await supabaseAdmin.from('appointment').update({ status: 'scheduled' }).eq('id', id);
 data.status = 'scheduled';
 }

 return NextResponse.json({ success: true, appointment: data });

 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
