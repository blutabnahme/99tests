"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  FolderOpen,
  CreditCard,
  Users,
  Settings,
  Droplet,
  BarChart3,
  LogOut,
  Bell,
  MessageCircle,
  FileText
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations } from 'next-intl';

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string, email: string } | null>(null);
  const { unreadCount } = useNotifications();
  const t = useTranslations('nav');

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserProfile({ name: "Platform Admin", email: session.user.email || "admin@99tests.de" });
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const items = [
    { icon: LayoutDashboard, label: t('overview'), href: "/admin" },
    { icon: Bell, label: t('notifications'), href: "/admin/notifications", badge: unreadCount },
    { icon: ShieldCheck, label: t('verifications'), href: "/admin/verifications" },
    { icon: FolderOpen, label: t('recommendations'), href: "/admin/recommendations" },
    { icon: CreditCard, label: t('financial'), href: "/admin/financial" },
    { icon: BarChart3, label: t('insights'), href: "/admin/insights" },
    { icon: Users, label: t('users'), href: "/admin/users" },
    { icon: MessageCircle, label: "FAQ", href: "/admin/faq" },
    { icon: FileText, label: "Templates", href: "/admin/templates" },
    { icon: Settings, label: t('configuration'), href: "/admin/config" },
  ];

  return (
    <aside className="w-full lg:w-[260px] bg-white lg:border-r border-gray-200 flex flex-col shrink-0 h-full lg:h-screen lg:sticky lg:top-0">
      <div className="hidden lg:flex p-6 pb-4 mb-3 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="99Tests" className="h-8 w-auto" />
        </div>
      </div>
      


      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 pt-0 lg:pt-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const isHovered = hover === i;

          return (
            <Link
              key={i}
              href={item.href}
              onClick={() => onNavigate?.()}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-[6px] transition-all duration-150 font-body text-[14px] font-medium ${
                isActive 
                  ? "bg-[#008085]/[0.06] text-[#008085]" 
                  : isHovered 
                    ? "bg-[#008085]/[0.03] text-[#008085]" 
                    : "text-[#6E7280] bg-transparent"
              }`}
            >
              <Icon 
                className={`w-5 h-5 ${isActive ? "text-[#008085]" : "text-[#6E7280] transition-colors"}`} 
                strokeWidth={2}
              />
              <div className="flex items-center gap-2 flex-1">
                <span>
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex items-center justify-center bg-red-500 text-white text-[11px] font-bold h-5 min-w-[20px] rounded-full px-1.5 shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 mt-auto shrink-0">
        <div className="flex items-center gap-3 px-4 py-2.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-open-bg flex items-center justify-center shrink-0">
            <ShieldCheck className="w-[18px] h-[18px] text-primary-dark" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-near-black truncate">Platform Admin</div>
            <div className="text-[13px] text-gray-500 truncate">{userProfile?.email || "Loading..."}</div>
          </div>
        </div>
        <button
          onClick={() => { onNavigate?.(); handleLogout(); }}
          disabled={isLoggingOut}
          className="w-full text-gray-500 hover:text-near-black hover:bg-gray-50 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Signing out..." : t('signOut')}
        </button>
      </div>
    </aside>
  );
}
