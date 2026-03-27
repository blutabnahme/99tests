import { createClient } from "@supabase/supabase-js";

// Make sure to use the service role key for backend operations if required,
// but for simple create operations, the standard client might suffice if called directly,
// however we will define this helper to accept a generic supabase client so it can be 
// used in both Route Handlers and Server Actions

export type NotificationType = 
  | 'new_opportunity'
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'case_update'
  | 'shortlist_ready'
  | 'appointment_reminder'
  | 'payment_received'
  | 'system_alert';

export async function createNotification(
  supabaseUrl: string,
  supabaseKey: string,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
      read: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw new Error(error.message);
  }

  return data;
}
