"use client";
import React from 'react';
import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import MobileHeader from '@/components/ui/MobileHeader';
import MobileSidebar from '@/components/ui/MobileSidebar';
import { DoctorSidebar } from '@/components/dashboard/DoctorSidebar';
import { BCSidebar } from '@/components/dashboard/BCSidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface MobileLayoutWrapperProps {
  sidebarType: 'hc' | 'bc' | 'admin';
  children: React.ReactNode;
}

const sidebars = {
  hc: DoctorSidebar,
  bc: BCSidebar,
  admin: AdminSidebar,
};

export default function MobileLayoutWrapper({ sidebarType, children }: MobileLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname() || '';
  const handleMenuToggle = useCallback(() => setSidebarOpen(prev => !prev), []);
  const handleClose = useCallback(() => setSidebarOpen(false), []);

  const SidebarComponent = sidebars[sidebarType];

  if (pathname.includes('/recommendations/new')) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F7F8] font-body text-near-black">

        <main className="flex-1 w-full bg-[#F7F7F8]">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F7F7F8] font-body text-near-black">
      <div className="desktop-sidebar">
        <SidebarComponent />
      </div>

      <MobileSidebar isOpen={sidebarOpen} onClose={handleClose}>
        <SidebarComponent onNavigate={handleClose} />
      </MobileSidebar>

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader onMenuToggle={handleMenuToggle} isOpen={sidebarOpen} />
        <main className="flex-1 p-6 lg:p-8 xl:p-12 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
