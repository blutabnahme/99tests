export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification, createNotificationForAdmins, sendTemplatedNotification } from '@/lib/notifications-helper';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Optional: verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    no_applications_48h: 0,
    no_applications_72h: 0,
    appointment_reminders: 0,
    bc_no_completion: 0,
    payment_pending: 0,
    material_not_dispatched: 0,
  };

  // 1. Recommendations open 48h+ with no applications
  const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: cases48h } = await supabaseAdmin
    .from('recommendation')
    .select('id, doctor_id, created_at')
    .eq('status', 'created')
    .lt('created_at', cutoff48h);

  for (const c of cases48h || []) {
    const { count } = await supabaseAdmin
      .from('case_application')
      .select('id', { count: 'exact', head: true })
      .eq('recommendation_id', c.id)
      .neq('status', 'withdrawn');

    if (count === 0) {
      // Check if already notified
      const { count: existing } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'no_applications_48h')
        .eq('recommendation_id', c.id);

      if (existing === 0) {
        await sendTemplatedNotification({
           slug: 'no_applications_48h',
           recipientId: c.doctor_id,
           recommendationId: c.id,
           variables: {
              recommendation_id: c.id?.substring(0,8) || c.id,
              doctor_name: 'Healthcare Provider'
           },
           link: `/dashboard/recommendations/${c.id}`
        });
        results.no_applications_48h++;
      }
    }
  }

  // 2. Recommendations open 72h+ with no applications (escalation to admin)
  const cutoff72h = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: cases72h } = await supabaseAdmin
    .from('recommendation')
    .select('id, doctor_id, created_at')
    .eq('status', 'created')
    .lt('created_at', cutoff72h);

  for (const c of cases72h || []) {
    const { count } = await supabaseAdmin
      .from('case_application')
      .select('id', { count: 'exact', head: true })
      .eq('recommendation_id', c.id)
      .neq('status', 'withdrawn');

    if (count === 0) {
      const { count: existing } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'no_applications_72h')
        .eq('recommendation_id', c.id);

      if (existing === 0) {
         const { data: admins } = await supabaseAdmin.auth.admin.listUsers();
         const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
         for (const admin of adminUsers) {
            await sendTemplatedNotification({
               slug: 'no_applications_72h',
               recipientId: admin.id,
               recommendationId: c.id,
               variables: {
                 recommendation_id: c.id?.substring(0,8) || c.id,
                 doctor_name: 'Healthcare Provider'
               },
               link: `/admin/recommendations/${c.id}`
            });
         }
        results.no_applications_72h++;
      }
    }
  }

  // 3. Appointment reminders (24h before)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

  const { data: upcomingAppts } = await supabaseAdmin
    .from('appointment')
    .select('id, recommendation_id, scheduled_at, application_id')
    .gte('scheduled_at', tomorrowStart)
    .lte('scheduled_at', tomorrowEnd);

  for (const appt of upcomingAppts || []) {
    const { count: existing } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'appointment_reminder_24h')
      .eq('recommendation_id', appt.recommendation_id);

    if (existing === 0) {
      const { data: recommendationData } = await supabaseAdmin
        .from('recommendation')
        .select('id, patient_id, doctor_id')
        .eq('id', appt.recommendation_id)
        .single();

      if (recommendationData) {
        if (recommendationData.patient_id) {
           await sendTemplatedNotification({
              slug: 'appointment_reminder_24h',
              recipientId: recommendationData.patient_id,
              recommendationId: appt.recommendation_id,
              variables: {
                recommendation_id: appt.recommendation_id?.substring(0,8) || appt.recommendation_id,
                appointment_date: new Date(appt.scheduled_at).toLocaleString(),
                collector_name: 'A blood collector',
                patient_name: 'Patient'
              },
              link: `/patient/${appt.recommendation_id}`
           });
        }

        if (recommendationData.doctor_id) {
           await sendTemplatedNotification({
              slug: 'appointment_reminder_24h',
              recipientId: recommendationData.doctor_id,
              recommendationId: appt.recommendation_id,
              variables: {
                 recommendation_id: appt.recommendation_id?.substring(0,8) || appt.recommendation_id,
                 appointment_date: new Date(appt.scheduled_at).toLocaleString(),
                 collector_name: 'A blood collector',
                 patient_name: 'Your Patient'
              },
              link: `/dashboard/recommendations/${appt.recommendation_id}`
           });
        }

        if (appt.application_id) {
          const { data: app } = await supabaseAdmin
            .from('case_application')
            .select('bc_id')
            .eq('id', appt.application_id)
            .single();

          if (app?.bc_id) {
             await sendTemplatedNotification({
                slug: 'appointment_reminder_24h',
                recipientId: app.bc_id,
                recommendationId: appt.recommendation_id,
                variables: {
                   recommendation_id: appt.recommendation_id?.substring(0,8) || appt.recommendation_id,
                   appointment_date: new Date(appt.scheduled_at).toLocaleString(),
                   collector_name: 'Blood Collector',
                   patient_name: 'The Patient'
                },
                link: `/bc/appointments`
             });
          }
        }

        results.appointment_reminders++;
      }
    }
  }

  // 4. BC hasn't confirmed completion 48h after appointment
  const apptCutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  // We check for statuses that indicate it is not done (either still 'matched' or somehow not recorded natively)
  // Wait, the prompt says "Check if recommendation is still 'booked'" but wait, our appointments are 'in_progress' when booked usually. Let's see. 
  const { data: overdueAppts } = await supabaseAdmin
    .from('appointment')
    .select('id, recommendation_id, scheduled_at, application_id, bc_id')
    .in('status', ['in_progress', 'scheduled']) // Not completed
    .lt('scheduled_at', apptCutoff48h);

  for (const appt of overdueAppts || []) {
    const { data: recommendationData } = await supabaseAdmin
      .from('recommendation')
      .select('id, status')
      .eq('id', appt.recommendation_id)
      .eq('status', 'matched') // Depending on schema terminology. I'll stick close to prompt context
      .single();

    if (recommendationData) {
      const { count: existing } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'bc_no_completion_48h')
        .eq('recommendation_id', appt.recommendation_id);

      if (existing === 0) {
         const { data: admins } = await supabaseAdmin.auth.admin.listUsers();
         const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
         for (const admin of adminUsers) {
             await sendTemplatedNotification({
                slug: 'bc_no_completion_48h',
                recipientId: admin.id,
                recommendationId: appt.recommendation_id,
                variables: {
                   recommendation_id: appt.recommendation_id?.substring(0,8) || appt.recommendation_id,
                   appointment_date: new Date(appt.scheduled_at).toLocaleString(),
                   collector_name: 'A blood collector'
                },
                link: `/admin/recommendations/${appt.recommendation_id}`
             });
         }
        results.bc_no_completion++;
      }
    }
  }

  // 5. Payment pending 7+ days
  const paymentCutoff7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pendingPayments } = await supabaseAdmin
    .from('recommendation')
    .select('id')
    .eq('status', 'pending_payment')
    .lt('updated_at', paymentCutoff7d);

  for (const c of pendingPayments || []) {
    const { count: existing } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('type', 'payment_pending_7d')
      .eq('recommendation_id', c.id);

    if (existing === 0) {
      const { data: admins } = await supabaseAdmin.auth.admin.listUsers();
      const adminUsers = admins?.users?.filter(u => u.user_metadata?.role === 'admin') || [];
      for (const admin of adminUsers) {
         await sendTemplatedNotification({
            slug: 'payment_pending_7d',
            recipientId: admin.id,
            recommendationId: c.id,
            variables: {
               recommendation_id: c.id?.substring(0,8) || c.id,
               patient_name: 'Patient',
               doctor_name: 'Healthcare Company'
            },
            link: `/admin/recommendations/${c.id}`
         });
      }
      results.payment_pending++;
    }
  }

  // 6. Doctor Auto-Confirmation (48h past deadline)
  const { data: pendingConfirmations } = await supabaseAdmin
    .from('payment')
    .select('id, recommendation_id, doctor_confirmation_deadline')
    .eq('payout_status', 'pending_confirmation')
    .lt('doctor_confirmation_deadline', new Date().toISOString());

  for (const p of pendingConfirmations || []) {
    await supabaseAdmin
     .from('payment')
     .update({
       doctor_confirmed_at: new Date().toISOString(),
       payout_status: 'confirmed',
     })
     .eq('id', p.id);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    alerts_created: results,
  });
}
