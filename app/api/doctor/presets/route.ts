export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 const { data, error } = await supabaseAdmin
 .from('tt_doctor_preset')
 .select('*')
 .eq('doctor_id', doctor.id)
 .order('slot_number', { ascending: true });

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("GET doctor presets error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'doctor') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { slot_number, name, test_ids } = await request.json();
 if (slot_number === undefined || !name || !Array.isArray(test_ids)) {
 return NextResponse.json({ error: 'slot_number, name, and test_ids array are required' }, { status: 400 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
 if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

 // Upsert the preset slot
 const { data, error } = await supabaseAdmin
 .from('tt_doctor_preset')
 .upsert({
 doctor_id: doctor.id,
 slot_number,
 name,
 test_ids
 }, { onConflict: 'doctor_id, slot_number' })
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("PUT doctor presets error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
