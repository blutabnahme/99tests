export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
 try {
 const supabase = await createServerSupabaseClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { data: hc, error } = await supabaseAdmin
 .from('doctor_practice')
 .select('*')
 .eq('id', user.id)
 .single();

 if (error || !hc) {
 return NextResponse.json({ error: 'Forbidden. No healthcare company found.' }, { status: 403 });
 }

 return NextResponse.json({ hc });

 } catch (error) {
 console.error('[DOCTOR_SETTINGS_GET] Error:', error);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}

export async function PATCH(request: Request) {
 try {
 const supabase = await createServerSupabaseClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Verify Doctor existence
 const { data: existingHc, error: checkError } = await supabaseAdmin
 .from('doctor_practice')
 .select('id')
 .eq('id', user.id)
 .single();

 if (checkError || !existingHc) {
 return NextResponse.json({ error: 'Forbidden. No healthcare company found.' }, { status: 403 });
 }

 const body = await request.json();
 const { name, contact_email, phone, address, type } = body;

 const updates: Record<string, any> = {};
 if (name !== undefined) updates.name = name;
 if (contact_email !== undefined) updates.contact_email = contact_email;
 if (phone !== undefined) updates.phone = phone;
 if (address !== undefined) updates.address = address;
 if (type !== undefined) updates.type = type;

 if (Object.keys(updates).length === 0) {
 return NextResponse.json({ error: 'No fields provided for update.' }, { status: 400 });
 }

 const { data: updatedData, error: updateError } = await supabaseAdmin
 .from('doctor_practice')
 .update(updates)
 .eq('id', user.id)
 .select()
 .single();

 if (updateError) throw updateError;

 return NextResponse.json({ hc: updatedData });

 } catch (error) {
 console.error('[DOCTOR_SETTINGS_PATCH] Error:', error);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}
