import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendNotificationParams {
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(params: SendNotificationParams) {
  // Check if user has this notification type enabled
  const { data: pref } = await supabaseAdmin
    .from('tt_notification_preference')
    .select('enabled')
    .eq('user_id', params.userId)
    .eq('notification_type', params.notificationType)
    .maybeSingle();

  // If preference exists and is disabled, skip
  if (pref && !pref.enabled) return null;

  // Create notification
  const { data, error } = await supabaseAdmin
    .from('tt_notification')
    .insert({
      user_id: params.userId,
      type: params.notificationType,
      title: params.title,
      message: params.message,
      notification_type: params.notificationType,
      reference_id: params.referenceId || null,
      reference_type: params.referenceType || null,
      metadata: params.metadata || {},
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[NOTIFICATION] Failed to create:', error);
    return null;
  }

  return data;
}

export async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  if (data?.users) {
    return data.users
      .filter(u => u.user_metadata?.role === 'admin')
      .map(u => u.id);
  }
  return [];
}
