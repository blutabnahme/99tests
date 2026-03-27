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
    // 1. Verify Doctor owns this recommendation
    const { data: c, error: cErr } = await supabaseAdmin
      .from('recommendation')
      .select('id, doctor_id')
      .eq('id', recommendationId)
      .eq('doctor_id', hcUserId)
      .single();

    if (cErr || !c) return NextResponse.json({ error: 'Recommendation not found or unauthorized' }, { status: 403 });

    // 2. Update payment record
    const { error: pErr } = await supabaseAdmin
      .from('payment')
      .update({
        doctor_confirmed_at: new Date().toISOString(),
        payout_status: 'confirmed',
      })
      .eq('recommendation_id', recommendationId)
      .eq('payout_status', 'pending_confirmation');
      
    if (pErr) throw new Error('Failed to update payment status');

    // 3. Notify BC and Admin (Hooks left as placeholder pending template implementation extension)
    // await sendTemplatedNotification({ slug: 'payout_confirmed', recipientId: bc_id, ... })

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
