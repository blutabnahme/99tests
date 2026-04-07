export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request, { params }: { params: { id: string } }) {
 const supabase = createServerSupabaseClient();
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const hcUserId = session.user.id;
 const recommendationId = params.id;

 try {
 const { issue_type, description } = await req.json();

 if (!issue_type || !description) {
 return NextResponse.json({ error: 'Missing dispute parameters' }, { status: 400 });
 }

 // 1. Verify Doctor owns this recommendation
 const { data: c, error: cErr } = await supabaseAdmin
 .from('recommendation')
 .select('id, doctor_id')
 .eq('id', recommendationId)
 .eq('doctor_id', hcUserId)
 .single();

 if (cErr || !c) return NextResponse.json({ error: 'Recommendation not found or unauthorized' }, { status: 403 });

 // 2. Log dispute on payment record
 const { error: pErr } = await supabaseAdmin
 .from('payment')
 .update({
 payout_status: 'disputed',
 dispute_reason: issue_type,
 dispute_description: description,
 dispute_at: new Date().toISOString(),
 })
 .eq('recommendation_id', recommendationId)
 .eq('payout_status', 'pending_confirmation');
 
 if (pErr) throw new Error('Failed to lock payment state');

 // 3. Admin & BC Notifications 
 // Trigger formal dispute alarms notifying both parties internally.
 
 return NextResponse.json({ success: true });

 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
