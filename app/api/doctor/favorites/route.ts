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
      .from('tt_doctor_favorite')
      .select('test_id')
      .eq('doctor_id', doctor.id);

    if (error) throw error;

    return NextResponse.json(data.map(f => f.test_id));
  } catch (error: any) {
    console.error("GET doctor favorites error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_id } = await request.json();
    if (!test_id) return NextResponse.json({ error: 'test_id is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { error } = await supabaseAdmin
      .from('tt_doctor_favorite')
      .insert({ doctor_id: doctor.id, test_id });

    // Handle duplicate violations gracefully
    if (error && error.code !== '23505') throw error; 

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST doctor favorites error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user || user.user_metadata?.role !== 'doctor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { test_id } = await request.json();
    if (!test_id) return NextResponse.json({ error: 'test_id is required' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: doctor } = await supabaseAdmin.from('tt_doctor').select('id').eq('user_id', user.id).single();
    if (!doctor) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 });

    const { error } = await supabaseAdmin
      .from('tt_doctor_favorite')
      .delete()
      .eq('doctor_id', doctor.id)
      .eq('test_id', test_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE doctor favorites error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
