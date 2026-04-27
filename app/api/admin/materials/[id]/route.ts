export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request, context: any) {
 const { params } = context;
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
 .from('tt_material')
 .select('*')
 .eq('id', params.id)
 .single();

 if (error) throw error;
 if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

 return NextResponse.json(data);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function PUT(request: Request, context: any) {
 const { params } = context;
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
 
 // Safety check code uniqueness if code changed
 if (body.code) {
 const { data: existingCode } = await supabaseAdmin.from('tt_material').select('id').eq('code', body.code).neq('id', params.id).single();
 if (existingCode) {
 return NextResponse.json({ error: 'Material Code is already in use by another item' }, { status: 400 });
 }
 }

 const { data, error } = await supabaseAdmin
 .from('tt_material')
 .update(body)
 .eq('id', params.id)
 .select()
 .single();

 if (error) throw error;
 return NextResponse.json(data);
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}

export async function DELETE(request: Request, context: any) {
  const { params } = context;
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
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      const { error } = await supabaseAdmin.from('tt_material').delete().eq('id', params.id);
      if (error) throw error;
      return NextResponse.json({ success: true, action: 'deleted' });
    } else {
      const { data, error } = await supabaseAdmin.from('tt_material').update({ is_active: false }).eq('id', params.id).select().single();
      if (error) throw error;
      return NextResponse.json({ success: true, action: 'deactivated' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
