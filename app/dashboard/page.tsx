"use client";

import { useEffect, useState } from "react";
import { Plus, Users, FileText, LayoutList, LayoutGrid, X, Search, Inbox, FileEdit, Send, CreditCard, Truck, Syringe, FlaskConical, FileCheck } from "lucide-react";
import Link from "next/link";
import { RecentCasesTable } from "@/components/dashboard/RecentRecommendationsTable";
import { useTranslations } from 'next-intl';
import { useDoctor } from "@/components/providers/DoctorProvider";
import { useRouter } from "next/navigation";

// Define logical mapped pipeline steps
const PIPELINE_STEPS = [
  { id: 'created', label: 'Draft', matches: ['created'], icon: FileEdit },
  { id: 'sent', label: 'Sent', matches: ['sent'], icon: Send },
  { id: 'paid', label: 'Paid', matches: ['paid'], icon: CreditCard },
  { id: 'shipped', label: 'Shipped', matches: ['preparing', 'kit_shipped'], icon: Truck },
  { id: 'collecting', label: 'Collecting', matches: ['collection_organized', 'awaiting_collection'], icon: Syringe },
  { id: 'at_lab', label: 'At Lab', matches: ['returning_to_lab', 'at_lab'], icon: FlaskConical },
  { id: 'results', label: 'Results', matches: ['results_ready', 'completed'], icon: FileCheck }
];

interface DashboardData {
  metrics: {
    total_recommendations: number;
    active_patients: number;
    status_counts: Record<string, number>;
  };
  recent_recommendations: any[];
}

export default function DoctorDashboardPage() {
  const { doctor } = useDoctor();
  const t = useTranslations('hc');
  const router = useRouter();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'pipeline' | 'kanban'>('pipeline');
  const [activeFilter, setActiveFilter] = useState<string | 'all'>('all');

  // Load view mode from local storage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard_view_mode');
    if (saved === 'kanban') setViewMode('kanban');
  }, []);

  const toggleViewMode = (mode: 'pipeline' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('dashboard_view_mode', mode);
  };

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

  // Filter recommendations based on active pipeline node
  const filteredRecommendations = data?.recent_recommendations?.filter(rec => {
    if (activeFilter === 'all') return true;
    const step = PIPELINE_STEPS.find(s => s.id === activeFilter);
    if (!step) return true;
    return step.matches.includes(rec.status);
  }) || [];

  return (
    <div className="flex-1 min-w-0 w-full animate-in fade-in duration-300">
      
      {/* Header Area */}
      <div className="mb-8 border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-2">
            Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
             <p className="text-[14px] text-gray-500 m-0">
               {t('dashboard.welcome', { name: doctor?.practice_name || "Doctor", fallback: `Welcome back, ${doctor?.practice_name || 'Doctor'}` })}
             </p>
             {data && (
                <div className="flex items-center gap-2">
                   <span className="hidden sm:inline text-gray-300">•</span>
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {data.metrics.active_patients} Patients</span>
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {data.metrics.total_recommendations} Recommendations</span>
                </div>
             )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start">
          <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
             <button onClick={() => toggleViewMode('pipeline')} className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${viewMode === 'pipeline' ? 'bg-white shadow-sm text-primary border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <LayoutList className="w-4 h-4" />
             </button>
             <button onClick={() => toggleViewMode('kanban')} className={`w-8 h-8 rounded shrink-0 flex items-center justify-center transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary border border-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>
                <LayoutGrid className="w-4 h-4" />
             </button>
          </div>
          <Link 
            href="/dashboard/recommendations/new"
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-[10px] px-5 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
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
          {viewMode === 'pipeline' ? (
             <div className="space-y-8">
                
                {/* Pipeline Bar Feature */}
                <div className="overflow-x-auto hide-scrollbar pb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
                   <div className="min-w-[800px] flex items-center justify-between relative">
                      <button 
                         onClick={() => setActiveFilter('all')}
                         className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${activeFilter === 'all' ? 'bg-gray-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                         All
                      </button>
                      <div className="flex items-center justify-between flex-1 ml-6 relative">
                         {/* Connecting Line Map */}
                         <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0 pointer-events-none"></div>

                         {PIPELINE_STEPS.map((step) => {
                           const count = data?.metrics.status_counts[step.id === 'results' ? 'results_ready' : step.id] || 0;
                           const isActive = activeFilter === step.id;
                           const hasItems = count > 0;
                           
                           return (
                              <button 
                                key={step.id} 
                                onClick={() => setActiveFilter(step.id)}
                                className={`relative z-10 flex flex-col items-center justify-center w-24 h-20 rounded-[16px] border transition-all ${isActive ? 'bg-[#005C5F] border-[#005C5F] text-white shadow-md scale-105' : hasItems ? 'bg-primary border-primary text-white hover:bg-[#007074] shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
                              >
                                 <span className={`text-[11px] uppercase tracking-wide font-bold mb-1 opacity-90`}>{step.label}</span>
                                 <span className={`text-[24px] font-medium leading-none ${isActive || hasItems ? 'text-white' : 'text-gray-800'}`}>{count}</span>
                                 {isActive && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#005C5F] rounded-full"></div>}
                              </button>
                           );
                         })}
                      </div>
                   </div>
                </div>

                {/* Recent Cases Table */}
                <div className="grid grid-cols-1 gap-6">
                   <RecentCasesTable 
                      recommendations={filteredRecommendations} 
                      activeFilter={activeFilter}
                      filterLabel={PIPELINE_STEPS.find(s => s.id === activeFilter)?.label}
                      onClearFilter={() => setActiveFilter('all')}
                   />
                </div>

             </div>
          ) : (
             <div className="flex flex-col gap-4">
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 min-h-[120px] flex flex-nowrap xl:w-full">
                   {PIPELINE_STEPS.map((step, idx) => {
                     const items = data?.recent_recommendations?.filter(r => step.matches.includes(r.status)) || [];
                     const count = items.length;
                     
                     return (
                        <div key={step.id} className={`flex-1 shrink-0 min-w-[190px] flex flex-col h-full relative border-t-0 bg-transparent ${idx !== 0 ? 'border-l border-gray-100' : ''}`}>
                           <div className={`px-3 pt-3 pb-3 border-b border-gray-100 flex items-center justify-between relative bg-transparent`}>
                              <div className={`absolute top-0 left-0 right-0 ${count > 0 ? 'h-1 bg-gradient-to-r from-primary to-[#80C0C2]' : 'h-[2px] bg-primary/20'}`} />
                              <h3 className={`flex items-center gap-1.5 text-sm tracking-tight z-10 ${count > 0 ? 'font-medium text-gray-900' : 'font-normal text-gray-400'}`}>
                                 <step.icon className="w-4 h-4" />
                                 {step.label}
                              </h3>
                              {count > 0 && (
                                 <span className="flex items-center justify-center rounded-full text-[11px] font-bold z-10 transition-transform group-hover:scale-110 bg-primary text-white w-6 h-6">
                                    {count}
                                 </span>
                              )}
                           </div>
                           <div className="flex-1 overflow-y-auto p-2 space-y-2">
                              {items.length === 0 ? (
                                 <div className="flex flex-col items-center justify-center mt-4 py-2">
                                    <span className="text-gray-300 font-medium">—</span>
                                 </div>
                              ) : (
                                 items.map((rec, i) => {
                                    const diffTime = Math.abs(new Date().getTime() - new Date(rec.created_at).getTime());
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                    let bColor = 'border-l-primary';
                                    if (diffDays >= 3) bColor = 'border-l-red-600';
                                    else if (diffDays >= 1) bColor = 'border-l-amber-500';

                                    const initialTokens = rec.patientName?.split(' ') || ['U', 'N'];
                                    const initials = `${initialTokens[0]?.[0] || ''}${initialTokens[1]?.[0] || ''}`.toUpperCase().substring(0,2) || 'UK';

                                    return (
                                       <button 
                                          key={rec.id} 
                                          onClick={() => router.push(`/dashboard/recommendations/${rec.id}`)}
                                          style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                                          className={`w-full text-left bg-white p-3 rounded-lg shadow border border-gray-100 border-t-2 border-t-[#008085]/20 border-l-[3px] ${bColor} hover:shadow-md hover:bg-gradient-to-r hover:from-white hover:to-gray-50 cursor-pointer active:scale-[0.98] transition-all duration-150 flex gap-3 animate-in fade-in slide-in-from-bottom-2`}
                                       >
                                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                                             {initials}
                                          </div>
                                          <div className="flex flex-col flex-1 min-w-0 justify-center">
                                             <div className="font-medium text-[13px] text-gray-800 truncate leading-tight mb-0.5">{rec.patientName}</div>
                                             <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-0.5 font-mono">
                                                <span>{rec.display_id}</span>
                                                <span className="font-body opacity-50">•</span>
                                                <span className="font-body">{rec.testsCount} {rec.testsCount === 1 ? 'test' : 'tests'}</span>
                                             </div>
                                             <div className="text-[11px] text-gray-400 leading-none">
                                                {new Date(rec.created_at).toLocaleDateString()}
                                             </div>
                                          </div>
                                       </button>
                                    );
                                 })
                              )}
                           </div>
                        </div>
                     );
                   })}
                </div>
                
                {/* Kanban Status Legend */}
                <div className="flex flex-wrap items-center justify-center gap-6 pb-4 mt-4">
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                      <span className="text-xs text-gray-400">Recent (&lt; 24h)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <span className="text-xs text-gray-400">Needs attention (1-3 days)</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                      <span className="text-xs text-gray-400">Action needed (3+ days)</span>
                   </div>
                </div>
             </div>
          )}
        </>
      )}
    </div>
  );
}
