"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Bell,
  FlaskConical,
  Building2,
  Package,
  ClipboardList,
  ShoppingCart,
  Users,
  Euro,
  BarChart3,
  Settings,
  HelpCircle,
  FileOutput,
  Receipt,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations } from 'next-intl';

// ============================================================
// TYPES
// ============================================================

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  badge?: number;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: any;
  children: SidebarItem[];
}

type SidebarEntry = SidebarItem | SidebarGroup;

function isGroup(entry: SidebarEntry): entry is SidebarGroup {
  return 'children' in entry;
}

// ============================================================
// COMPONENT
// ============================================================

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
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

  // ============================================================
  // SIDEBAR STRUCTURE
  // ============================================================

  const entries: SidebarEntry[] = [
    // Ungrouped top-level items
    { icon: LayoutDashboard, label: t('overview'), href: "/admin" },
    { icon: Bell, label: t('notifications'), href: "/admin/notifications", badge: unreadCount },
    { icon: ClipboardList, label: "Recommendations", href: "/admin/recommendations" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
    { icon: Receipt, label: "Invoices", href: "/admin/invoices" },
    { icon: ShieldCheck, label: "Verifications", href: "/admin/verifications" },

    // Tests group
    {
      id: 'tests',
      label: 'Tests',
      icon: FlaskConical,
      children: [
        { icon: FlaskConical, label: "Catalog", href: "/admin/catalog" },
        { icon: Building2, label: "Laboratories", href: "/admin/laboratories" },
        { icon: Package, label: "Materials", href: "/admin/materials" },
      ],
    },

    // Exports group
    {
      id: 'exports',
      label: 'Exports',
      icon: FileOutput,
      children: [
        { icon: FileOutput, label: "PAD Export", href: "/admin/exports/pad" },
      ],
    },

    // Analytics group
    {
      id: 'analytics',
      label: t('insights'),
      icon: BarChart3,
      children: [
        { icon: Euro, label: t('financial'), href: "/admin/financial" },
        { icon: BarChart3, label: t('insights'), href: "/admin/insights" },
      ],
    },

    // Management group
    {
      id: 'management',
      label: 'Management',
      icon: Settings,
      children: [
        { icon: Users, label: t('users'), href: "/admin/users" },
        { icon: Settings, label: t('configuration'), href: "/admin/config" },
        { icon: HelpCircle, label: "FAQ", href: "/admin/faq" },
      ],
    },
  ];

  // ============================================================
  // COLLAPSED STATE — auto-expand groups with active child
  // ============================================================

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // On mount + pathname change: expand groups that contain the active route
  useEffect(() => {
    const newCollapsed: Record<string, boolean> = {};
    for (const entry of entries) {
      if (isGroup(entry)) {
        const hasActiveChild = entry.children.some(
          child => pathname === child.href || pathname.startsWith(child.href + '/')
        );
        // If a child is active, force expand. Otherwise keep current state.
        if (hasActiveChild) {
          newCollapsed[entry.id] = false;
        } else if (collapsed[entry.id] === undefined) {
          // Default: collapsed
          newCollapsed[entry.id] = true;
        } else {
          newCollapsed[entry.id] = collapsed[entry.id];
        }
      }
    }
    setCollapsed(prev => ({ ...prev, ...newCollapsed }));
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ============================================================
  // RENDER HELPERS
  // ============================================================

  const renderItem = (item: SidebarItem, isChild: boolean = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
    const hoverKey = item.href;
    const isHovered = hover === hoverKey;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => onNavigate?.()}
        onMouseEnter={() => setHover(hoverKey)}
        onMouseLeave={() => setHover(null)}
        className={`flex items-center gap-3 px-4 py-2 rounded-[6px] transition-colors duration-150 font-body text-[14px] font-medium ${
          isChild ? 'pl-11' : ''
        } ${
          isActive
            ? "bg-[#008085]/[0.06] text-[#008085]"
            : isHovered
            ? "bg-[#008085]/[0.03] text-[#008085]"
            : "text-[#6E7280] bg-transparent"
        }`}
      >
        {!isChild && (
          <Icon
            className={`w-5 h-5 shrink-0 ${isActive ? "text-[#008085]" : "text-[#6E7280] transition-colors"}`}
            strokeWidth={2}
          />
        )}
        <div className="flex items-center gap-2 flex-1">
          <span>{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span className="flex items-center justify-center bg-red-500 text-white text-[11px] font-bold h-5 min-w-[20px] rounded-full px-1.5 shrink-0">
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  const renderGroup = (group: SidebarGroup) => {
    const Icon = group.icon;
    const isOpen = !collapsed[group.id];
    const hasActiveChild = group.children.some(
      child => pathname === child.href || pathname.startsWith(child.href + '/')
    );
    const isHovered = hover === `group-${group.id}`;

    return (
      <div key={group.id}>
        {/* Group header */}
        <button
          onClick={() => toggleGroup(group.id)}
          onMouseEnter={() => setHover(`group-${group.id}`)}
          onMouseLeave={() => setHover(null)}
          className={`w-full flex items-center gap-3 px-4 py-2 rounded-[6px] transition-colors duration-150 font-body text-[14px] font-medium ${
            hasActiveChild
              ? "text-[#008085]"
              : isHovered
              ? "bg-[#008085]/[0.03] text-[#008085]"
              : "text-[#6E7280] bg-transparent"
          }`}
        >
          <Icon
            className={`w-5 h-5 shrink-0 ${hasActiveChild ? "text-[#008085]" : "text-[#6E7280] transition-colors"}`}
            strokeWidth={2}
          />
          <span className="flex-1 text-left">{group.label}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9CA3AF] shrink-0" />
          )}
        </button>

        {/* Children */}
        {isOpen && (
          <div className="mt-0.5 space-y-0.5">
            {group.children.map(child => renderItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside className="w-full lg:w-[260px] bg-white lg:border-r border-gray-200 flex flex-col shrink-0 h-full lg:h-screen lg:sticky lg:top-0">
      {/* Logo */}
      <div className="hidden lg:flex p-6 pb-4 mb-3 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2 pt-0 lg:pt-2">
        {entries.map((entry, i) => {
          if (isGroup(entry)) {
            return renderGroup(entry);
          }
          return renderItem(entry);
        })}
      </nav>

      {/* Footer */}
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
