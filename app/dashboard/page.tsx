/* eslint-disable */
"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useEffect, useState, useMemo } from "react";
import { Plus, Users, LayoutList, LayoutGrid, Send, CreditCard, Truck, FlaskConical, FileCheck, FileEdit, Clock, ClipboardList, ArrowRight, Download, CheckCircle2, FileText } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDoctor } from "@/components/providers/DoctorProvider";
import { useRouter } from "next/navigation";
import { formatDate } from '@/lib/format-date';

const KANBAN_COLUMNS = [
  { id: 'draft', label: 'Draft', matches: ['created'], icon: FileEdit, color: 'gray' },
  { id: 'sent', label: 'Sent', matches: ['sent'], icon: Send, color: 'blue' },
  { id: 'paid', label: 'Paid', matches: ['paid', 'awaiting_payment'], icon: CreditCard, color: 'teal' },
  { id: 'shipped', label: 'Shipped', matches: ['preparing', 'kit_shipped'], icon: Truck, color: 'purple' },
  { id: 'at_lab', label: 'At Lab', matches: ['at_lab', 'returning_to_lab'], icon: FlaskConical, color: 'amber' },
  { id: 'results', label: 'Results', matches: ['results_ready', 'completed'], icon: FileCheck, color: 'green' },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; headerBg: string; dot: string }> = {
  gray:   { bg: 'bg-gray-50/50',   border: 'border-gray-200',   text: 'text-gray-600',   headerBg: 'bg-gray-50',   dot: 'bg-gray-400' },
  blue:   { bg: 'bg-blue-50/50',   border: 'border-blue-200',   text: 'text-blue-700',   headerBg: 'bg-blue-50',   dot: 'bg-blue-400' },
  teal:   { bg: 'bg-teal-50/50',   border: 'border-teal-200',   text: 'text-teal-700',   headerBg: 'bg-teal-50',   dot: 'bg-teal-400' },
  purple: { bg: 'bg-purple-50/50', border: 'border-purple-200', text: 'text-purple-700', headerBg: 'bg-purple-50', dot: 'bg-purple-400' },
  pink:   { bg: 'bg-pink-50/50',   border: 'border-pink-200',   text: 'text-pink-700',   headerBg: 'bg-pink-50',   dot: 'bg-pink-400' },
  amber:  { bg: 'bg-amber-50/50',  border: 'border-amber-200',  text: 'text-amber-700',  headerBg: 'bg-amber-50',  dot: 'bg-amber-400' },
  green:  { bg: 'bg-green-50/50',  border: 'border-green-200',  text: 'text-green-700',  headerBg: 'bg-green-50',  dot: 'bg-green-400' },
};

interface DashboardData {
  metrics: {
    total_recommendations: number;
    active_patients: number;
    status_counts: Record<string, number>;
  };
  recent_recommendations: any[];
}

function StatCard({ label, value, icon: Icon, href }: { label: string; value: string; icon: any; href?: string }) {
  const content = (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-3 hover:border-primary/30 transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-[22px] font-heading font-medium text-near-black">{value}</div>
        <div className="text-[12px] text-gray-500">{label}</div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function SortableHeader({ label, sortKey, currentSort, onSort }: any) {
  const isAsc = currentSort === `${sortKey}_asc`;
  const isDesc = currentSort === `${sortKey}_desc`;

  const handleClick = () => {
    if (isAsc) onSort(`${sortKey}_desc`);
    else onSort(`${sortKey}_asc`);
  };

  return (
    <th className="px-6 py-3 cursor-pointer group select-none" onClick={handleClick}>
      <div className="flex items-center gap-1.5 transition-colors group-hover:text-near-black">
        {label}
        <div className="flex flex-col gap-0.5">
          <svg className={`w-2 h-2 ${isAsc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M18 15l-6-6-6 6" /></svg>
          <svg className={`w-2 h-2 ${isDesc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" /></svg>
        </div>
      </div>
    </th>
  );
}

export default function DoctorDashboardPage() {
  const { doctor } = useDoctor();
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'results'>('kanban');
  const [listSort, setListSort] = useState('date_desc');

  const [reviewResults, setReviewResults] = useState<any[]>([]);
  const [recentResults, setRecentResults] = useState<any[]>([]);

  useEffect(() => {
    async function fetchResults() {
      try {
        const reviewRes = await fetch('/api/doctor/results?status=doctor_reviewing');
        if (reviewRes.ok) {
          const data = await reviewRes.json();
          setReviewResults(data.results || []);
        }

        const recentRes = await fetch('/api/doctor/results?limit=20');
        if (recentRes.ok) {
          const data = await recentRes.json();
          setRecentResults(data.results || []);
        }
      } catch {}
    }
    fetchResults();
  }, []);

  const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());

  const toggleColumn = (colId: string) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  useEffect(() => {
    if (data?.recent_recommendations) {
      const emptyCols = new Set<string>();
      KANBAN_COLUMNS.forEach(col => {
        const count = data.recent_recommendations.filter(r => col.matches.includes(r.status)).length;
        if (count === 0) emptyCols.add(col.id);
      });
      setCollapsedCols(emptyCols);
    }
  }, [data?.recent_recommendations]);

  const sortedListRecs = useMemo(() => {
    const items = [...(data?.recent_recommendations || [])];
    items.sort((a, b) => {
      if (listSort === 'patient_asc') return (a.patientName || '').localeCompare(b.patientName || '');
      if (listSort === 'patient_desc') return (b.patientName || '').localeCompare(a.patientName || '');
      if (listSort === 'id_asc') return (a.display_id || '').localeCompare(b.display_id || '');
      if (listSort === 'id_desc') return (b.display_id || '').localeCompare(a.display_id || '');
      if (listSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return items;
  }, [data?.recent_recommendations, listSort]);

  useEffect(() => {
    if (!doctor) return;
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/doctor/dashboard');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch dashboard data');
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [doctor]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-medium text-near-black">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {doctor?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1 border border-gray-200 flex items-center">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-[#E6F7F5] text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                viewMode === 'list' ? 'bg-[#E6F7F5] text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutList className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('results')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                viewMode === 'results' ? 'bg-[#E6F7F5] text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Results
            </button>
          </div>
          <Link
            href="/dashboard/recommendations/new"
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> New Recommendation
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error}</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={ClipboardList} value={String(data?.metrics.total_recommendations || 0)} label="Recommendations" href="/dashboard/recommendations" />
            <StatCard icon={Users} value={String(data?.metrics.active_patients || 0)} label="Active Patients" href="/dashboard/patients" />
            <StatCard icon={CreditCard} value={String(data?.metrics.status_counts?.['paid'] || 0)} label="Paid" />
            <StatCard icon={Clock} value={String(data?.metrics.status_counts?.['sent'] || 0)} label="Awaiting Response" />
          </div>

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Recommendation Pipeline</h2>
              </div>
              <div className="p-4 overflow-x-auto">
                <div className="flex gap-3 min-w-[900px]">
                  {KANBAN_COLUMNS.map(col => {
                    const colors = COLOR_MAP[col.color];
                    const Icon = col.icon;
                    const items = (data?.recent_recommendations?.filter(r => col.matches.includes(r.status)) || [])
 .sort((a, b) => {
 const dateA = a.expected_appointment_date || a.created_at;
 const dateB = b.expected_appointment_date || b.created_at;
 return new Date(dateA).getTime() - new Date(dateB).getTime();
 });

                    const isCollapsed = collapsedCols.has(col.id);

                    return (
                      <div key={col.id} className={`${isCollapsed ? 'w-[48px] shrink-0' : 'flex-1 min-w-[160px]'} overflow-hidden`} style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        {isCollapsed ? (
                          /* Collapsed column */
                          <div
                            onClick={() => toggleColumn(col.id)}
                            className={`h-full rounded-[12px] border ${colors.border} ${colors.bg} flex flex-col items-center py-3 gap-2 cursor-pointer hover:opacity-80 transition-all duration-300`}
                          >
                            <Icon className={`w-4 h-4 ${colors.text} opacity-60`} />
                            <span className={`text-[11px] font-bold ${colors.text}`}>{items.length}</span>
                            <span className={`text-[10px] font-medium ${colors.text} opacity-50 [writing-mode:vertical-lr] rotate-180 mt-1`}>{col.label}</span>
                          </div>
                        ) : (
                          <div className={`rounded-[12px] border ${colors.border} overflow-hidden`}>
                            {/* Column header — clickable to collapse */}
                            <div
                              onClick={() => toggleColumn(col.id)}
                              className={`${colors.headerBg} px-3 py-2.5 flex items-center justify-between cursor-pointer hover:opacity-80 transition-all duration-300`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${colors.text}`} />
                                <span className={`text-[13px] font-semibold ${colors.text}`}>{col.label}</span>
                              </div>
                              <span className={`text-[12px] font-bold ${colors.text} bg-white/60 px-1.5 py-0.5 rounded-full`}>
                                {items.length}
                              </span>
                            </div>

                            {/* Cards */}
                            <div className={`${colors.bg} p-2 space-y-1.5 min-h-[80px]`}>
                              {items.length === 0 ? (
                                <div className="text-center text-[12px] text-gray-400 py-4 italic">No items</div>
                              ) : (
                                <>
                                  {items.slice(0, 8).map(rec => {
                                    const initials = (rec.patientName || 'UN').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                                    return (
                                      <button
                                        key={rec.id}
                                        onClick={() => router.push(`/dashboard/recommendations/${rec.id}`)}
                                        className="w-full text-left bg-white rounded-[10px] px-3.5 py-2.5 border border-gray-100 hover:border-primary/40 hover:shadow-md hover:-translate-y-px hover:bg-gradient-to-br hover:from-white hover:to-primary/[0.02] active:translate-y-0 active:shadow-sm transition-all duration-200 ease-out cursor-pointer will-change-transform"
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                                            {initials}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-gray-800 truncate">{rec.patientName}</div>
                                            <div className="flex items-center justify-between mt-0.5">
                                              <span className="text-[11px] font-mono text-primary font-semibold">{rec.display_id}</span>
                                              <span className="text-[11px] text-gray-400">{rec.expected_appointment_date ? formatDate(rec.expected_appointment_date) : formatDate(rec.created_at)}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                  {items.length > 8 && (
                                    <button
                                      onClick={() => router.push('/dashboard/recommendations')}
                                      className={`w-full text-center py-2 text-[12px] font-semibold ${colors.text} hover:underline`}
                                    >
                                      +{items.length - 8} more →
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>All Recommendations</h2>
                <Link href="/dashboard/recommendations" className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                    <tr>
                      <SortableHeader label="Patient" sortKey="patient" currentSort={listSort} onSort={setListSort} />
                      <SortableHeader label="ID" sortKey="id" currentSort={listSort} onSort={setListSort} />
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Tests</th>
                      <SortableHeader label="Date" sortKey="date" currentSort={listSort} onSort={setListSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedListRecs.slice(0, 10).map((rec: any) => (
                      <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/recommendations/${rec.id}`)}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                              {(rec.patientName || 'UN').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                            </div>
                            <span className="font-medium text-gray-800">{rec.patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 font-mono text-[13px] text-primary font-semibold">{rec.display_id}</td>
                        <td className="px-6 py-3"><StatusBadge status={rec.status} /></td>
                        <td className="px-6 py-3 text-gray-500">{rec.testsCount} test{rec.testsCount !== 1 ? 's' : ''}</td>
                        <td className="px-6 py-3 text-gray-500 text-[13px]">{formatDate(rec.created_at)}</td>
                      </tr>
                    ))}
                    {(!data?.recent_recommendations || data.recent_recommendations.length === 0) && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recommendations yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {sortedListRecs.length > 10 && (
                <div className="px-6 py-3 border-t border-gray-100 text-center">
                  <Link href="/dashboard/recommendations" className="text-[13px] text-primary font-semibold hover:underline">
                    View all {sortedListRecs.length} recommendations →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Bottom Cards */}
          {viewMode === 'results' && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 mb-6">
              
              {reviewResults.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-heading font-medium text-[15px] text-near-black mb-3 text-amber-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Action Required
                  </h3>
                  <div className="space-y-3">
                    {reviewResults.map((result: any) => (
                      <div key={result.id} className="bg-white rounded-[16px] border border-amber-200 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-mono text-[13px] text-[#008085] font-semibold">{result.order?.display_id}</span>
                            <span className="text-[13px] text-gray-500 ml-2">
                              {result.order?.patient?.first_name} {result.order?.patient?.last_name}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            Pending Review
                          </span>
                        </div>
                  
                        <div className="text-[14px] text-near-black mb-1">
                          Tests: {(result.tests_covered || []).map((t: any) => t.test_name || t.name).join(', ')}
                        </div>
                        <div className="text-[12px] text-gray-400 flex items-center gap-1.5">
                          {result.laboratory?.name} <span className="text-gray-300">·</span> {formatDate(result.created_at)}
                        </div>
                  
                        {/* Doctor Notes Input */}
                        <div className="mt-3">
                          <textarea
                            placeholder="Add notes for the patient (optional)..."
                            defaultValue={result.doctor_notes || ''}
                            onBlur={async (e) => {
                              const notes = e.target.value;
                              try {
                                await fetch(`/api/doctor/results/${result.id}/notes`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ notes }),
                                });
                              } catch {}
                            }}
                            rows={2}
                            className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[13px] resize-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                          />
                        </div>
                  
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/doctor/results/${result.id}/download`);
                                if (res.ok) {
                                  const data = await res.json();
                                  window.open(data.url, '_blank');
                                }
                              } catch {}
                            }}
                            className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 text-[13px] font-medium transition-colors flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            View PDF
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/doctor/results/${result.id}/release`, { method: 'PATCH' });
                                if (res.ok) {
                                  // Remove from review list, add to recent
                                  setReviewResults(prev => prev.filter(r => r.id !== result.id));
                                  setRecentResults(prev => [result, ...prev.filter(r => r.id !== result.id)]);
                                }
                              } catch {}
                            }}
                            className="px-4 py-2 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[13px] font-medium transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Release to Patient
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-6">
                <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Recent Results</h3>
                {recentResults.length === 0 ? (
                  <div className="text-center py-6 text-[13px] text-gray-400 border border-dashed border-gray-200 rounded-[12px]">No recent results found.</div>
                ) : (
                  recentResults.map((result: any) => (
                    <div key={result.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-[12px]">
                      <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-near-black">
                            {result.order?.display_id} — {result.order?.patient?.first_name} {result.order?.patient?.last_name}
                          </span>
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            result.status === 'released' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {result.status === 'released' ? 'Released' : 'Uploaded'}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          Tests: {(result.tests_covered || []).map((t: any) => t.test_name || t.name).join(', ')}
                          <span className="text-gray-300">·</span> {result.laboratory?.name} <span className="text-gray-300">·</span> {formatDate(result.created_at)}
                        </div>
                        {result.doctor_notes && (
                          <div className="text-[12px] text-blue-500 mt-0.5 font-medium">Your note: {result.doctor_notes}</div>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/doctor/results/${result.id}/download`);
                            if (res.ok) {
                              const data = await res.json();
                              window.open(data.url, '_blank');
                            }
                          } catch {}
                        }}
                        className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Patients */}
            <div className="bg-white border border-gray-200 rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-medium text-near-black">Your Patients</h3>
                <Link href="/dashboard/patients" className="text-[12px] font-semibold text-primary hover:text-primary-dark flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-0">
                {(data?.recent_recommendations || [])
                  .reduce((acc: any[], rec: any) => {
                    if (!acc.find(p => p.name === rec.patientName)) {
                      acc.push({ name: rec.patientName, id: rec.id, date: rec.created_at, count: 1 });
                    } else {
                      acc.find(p => p.name === rec.patientName)!.count++;
                    }
                    return acc;
                  }, [])
                  .slice(0, 5)
                  .map((pat: any, index: number, arr: any[]) => {
                    const initials = (pat.name || 'UN').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
                    return (
                      <div
                        key={pat.name}
                        className={`flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors ${
                          index !== arr.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-800 truncate">{pat.name}</p>
                          <p className="text-[11px] text-gray-400">{pat.count} recommendation{pat.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                {(!data?.recent_recommendations || data.recent_recommendations.length === 0) && (
                  <div className="py-6 text-center text-[13px] text-gray-400">No patients yet</div>
                )}
              </div>
            </div>

            {/* Recent Notifications */}
            <RecentNotificationsCard />
          </div>
        </>
      )}
    </div>
  );
}

function RecentNotificationsCard() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/notifications?filter=all&limit=4')
      .then(r => r.json())
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {});
  }, []);

  const ICONS: Record<string, { icon: any; bg: string; color: string }> = {
    payment_received: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
    bank_transfer_confirmed: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
    bank_transfer_pending: { icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
    kit_shipped: { icon: Truck, bg: 'bg-blue-50', color: 'text-blue-600' },
    results_ready: { icon: FlaskConical, bg: 'bg-primary/10', color: 'text-primary' },
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[16px] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-medium text-near-black">Recent Notifications</h3>
        <Link href="/dashboard/notifications" className="text-[12px] font-semibold text-primary hover:text-primary-dark flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="space-y-0">
        {notifications.slice(0, 4).map((n: any, index: number) => {
          const iconInfo = ICONS[n.notification_type] || { icon: Clock, bg: 'bg-gray-100', color: 'text-gray-500' };
          const Icon = iconInfo.icon;
          return (
            <div
              key={n.id}
              onClick={() => { if (n.reference_id) router.push(`/dashboard/recommendations/${n.reference_id}`); }}
              className={`flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors ${
                index !== Math.min(notifications.length, 4) - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${iconInfo.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconInfo.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${!n.is_read ? 'font-semibold' : 'font-medium'} text-gray-800 truncate`}>{n.title}</p>
                <p className="text-[11px] text-gray-400 truncate">{n.message}</p>
              </div>
              <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(n.created_at)}</span>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="py-6 text-center text-[13px] text-gray-400">No notifications yet</div>
        )}
      </div>
    </div>
  );
}
