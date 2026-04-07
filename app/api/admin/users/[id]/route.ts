export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(request: Request, context: any) {
  const { params } = context;
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const body = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (type === 'doctor') {
      const { data, error } = await supabaseAdmin
        .from('tt_doctor')
        .update(body)
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (type === 'patient') {
      const { data, error } = await supabaseAdmin
        .from('tt_patient')
        .update(body)
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('PUT admin user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
