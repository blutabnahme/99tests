export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
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

    const { data: doctor } = await supabaseAdmin
      .from('tt_doctor')
      .select('custom_doctor_billing_fee_pct')
      .eq('user_id', user.id)
      .single();

    const { data: config } = await supabaseAdmin
      .from('tt_service_config')
      .select('doctor_billing_service_fee_pct')
      .limit(1)
      .single();

    const fee_pct = doctor?.custom_doctor_billing_fee_pct ?? config?.doctor_billing_service_fee_pct ?? 10;

    return NextResponse.json({ fee_pct });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
