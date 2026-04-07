import { redirect } from "next/navigation";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import MobileLayoutWrapper from "@/components/ui/MobileLayoutWrapper";
import { DoctorProvider } from "@/components/providers/DoctorProvider";

export default async function DashboardLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const supabase = createServerSupabaseClient();
 const { data: { session } } = await supabase.auth.getSession();
 
 if (!session) {
 redirect("/login");
 }

 const role = session.user.user_metadata?.role;

 if (role === 'admin') {
 redirect("/admin");
 }

 let doctorProfile = null;

 if (role === 'doctor' || role === 'doctor_practice') {
 const { data: profile, error } = await supabaseAdmin
 .from('tt_doctor')
 .select('*')
 .eq('user_id', session.user.id)
 .single();

 if (error || !profile) {
 console.error("Dashboard Guard Error: Missing profile for user", session.user.id);
 redirect("/login?error=Profile configuration missing. Please contact support.");
 }
 doctorProfile = profile;
 }

 return (
 <DoctorProvider doctorProfile={doctorProfile}>
 <MobileLayoutWrapper sidebarType={role === 'blood_collector' ? 'bc' : 'hc'}>
 {children}
 </MobileLayoutWrapper>
 </DoctorProvider>
 );
}
