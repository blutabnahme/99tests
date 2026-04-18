export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get doctor ID
    const { data: doctor } = await supabaseAdmin
      .from('tt_doctor')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Get private lab IDs this doctor can access
    let accessiblePrivateLabIds: string[] = [];
    if (doctor) {
      const { data: doctorLabs } = await supabaseAdmin
        .from('tt_doctor_laboratory')
        .select('laboratory_id')
        .eq('doctor_id', doctor.id);
      accessiblePrivateLabIds = (doctorLabs || []).map((dl: any) => dl.laboratory_id);
    }

    // Get all labs
    const { data: allLabs, error } = await supabaseAdmin
      .from('tt_laboratory')
      .select('id, name, is_private')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    // Filter: public labs + private labs the doctor has access to
    const visibleLabs = (allLabs || []).filter((lab: any) => {
      if (!lab.is_private) return true;
      return accessiblePrivateLabIds.includes(lab.id);
    });

    // Return without is_private field (doctor doesn't need to know)
    return NextResponse.json(visibleLabs.map(({ id, name }: any) => ({ id, name })));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
