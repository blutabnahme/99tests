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
 const page = parseInt(searchParams.get('page') || '1', 10);
 const limit = parseInt(searchParams.get('limit') || '50', 10);
 const type = searchParams.get('type');
 const category = searchParams.get('category');
 const lab_id = searchParams.get('lab_id');
 const search = searchParams.get('search');
 const active_only = searchParams.get('active_only') !== 'false'; // default true

 const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 let query = supabaseAdmin.from('tt_test_catalog').select(`*, lab:lab_id(name)`, { count: 'exact' });

 if (active_only) {
 query = query.eq('is_active', true);
 }
 if (type && type.toLowerCase() !== 'all') {
 query = query.eq('type', type.toLowerCase());
 }
 if (category && category !== 'all') {
 query = query.eq('category', category);
 }
 if (lab_id && lab_id !== 'all') {
 query = query.eq('lab_id', lab_id);
 }
 if (search) {
 query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
 }

 const from = (page - 1) * limit;
 const to = from + limit - 1;

 const { data, count, error } = await query.order('name', { ascending: true }).range(from, to);

 if (error) throw error;

 return NextResponse.json({
 data: data || [],
 total: count || 0,
 page,
 limit
 });
 } catch (error: any) {
 console.error("GET admin catalog error:", error);
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
 const { sku, name, type, lab_id, included_parameters, ...otherFields } = body;

 if (!sku || !name || !type) {
 return NextResponse.json({ error: 'SKU, Name, and Type are required' }, { status: 400 });
 }

 // Verify SKU isn't taken
 const { data: existingSku } = await supabaseAdmin.from('tt_test_catalog').select('id').eq('sku', sku).single();
 if (existingSku) {
 return NextResponse.json({ error: 'SKU is already in use' }, { status: 400 });
 }

 // Verify Lab ID if provided
 if (lab_id) {
 const { data: labExists } = await supabaseAdmin.from('tt_laboratory').select('id').eq('id', lab_id).single();
 if (!labExists) {
 return NextResponse.json({ error: 'Laboratory not found' }, { status: 400 });
 }
 }

 // Verify included_parameters if profile
 if (type === 'profile' && Array.isArray(included_parameters) && included_parameters.length > 0) {
 const { data: validParams, error: paramErr } = await supabaseAdmin
 .from('tt_test_catalog')
 .select('id, type')
 .in('id', included_parameters);
 
 if (paramErr || !validParams || validParams.length !== included_parameters.length) {
 return NextResponse.json({ error: 'Some included parameters do not exist' }, { status: 400 });
 }
 
 const allAreParams = validParams.every(p => p.type === 'parameter');
 if (!allAreParams) {
 return NextResponse.json({ error: 'Profiles can only include parameters, not other profiles' }, { status: 400 });
 }
 }

 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .insert({
 sku,
 name,
 type,
 lab_id: lab_id || null,
 included_parameters: type === 'profile' ? (included_parameters || []) : null,
 ...otherFields
 })
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("POST admin catalog error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
