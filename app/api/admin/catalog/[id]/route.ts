export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .select(`*, lab:lab_id(name)`)
 .eq('id', params.id)
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("GET admin catalog single error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
 const { sku, type, lab_id, included_parameters, ...otherFields } = body;

 // We can't let them change SKU, so omit it or check.
 // However, the rule says "SKU must be unique" on POST. Generally, we shouldn't change SKU, but if we do, check uniqueness
 if (sku) {
 const { data: existingSku } = await supabaseAdmin.from('tt_test_catalog').select('id').eq('sku', sku).neq('id', params.id).single();
 if (existingSku) {
 return NextResponse.json({ error: 'SKU is already in use by another test' }, { status: 400 });
 }
 }

 if (lab_id) {
 const { data: labExists } = await supabaseAdmin.from('tt_laboratory').select('id').eq('id', lab_id).single();
 if (!labExists) {
 return NextResponse.json({ error: 'Laboratory not found' }, { status: 400 });
 }
 }

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

 const updatePayload: any = { ...otherFields };
 if (sku) updatePayload.sku = sku;
 if (type) updatePayload.type = type;
 if (lab_id !== undefined) updatePayload.lab_id = lab_id;
 if (included_parameters !== undefined) {
 updatePayload.included_parameters = updatePayload.type === 'profile' ? included_parameters : null;
 }

 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .update(updatePayload)
 .eq('id', params.id)
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("PUT admin catalog error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

 const { data, error } = await supabaseAdmin
 .from('tt_test_catalog')
 .update({ is_active: false })
 .eq('id', params.id)
 .select()
 .single();

 if (error) throw error;

 return NextResponse.json(data);
 } catch (error: any) {
 console.error("DELETE admin catalog error:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
