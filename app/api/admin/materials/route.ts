export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { searchParams } = new URL(request.url);
 const active_only = searchParams.get('active_only') !== 'false';

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 let query = supabaseAdmin
 .from('tt_material')
 .select('*');

 if (active_only) {
 query = query.eq('is_active', true);
 }

 const { data, error } = await query
 .order('sort_order', { ascending: true })
 .order('name', { ascending: true });

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("GET admin materials error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const supabaseClient = createServerSupabaseClient();
 const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

 if (authError || !user || user.user_metadata?.role !== 'admin') {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const body = await request.json();
 const { code, name, description, tube_type, tube_color, default_volume, default_unit, sort_order, is_active } = body;

 if (!code || !name) {
 return NextResponse.json({ error: 'Code and Name are required' }, { status: 400 });
 }

 // Verify code isn't taken
 const { data: existingCode } = await supabaseAdmin.from('tt_material').select('id').eq('code', code).single();
 if (existingCode) {
 return NextResponse.json({ error: 'Material Code is already in use' }, { status: 400 });
 }

 const { data, error } = await supabaseAdmin
 .from('tt_material')
 .insert({
 code, name, description, tube_type, tube_color, 
 default_volume: default_volume || null, 
 default_unit: default_unit || 'ml', 
 sort_order: sort_order || 0,
 is_active: is_active ?? true
 })
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("POST admin materials error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
