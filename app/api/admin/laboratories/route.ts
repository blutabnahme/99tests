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

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 const { searchParams } = new URL(request.url);
 const active_only = searchParams.get('active_only') !== 'false';

 let query = supabaseAdmin
 .from('tt_laboratory')
 .select('id, name, official_name, practice_name, slug, address_street, address_zip, address_city, address_country, contact_email, contact_phone, aisid, customer_number, is_active, is_private, ldt_config, pad_config, created_at');

 if (active_only) {
 query = query.eq('is_active', true);
 }

 const { data, error } = await query.order('name', { ascending: true });

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("GET admin laboratories error:", error);
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
 let { name, official_name, practice_name, slug, address_street, address_zip, address_city, address_country, contact_email, contact_phone, aisid, customer_number, ldt_config, pad_config, capabilities } = body;

 if (!name) {
 return NextResponse.json({ error: 'Name is required' }, { status: 400 });
 }

 if (!slug) {
 slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
 }

 const { data, error } = await supabaseAdmin
 .from('tt_laboratory')
 .insert({
 name, official_name, practice_name, slug, address_street, address_zip, address_city, address_country, contact_email, contact_phone, aisid, customer_number, ldt_config, pad_config, capabilities
 })
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("POST admin laboratories error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
