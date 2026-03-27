export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { action, bcId } = await req.json();

    if (action === 'release_single' && bcId) {
       // Release payouts for single BC
       const { error } = await supabaseAdmin
         .from('payment')
         .update({ payout_status: 'released', paid_at: new Date().toISOString() })
         .eq('bc_id', bcId)
         .eq('payout_status', 'confirmed');
       if (error) throw error;
       return NextResponse.json({ success: true });
    }

    if (action === 'release_all') {
       // Release ALL confirmed payouts globally
       const { error } = await supabaseAdmin
         .from('payment')
         .update({ payout_status: 'released', paid_at: new Date().toISOString() })
         .eq('payout_status', 'confirmed');
       if (error) throw error;
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
