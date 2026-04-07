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

 // 1. All recommendations with related data
 const { data: recommendations, error: casesError } = await supabaseAdmin
 .from('recommendation')
 .select('id, status, created_at, urgency_level, bc_selection_mode, estimated_fees, doctor_id, patient_id')
 .order('created_at', { ascending: false });
 console.log('[INSIGHTS DEBUG] recommendations:', recommendations?.length, 'error:', casesError);

 // 2. All recommendation applications (for matching performance metrics)
 const { data: applications, error: applicationsError } = await supabaseAdmin
 .from('case_application')
 .select('id, recommendation_id, bc_id, status, applied_at, scheduling_status, is_flexible')
 .order('applied_at', { ascending: false });
 console.log('[INSIGHTS DEBUG] applications:', applications?.length, 'error:', applicationsError);

 // 3. All payments
 const { data: payments, error: paymentsError } = await supabaseAdmin
 .from('payment')
 .select('id, patient_amount, status, created_at, recommendation_id, bc_payout, platform_commission, vat_amount, paid_at')
 .order('created_at', { ascending: false });
 console.log('[INSIGHTS DEBUG] payments:', payments?.length, 'error:', paymentsError);

 // 4. All appointments
 const { data: appointments, error: appointmentsError } = await supabaseAdmin
 .from('appointment')
 .select('id, recommendation_id, application_id, status, scheduled_at, created_at')
 .order('created_at', { ascending: false });
 console.log('[INSIGHTS DEBUG] appointments:', appointments?.length, 'error:', appointmentsError);

 // 5. Active HCs and BCs counts
 const { count: activeHCs } = await supabaseAdmin
 .from('doctor_practice')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'active');

 const { count: activeBCs } = await supabaseAdmin
 .from('blood_collector')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'active');

 const { count: pendingHCs } = await supabaseAdmin
 .from('doctor_practice')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'pending');

 const { count: pendingBCs } = await supabaseAdmin
 .from('blood_collector')
 .select('id', { count: 'exact', head: true })
 .eq('status', 'pending');

 // 6. Refunds
 const { data: refunds } = await supabaseAdmin
 .from('refund')
 .select('id, amount, status, created_at')
 .order('created_at', { ascending: false });

 return NextResponse.json({
 recommendations: recommendations || [],
 applications: applications || [],
 payments: payments || [],
 appointments: appointments || [],
 refunds: refunds || [],
 userCounts: {
 activeHCs: activeHCs || 0,
 activeBCs: activeBCs || 0,
 pendingHCs: pendingHCs || 0,
 pendingBCs: pendingBCs || 0
 }
 });

 } catch (err: any) {
 console.error("GET admin insights error:", err);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}
