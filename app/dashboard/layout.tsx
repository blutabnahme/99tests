import { BCSidebar } from "@/components/dashboard/BCSidebar";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import MobileLayoutWrapper from "@/components/ui/MobileLayoutWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const role = session?.user?.user_metadata?.role;

  return (
    <MobileLayoutWrapper sidebarType={role === 'blood_collector' ? 'bc' : 'hc'}>
      {children}
    </MobileLayoutWrapper>
  );
}
