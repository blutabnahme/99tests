"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardList, FileText, Stethoscope, User, LogOut
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { PatientCtx } from '@/lib/patient-context';

const NAV_ITEMS = [
  { label: 'My Tests', href: '/portal', icon: ClipboardList },
  { label: 'Results', href: '/portal/results', icon: FileText },
  { label: 'My Doctors', href: '/portal/doctors', icon: Stethoscope },
  { label: 'Profile', href: '/portal/profile', icon: User },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Skip auth for login and verify pages
  const isAuthPage = pathname === '/portal/login' || pathname === '/portal/verify';

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    async function checkSession() {
      try {
        const res = await fetch('/api/portal/auth/session');
        const data = await res.json();

        if (!data.authenticated) {
          router.replace('/portal/login');
          return;
        }

        setPatient(data.patient);
      } catch {
        router.replace('/portal/login');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [pathname, isAuthPage]);

  const handleLogout = async () => {
    await fetch('/api/portal/auth/session', { method: 'DELETE' });
    router.replace('/portal/login');
  };

  // Auth pages get no layout wrapper
  if (isAuthPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PatientCtx.Provider value={{ patient, loading }}>
      <div className="min-h-screen bg-[#FAFAF9]">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-5">
            {/* Top bar */}
            <div className="py-3.5 flex items-center justify-between">
              <Link href="/portal" className="flex items-center">
                <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[12px] shrink-0 aspect-square">
                  {patient?.first_name?.[0]}{patient?.last_name?.[0] || ''}
                </div>
                <span className="text-[14px] text-gray-600 hidden sm:block">
                  {patient?.first_name} {patient?.last_name}
                </span>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab navigation */}
            <nav className="flex gap-1 -mb-px overflow-x-auto">
              {NAV_ITEMS.map(item => {
                const isActive = pathname === item.href || (item.href !== '/portal' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-5xl mx-auto px-5 py-6 lg:py-8">
          {children}
        </main>
      </div>
    </PatientCtx.Provider>
  );
}
