export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/lib/notifications';

// Use service role to bypass RLS for background processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // 1. Fetch appointments scheduled between now and 24 hours from now
    // Wait, let's establish timeframes for markers
    // Window A: 24h reminder (e.g. 23.5h to 24.5h from now)
    // Window B: 2h reminder (e.g. 1.5h to 2.5h from now)
    
    // To prevent duplicate sends, we could add 'reminders_sent' to the appointment table, 
    // but for this V1, let's just query appointments where scheduled_at is roughly looking like that.
    
    // For a reliable cron that runs hourly, we check appointments starting between:
    const now = new Date();
    
    // 24 Hour Window (23h to 24h 59m from now)
    const twentyFourHoursStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const twentyFourHoursEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    // 2 Hour Window (1h to 2h 59m from now)
    const twoHoursStart = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const twoHoursEnd = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Fetch potential 24h appointments
    const { data: apts24h } = await supabaseAdmin
      .from('appointment')
      .select('*, recommendation(id, patient(*))')
      .eq('status', 'scheduled')
      .gte('scheduled_at', twentyFourHoursStart.toISOString())
      .lte('scheduled_at', twentyFourHoursEnd.toISOString());

    // Fetch potential 2h appointments
    const { data: apts2h } = await supabaseAdmin
      .from('appointment')
      .select('*, recommendation(id, patient(*))')
      .eq('status', 'scheduled')
      .gte('scheduled_at', twoHoursStart.toISOString())
      .lte('scheduled_at', twoHoursEnd.toISOString());


    // Process 24h Notifications
    if (apts24h) {
      for (const apt of apts24h) {
        // Technically we need the user IDs for patient. In schema, `patient` table corresponds to auth.users `id`.
        // Notify BC
        await createNotification(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          apt.bc_id,
          'appointment_reminder',
          'Upcoming Appointment (24h)',
          `Reminder: You have an appointment for recommendation ${apt.recommendation_id.split('-')[1]} in 24 hours.`,
          `/bc/dashboard/recommendations/${apt.recommendation_id}`
        );

        // Notify Patient
        await createNotification(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          apt.patient_id,
          'appointment_reminder',
          'Upcoming Blood Draw (24h)',
          `Reminder: Your blood collection appointment is scheduled for tomorrow.`,
          `/patient/${apt.recommendation_id}`
        );
      }
    }

    // Process 2h Notifications
    if (apts2h) {
      for (const apt of apts2h) {
        // Notify BC
        await createNotification(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          apt.bc_id,
          'appointment_reminder',
          'Appointment Starting Soon (2h)',
          `Reminder: Your appointment for recommendation ${apt.recommendation_id.split('-')[1]} starts in 2 hours.`,
          `/bc/dashboard/recommendations/${apt.recommendation_id}`
        );

        // Notify Patient
        await createNotification(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          apt.patient_id,
          'appointment_reminder',
          'Your Collector is arriving soon',
          `Reminder: Your blood collection appointment starts in 2 hours.`,
          `/patient/${apt.recommendation_id}`
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed24h: apts24h?.length || 0,
      processed2h: apts2h?.length || 0
    });

  } catch (error: any) {
    console.error("Cron Reminder Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
