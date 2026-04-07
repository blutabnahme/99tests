import { createServerSupabaseClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
 const supabase = createServerSupabaseClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 redirect("/login");
 }

 const role = user.user_metadata?.role;

 if (role === "doctor_practice") {
 redirect("/dashboard/notifications");
 } else if (role === "blood_collector") {
 redirect("/bc/notifications");
 } else if (role === "admin") {
 redirect("/admin/notifications");
 } else {
 // Fallback if role is unfamiliar
 redirect("/dashboard");
 }
}
