import MobileLayoutWrapper from "@/components/ui/MobileLayoutWrapper";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileLayoutWrapper sidebarType="admin">
      {children}
    </MobileLayoutWrapper>
  );
}
