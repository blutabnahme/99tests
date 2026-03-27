"use client";

import { useEffect, useState } from "react";
import { Plus, Clock, Users, Search, FileText } from "lucide-react";
import Link from "next/link";
import { RecentCasesTable } from "@/components/dashboard/RecentRecommendationsTable";
import { useTranslations } from 'next-intl';
import { useDoctor } from "@/components/providers/DoctorProvider";

interface DashboardData {
  metrics: {
    total_recommendations: number;
    pending_results: number;
    active_patients: number;
  };
  recent_recommendations: any[];
}

export default function DoctorDashboardPage() {
  const { doctor } = useDoctor();
  const t = useTranslations('hc');
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/doctor/dashboard');
        if (!res.ok) throw new Error('Failed to load dashboard metrics');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="flex-1 min-w-0 w-full animate-in fade-in duration-300">
      <div className="mb-6 border-b border-gray-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
              Dashboard
            </h1>
            <p className="text-[14px] text-gray-500 m-0">
              {t('dashboard.welcome', { name: doctor?.practice_name || "Doctor", fallback: `Welcome back, ${doctor?.practice_name || 'Doctor'}` })}
            </p>
          </div>
          <Link 
            href="/dashboard/recommendations/new"
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-full px-5 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Recommendation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard 
              icon={<Clock />} 
              label="Total Recommendations" 
              value={data?.metrics.total_recommendations || 0} 
            />
            <MetricCard 
              icon={<Search />} 
              label="Pending Results" 
              value={data?.metrics.pending_results || 0} 
            />
            <MetricCard 
              icon={<Users />} 
              label="Active Patients" 
              value={data?.metrics.active_patients || 0} 
              variant="success" 
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <RecentCasesTable recommendations={data?.recent_recommendations || []} />
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, variant = 'default' }: any) {
  const isSuccess = variant === 'success';
  return (
    <div className="bg-white rounded-[16px] p-4 sm:p-5 lg:p-6 border border-gray-200 flex flex-col justify-center min-w-0 transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5 ${
          isSuccess ? 'bg-[#008085]/10 text-[#008085] border border-[#008085]/20' : 'bg-gray-50 text-primary border border-gray-100'
        }`}>
          {icon}
        </div>
      </div>
      <div className="font-heading text-[28px] lg:text-[36px] font-medium text-near-black tracking-tight leading-none mb-1.5">
        {value}
      </div>
      <div className="font-body text-[13px] lg:text-[14px] font-medium text-gray-500">
        {label}
      </div>
    </div>
  );
}
