export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/admin-notifications';
import { sendNotification } from '@/lib/notifications';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();

    if (action === 'notify_admins') {
      const { type, title, message, link } = payload;
      
      const success = await notifyAdmins(type, title, message, link);
      
      if (!success) {
        return NextResponse.json({ error: "Failed to broadcast to admins" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'notify_patient_shortlist') {
      const { recommendationId } = payload;
      const { data: c } = await supabaseAdmin.from('recommendation').select('patient_id').eq('id', recommendationId).single();
      
      if (c?.patient_id) {
        // Technically, patient is in auth.users, so we can notify them.
        await sendNotification({
          userId: c.patient_id,
          notificationType: 'shortlist_ready',
          title: 'Your Collector Shortlist is Ready',
          message: `Your healthcare provider has reviewed candidates for recommendation ${recommendationId.split('-')[1]}. Tap here to choose your blood collector.`,
          metadata: { route: `/patient/${recommendationId}` } // Note: usually token, but using recommendationId as placeholder depending on setup
        });
      }
      return NextResponse.json({ success: true });
    }

 return NextResponse.json({ error: "Unknown action" }, { status: 400 });

 } catch (err: any) {
 console.error("Internal Webhook Error:", err);
 return NextResponse.json({ error: err.message }, { status: 500 });
 }
}
