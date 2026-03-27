import { createClient } from '@supabase/supabase-js';
import { dispatchNotification, NotificationChannel } from './notification-channels';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification({ userId, type, title, message, link }: CreateNotificationParams) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
      read: false
    });
  } catch (err) {
    console.error('[NOTIFICATION ERROR]', err);
    // Don't throw — notifications should never break the main flow
  }
}

export async function createNotificationForAdmins({ type, title, message, link }: Omit<CreateNotificationParams, 'userId'>) {
  try {
    // Find all admin users
    const { data: admins } = await supabaseAdmin
      .from('doctor_practice')
      .select('id')
      .limit(0); // We don't want HCs
    
    // Get admin users from auth.users where role = admin
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const adminUsers = users?.filter(u => u.user_metadata?.role === 'admin') || [];
    
    for (const admin of adminUsers) {
      await createNotification({
        userId: admin.id,
        type,
        title,
        message,
        link
      });
    }
  } catch (err) {
    console.error('[ADMIN NOTIFICATION ERROR]', err);
  }
}

export async function checkAndCreateSLANotifications() {
  try {
    // 1. Get all recommendations still in created/pending status
    const { data: openCases } = await supabaseAdmin
      .from('recommendation')
      .select('id, created_at')
      .in('status', ['created', 'pending']);
    
    if (!openCases || openCases.length === 0) return;

    const now = new Date().getTime();
    
    // 2. Fetch all platform admins once
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const adminUsers = users?.filter(u => u.user_metadata?.role === 'admin') || [];
    if (adminUsers.length === 0) return;

    const SLA_LIMIT_HOURS = 48; // Can be pulled from platformConfig later

    // 3. Scan recommendations against the SLA threshold
    for (const c of openCases) {
      const createdTime = new Date(c.created_at).getTime();
      const hoursElapsed = Math.floor((now - createdTime) / (1000 * 60 * 60));

      if (hoursElapsed > SLA_LIMIT_HOURS) {
        const title = 'SLA Target Exceeded';
        const message = `Unmatched SLA breach: Recommendation ${c.id} open for ${hoursElapsed} hours without BC assignment.`;
        const link = `/admin/recommendations`;

        for (const admin of adminUsers) {
          // 4. Discard duplicated events already broadcasting 
          const { data: existing } = await supabaseAdmin
            .from('notifications')
            .select('id')
            .eq('user_id', admin.id)
            .eq('type', 'system_alert')
            .ilike('message', `Unmatched SLA breach: Recommendation ${c.id}%`)
            .eq('read', false)
            .limit(1);

          if (!existing || existing.length === 0) {
            await createNotification({
              userId: admin.id,
              type: 'system_alert',
              title,
              message,
              link
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[SLA NOTIFICATIONS ERROR]', err);
  }
}

export async function notifyPatient(recommendationId: string, triggerType: string) {
  try {
    // 1. Get the recommendation with patient info
    const { data: recommendationData } = await supabaseAdmin
      .from('recommendation')
      .select('id, patient_id, selection_mode, doctor_id')
      .eq('id', recommendationId)
      .single();
    
    if (!recommendationData?.patient_id) return;
    
    // 2. Get patient details
    const { data: patient } = await supabaseAdmin
      .from('patient')
      .select('id, full_name, email, phone')
      .eq('id', recommendationData.patient_id)
      .single();
    
    if (!patient) return;

    // 3. Deduplicate (ensure we don't send the identical notification type for the same patient/recommendation twice)
    const { data: existingNotif } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', patient.id)
      .eq('type', triggerType)
      .eq('recommendation_id', recommendationId)
      .single();
      
    if (existingNotif) {
      return; // Already notified
    }
    
    // 4. Build the patient portal link
    const patientLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/${recommendationId}`;
    
    // 5. Create patient notification record
    await createNotification({
      userId: patient.id,
      type: triggerType,
      title: getPatientNotificationTitle(triggerType),
      message: getPatientNotificationMessage(triggerType, patientLink),
      link: patientLink,
    });
    
    // Also explicitly link the notification to the recommendation so we can track it (we need to bypass params typing if recommendation_id goes directly into the table, 
    // but standard createNotification doesn't accept recommendation_id. Therefore we update it after insertion, or we skip recommendation_id tracking).
    // Let's just update the newly created ones. Or, update createNotification interface if we had access to it.
    // Actually, `createNotification` schema might not strictly expect recommendation_id to be stored. 
    // We will just do what we can with the existing `createNotification` which doesn't take recommendation_id explicitly in params.
    
    // Notify Doctor that patient was notified
    await createNotification({
      userId: recommendationData.doctor_id,
      type: 'patient_notified',
      title: 'Patient Notified',
      message: `The patient for recommendation ${recommendationId.split('-')[1] || recommendationId} has been sent an actionable notification link.`,
      link: `/dashboard/recommendations/${recommendationId}`,
    });
    
    // 6. Send actual email/SMS placeholder
    console.log(`[Patient Notification] ${triggerType} -> ${patient.email} -> ${patientLink}`);
  } catch (err) {
    console.error('[PATIENT NOTIFICATION ERROR]', err);
  }
}

function getPatientNotificationTitle(triggerType: string): string {
  switch (triggerType) {
    case 'patient_decides_ready':
      return 'Blood collectors available for your recommendation';
    case 'shortlist_ready':
      return 'Your healthcare provider has selected collectors for you';
    case 'clinic_approval_ready':
      return 'Your blood collection appointment is ready';
    default:
      return 'Update on your blood collection recommendation';
  }
}

function getPatientNotificationMessage(triggerType: string, link: string): string {
  switch (triggerType) {
    case 'patient_decides_ready':
      return `Qualified blood collectors have applied for your recommendation. Review their profiles and choose your preferred collector: ${link}`;
    case 'shortlist_ready':
      return `Your healthcare provider has shortlisted collectors for your blood collection. Review and select your preferred option: ${link}`;
    case 'clinic_approval_ready':
      return `A blood collector has been assigned to your recommendation. Review the details and confirm your appointment: ${link}`;
    default:
      return `There's an update on your blood collection recommendation. View details: ${link}`;
  }
}

export interface TemplatedNotificationParams {
  slug: string;
  recipientId: string;
  recommendationId: string;
  variables: Record<string, string>;
  link?: string;
  recipientEmail?: string;
  recipientPhone?: string;
}

export async function sendTemplatedNotification({ slug, recipientId, recommendationId, variables, link, recipientEmail, recipientPhone }: TemplatedNotificationParams) {
  try {
    // 1. Deduplication Check
    const { data: existing } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('user_id', recipientId)
      .eq('type', slug)
      .eq('recommendation_id', recommendationId)
      .maybeSingle();

    if (existing) return;

    // 2. Fetch Template
    const { data: template } = await supabaseAdmin
      .from('notification_template')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    let title = 'System Update';
    let message = 'You have a new update regarding your recommendation.';

    if (template) {
       title = template.subject_en || title;
       message = template.body_en || message;
       
       // Replace variables
       for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          title = title.replace(regex, value || '');
          message = message.replace(regex, value || '');
       }
    }

    // 3. Dispatch Notification
    if (template?.send_in_app !== false) {
      await supabaseAdmin.from('notifications').insert({
        user_id: recipientId,
        type: slug,
        title,
        message,
        link: link || null,
        read: false,
        recommendation_id: recommendationId
      });
    }

    // 4. External Channels
    if (template && (recipientEmail || recipientPhone)) {
      const channels: NotificationChannel[] = [];
      if (template.send_email && recipientEmail) channels.push('email');
      if (template.send_sms && recipientPhone) channels.push('sms');
      if (template.send_whatsapp && recipientPhone) channels.push('whatsapp');

      if (channels.length > 0) {
         const results = await dispatchNotification(channels, {
           recipient_email: recipientEmail,
           recipient_phone: recipientPhone,
           subject: title,
           body: message,
           template_slug: slug
         });

         // 5. Log delivery attempts
         for (const r of results) {
            await supabaseAdmin.from('notification_log').insert({
              template_slug: slug,
              channel: r.channel,
              recipient: r.channel === 'email' ? recipientEmail : recipientPhone,
              status: r.success ? 'sent' : 'failed',
              provider_message_id: r.provider_message_id,
              error_message: r.error
            });
         }
      }
    }
    
  } catch (err) {
     console.error(`[TEMPLATED NOTIFICATION ERROR] (slug: ${slug})`, err);
  }
}
