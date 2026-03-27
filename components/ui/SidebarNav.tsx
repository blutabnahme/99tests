"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
}

export function SidebarNav({ items, adminName = "Admin", adminRole = "Platform Administrator" }: { items: NavItem[], adminName?: string, adminRole?: string }) {
  const t = useTranslations();
  const tc = useTranslations('common');
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <aside className="w-[260px] bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 h-screen sticky top-0">
      <div className="px-6 pt-6 pb-3 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c0 0-7.5 7.5-7.5 12a7.5 7.5 0 1 0 15 0C19.5 9.5 12 2 12 2z"/></svg>
        </div>
        <span className="font-heading font-medium text-[17px] tracking-tight text-near-black">
          99Tests<span className="text-primary">.de</span>
        </span>
      </div>
      <div className="px-6 pb-6">
        <span className="rounded-pill text-[10px] font-bold px-2.5 py-1 bg-burnt-500/10 text-burnt-500 shadow-sm border border-burnt-500/20">
          {tc("admin")}
        </span>
      </div>
      <nav className="flex-1 px-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === i;
          return (
            <Link
              key={i}
              href={item.href}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-input mb-0.5 transition-all text-[14px] ${
                item.active 
                  ? "bg-primary/5 text-primary font-semibold" 
                  : isHovered 
                    ? "bg-gray-50 text-near-black font-medium" 
                    : "bg-transparent text-near-black font-medium"
              }`}
            >
              <Icon className={`w-5 h-5 ${item.active ? "text-primary" : "text-gray-500"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-near-black">{adminName}</div>
            <div className="text-[11px] text-gray-500">{adminRole}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
