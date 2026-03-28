"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Receipt,
  Banknote,
  User,
  Settings,
  Droplet,
  LogOut,
  Bell
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations } from 'next-intl';

export function BCSidebar({ onNavigate }: { onNavigate?: () => void }) {
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
      if (!session) return;
      
      const { data } = await supabase.from('blood_collector').select('first_name, last_name, contact_email').eq('id', session.user.id).single();
      if (data) {
        setUserProfile({ name: `${data.first_name} ${data.last_name}`, email: data.contact_email });
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
    { icon: LayoutDashboard, label: t('overview'), href: "/bc" },
    { icon: Bell, label: t('notifications'), href: "/bc/notifications", badge: unreadCount },
    { icon: CalendarDays, label: t('schedule'), href: "/bc/calendar" },
    { icon: Receipt, label: t('opportunities'), href: "/bc/opportunities" },
    { icon: Banknote, label: t('earnings'), href: "/bc/earnings" },
    { icon: User, label: t('profile'), href: "/bc/profile" },
    { icon: Settings, label: t('settings'), href: "/bc/settings" },
  ];

  return (
    <aside className="w-full lg:w-[260px] bg-white lg:border-r border-gray-200 flex flex-col shrink-0 h-full lg:h-screen lg:sticky lg:top-0">
      {/* Logo and Notifications */}
      <div className="hidden lg:flex p-6 pb-4 mb-3 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 pt-0 lg:pt-2">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/bc" && pathname.startsWith(item.href));
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

      {/* Bottom Profile Placeholder */}
      <div className="p-4 border-t border-gray-100 mt-auto shrink-0">
        <div className="flex items-center gap-3 px-4 py-2.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-steel-50 flex items-center justify-center shrink-0">
            <span className="font-heading text-[14px] font-medium text-steel-600">
              {userProfile?.name ? userProfile.name.split(' ').map((n: string)=>n[0]).join('').substring(0, 2).toUpperCase() : "BC"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-medium text-near-black truncate">{userProfile?.name || t('loading')}</div>
            <div className="text-[13px] text-gray-500 truncate">{t('bloodCollector')}</div>
          </div>
        </div>
        <button
          onClick={() => { onNavigate?.(); handleLogout(); }}
          disabled={isLoggingOut}
          className="w-full text-gray-500 hover:text-near-black hover:bg-gray-50 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? t('signingOut') : t('signOut')}
        </button>
      </div>
    </aside>
  );
}
