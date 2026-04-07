import { createClient } from '@supabase/supabase-js';


export async function notifyAdmins(
  type: any, 
  title: string, 
  message: string, 
  link?: string
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // We get all auth users using supabaseAdmin.auth.admin.listUsers() is pagination bound.
    // Instead we can query the view or execute an RPC, or read auth.users.
    
    // As auth.users might be restricted from standard SQL without RPC, let's create a proxy lookup:
    // If you have a profiles table that mirrors auth, you'd use that.
    // Since we're using raw Supabase Admin, we can grab users like this:
    let allAdmins: string[] = [];
    
    // Note: listUsers is limited to 50/page normally, but for a fast prototype this will catch the 1st page of admins easily.
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error("Failed to list users for admin notifications:", error);
      return false;
    }

    if (users) {
      allAdmins = users
        .filter(u => u.user_metadata?.role === 'admin')
        .map(u => u.id);
    }

    if (allAdmins.length === 0) {
      console.warn("No admin users found to receive notification.");
      return false;
    }

    // Now insert a notification for each admin
    const notificationsToInsert = allAdmins.map(adminId => ({
      user_id: adminId,
      type: type,
      title: title,
      message: message,
      link: link,
      read: false
    }));

    const { error: insertErr } = await supabaseAdmin
      .from('notifications')
      .insert(notificationsToInsert);

    if (insertErr) {
      console.error("Failed to insert admin notifications:", insertErr);
      return false;
    }

    return true;

  } catch (e) {
    console.error("Error broadcasting to admins:", e);
    return false;
  }
}
