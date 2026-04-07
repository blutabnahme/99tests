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

    const { data, error } = await supabaseAdmin
      .from('tt_service_config')
      .select('*')
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('GET config error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

    // Only allow specific fields to be updated
    const allowedFields: Record<string, any> = {};
    const editable = ['service_fee_pct', 'vat_rate', 'shipping_standard', 'shipping_prio', 'shipping_express', 'shipping_gologistik', 'pvs_file_prefix', 'country_zone_mapping', 'doctor_billing_service_fee_pct'];

    for (const key of editable) {
      if (body[key] !== undefined) {
        allowedFields[key] = body[key];
      }
    }

    allowedFields.updated_at = new Date().toISOString();

    // Get the config row ID
    const { data: existing } = await supabaseAdmin
      .from('tt_service_config')
      .select('id')
      .limit(1)
      .single();

    if (!existing) throw new Error('Config not found');

    const { data, error } = await supabaseAdmin
      .from('tt_service_config')
      .update(allowedFields)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT config error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
