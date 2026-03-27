export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { checkAndCreateSLANotifications } from '@/lib/notifications-helper';

export async function GET(request: Request) {
  try {
    const supabaseClient = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    if (user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Trigger automatic network SLA checks in the background upon active page retrieval
    await checkAndCreateSLANotifications();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: recommendations, error } = await supabaseAdmin
      .from('recommendation')
      .select(`
        id, status, urgency_level, bc_selection_mode, created_at,
        patient:patient_id ( first_name, last_name ),
        doctor_practice:doctor_id ( name ),
        case_application ( id, status, bc_id, blood_collector:bc_id ( first_name, last_name ) )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = (recommendations || []).map((c: any) => {
      const patient = c.patient as any;
      const hc = c.doctor_practice as any;
      const applications = c.case_application || [];
      const activeApp = applications.find((a: any) => ['accepted', 'booked'].includes(a.status));
      const bc = activeApp?.blood_collector as any;
      const applicationCount = applications.filter((a: any) => a.status !== 'withdrawn').length;

      return {
        id: c.id,
        status: c.status,
        urgency: c.urgency_level,
        mode: c.bc_selection_mode,
        createdAt: c.created_at,
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
        hcName: hc?.name || 'Unknown Doctor',
        assignedBcName: bc ? `${bc.first_name} ${bc.last_name}` : null,
        applicationCount
      };
    });

    return NextResponse.json({ recommendations: transformed });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
