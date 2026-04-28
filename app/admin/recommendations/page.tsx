"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Loader2, Search, ClipboardList, Download, MoreHorizontal, ChevronDown, X, Edit2, Copy, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

const REC_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'created', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

import { formatDate } from '@/lib/format-date';

function formatCurrency(n: number): string {
  return `€${n.toFixed(2)}`;
}

// Searchable doctor select (select2-style)
function DoctorSearchSelect({ doctors, value, onChange }: { doctors: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const selectedDoctor = doctors.find(d => d.id === value);
  const filtered = query
    ? doctors.filter(d => d.full_name?.toLowerCase().includes(query.toLowerCase()))
    : doctors;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-52">
      <div
        onClick={() => setOpen(!open)}
        className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 bg-white flex items-center cursor-pointer hover:border-gray-300 transition-colors"
      >
        <span className={`truncate ${value === 'all' ? 'text-gray-500' : 'text-near-black'}`}>
          {value === 'all' ? 'All Doctors' : selectedDoctor?.full_name || 'All Doctors'}
        </span>
        {value !== 'all' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onChange('all'); setQuery(''); }}
            className="absolute right-8 p-0.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search doctors..."
              className="w-full h-9 px-3 text-[13px] rounded-[8px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <button
              onClick={() => { onChange('all'); setOpen(false); setQuery(''); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors ${value === 'all' ? 'text-primary font-semibold' : 'text-gray-700'}`}
            >
              All Doctors
            </button>
            {filtered.map((d: any) => (
              <button
                key={d.id}
                onClick={() => { onChange(d.id); setOpen(false); setQuery(''); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors ${value === d.id ? 'text-primary font-semibold' : 'text-gray-700'}`}
              >
                <div>{d.full_name}</div>
                {d.practice_name && <div className="text-[11px] text-gray-400">{d.practice_name}</div>}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-[13px] text-gray-400 text-center">No doctors found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RecActionsDropdown({ rec, onActionComplete }: { rec: any; onActionComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleCopyLink = () => {
    if (rec.magic_link) {
      const url = `${window.location.origin}/patient/${rec.magic_link}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setOpen(false);
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel recommendation ${rec.display_id}? This cannot be undone.`)) return;
    setOpen(false);
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/recommendations/${rec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      onActionComplete();
    } catch (err: any) { alert(err.message); }
    finally { setCancelling(false); }
  };

  const canCancel = rec.status !== 'cancelled' && rec.status !== 'paid';

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
      >
        {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)}>
          <div
            className="absolute w-48 bg-white border border-gray-200 rounded-[12px] shadow-lg py-1 overflow-hidden"
            style={{
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: buttonRef.current ? buttonRef.current.getBoundingClientRect().right - 192 : 0,
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/admin/recommendations/${rec.id}`); }}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4 shrink-0" /> View Details
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); router.push(`/doctor/recommendations/${rec.id}/edit`); }}
              className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-4 h-4 shrink-0" /> Edit Recommendation
            </button>
            {rec.magic_link && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" /> : <Copy className="w-4 h-4 shrink-0" />}
                {copied ? 'Copied!' : 'Copy Patient Link'}
              </button>
            )}
            {canCancel && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2.5 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4 shrink-0" /> Cancel Recommendation
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort, className }: {
  label: string; sortKey: string; currentSort: string; onSort: (key: string) => void; className?: string;
}) {
  const isAsc = currentSort === `${sortKey}_asc`;
  const isDesc = currentSort === `${sortKey}_desc`;
  const handleClick = () => { if (isAsc) onSort(`${sortKey}_desc`); else onSort(`${sortKey}_asc`); };
  return (
    <th className={`px-4 py-4 cursor-pointer select-none hover:text-near-black transition-colors group ${className || ''}`} onClick={handleClick}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col text-[8px] leading-[8px]">
          <span className={isAsc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}>▲</span>
          <span className={isDesc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}>▼</span>
        </span>
      </div>
    </th>
  );
}

export default function AdminRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [doctorId, setDoctorId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('newest');
  const [columnSort, setColumnSort] = useState('');

  const [doctors, setDoctors] = useState<any[]>([]);

  const sortedRecommendations = useMemo(() => {
    if (!columnSort) return recommendations;
    const items = [...recommendations];
    items.sort((a, b) => {
      if (columnSort === 'id_asc') return (a.display_id || '').localeCompare(b.display_id || '');
      if (columnSort === 'id_desc') return (b.display_id || '').localeCompare(a.display_id || '');
      if (columnSort === 'patient_asc') return ((a.patient?.last_name || '') + (a.patient?.first_name || '')).localeCompare((b.patient?.last_name || '') + (b.patient?.first_name || ''));
      if (columnSort === 'patient_desc') return ((b.patient?.last_name || '') + (b.patient?.first_name || '')).localeCompare((a.patient?.last_name || '') + (a.patient?.first_name || ''));
      if (columnSort === 'doctor_asc') return (a.doctor?.full_name || '').localeCompare(b.doctor?.full_name || '');
      if (columnSort === 'doctor_desc') return (b.doctor?.full_name || '').localeCompare(a.doctor?.full_name || '');
      if (columnSort === 'total_asc') return (a.test_total || 0) - (b.test_total || 0);
      if (columnSort === 'total_desc') return (b.test_total || 0) - (a.test_total || 0);
      if (columnSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (columnSort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
    return items;
  }, [recommendations, columnSort]);

  const selectClasses = "h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white shrink-0 appearance-none";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };
  const inputClasses = "h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white";

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/admin/users?type=doctors&limit=100');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.data || []);
        }
      } catch (e) {}
    }
    fetchDoctors();
  }, []);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString(), sort });
      if (status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      if (doctorId !== 'all') params.append('doctor_id', doctorId);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/admin/recommendations?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recommendations');
      const data = await res.json();
      setRecommendations(data.data);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, search, doctorId, dateFrom, dateTo, sort]);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  const handleExport = () => {
    const csvRows = ['ID,Patient,Email,Doctor,Status,Tests,Labs,Total,Date'];
    recommendations.forEach(r => {
      csvRows.push(`${r.display_id},"${r.patient?.first_name} ${r.patient?.last_name}",${r.patient?.email || ''},"${r.doctor?.full_name || ''}",${r.status},${r.item_count},"${(r.labs || []).join('; ')}",${r.test_total?.toFixed(2) || '0.00'},${formatDate(r.created_at || '')}`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-export-${formatDate(new Date().toISOString())}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
            Recommendations
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">Search, filter, and manage all recommendations.</p>
        </div>
        <Button variant="secondary" className="rounded-full shrink-0 text-[13px] h-10 px-5" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" />
          Export
        </Button>
      </div>

      {/* Filters — full width */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[14px] placeholder:text-gray-400"
            placeholder="Search by ID or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-44`} style={selectStyle}>
          {REC_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <DoctorSearchSelect doctors={doctors} value={doctorId} onChange={(id) => { setDoctorId(id); setPage(1); }} />

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className={`${inputClasses} w-44`} />
          <span className="text-gray-400 text-[13px]">–</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className={`${inputClasses} w-44`} />
        </div>


      </div>

      {/* Summary */}
      <div className="text-[13px] text-gray-500">
        Showing <span className="font-semibold text-near-black">{Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)}</span> of <span className="font-semibold text-near-black">{total}</span> recommendations
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <tr>
                  <SortableHeader label="ID" sortKey="id" currentSort={columnSort} onSort={setColumnSort} className="w-[100px]" />
                  <SortableHeader label="Patient" sortKey="patient" currentSort={columnSort} onSort={setColumnSort} className="w-[170px]" />
                  <SortableHeader label="Doctor" sortKey="doctor" currentSort={columnSort} onSort={setColumnSort} className="w-[160px]" />
                  <th className="px-4 py-4 w-[100px]">Status</th>
                  <th className="px-4 py-4">Lab(s)</th>
                  <SortableHeader label="Total" sortKey="total" currentSort={columnSort} onSort={setColumnSort} className="w-[90px]" />
                  <SortableHeader label="Date" sortKey="date" currentSort={columnSort} onSort={setColumnSort} className="w-[140px]" />
                  <th className="px-4 py-4 w-[70px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {sortedRecommendations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/recommendations/${rec.id}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[13px] text-primary font-semibold">{rec.display_id || rec.id?.substring(0, 8)}</span>
                        <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{rec.item_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-near-black">{rec.patient?.first_name} {rec.patient?.last_name}</div>
                      <div className="text-[12px] text-gray-500">{rec.patient?.email}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">{rec.doctor?.full_name || '-'}</td>
                    <td className="px-4 py-4"><StatusBadge status={rec.status || 'created'} /></td>
                    <td className="px-4 py-4 text-gray-600 text-[13px] truncate max-w-[180px]">{(rec.labs || []).join(', ') || '-'}</td>
                    <td className="px-4 py-4 font-mono text-gray-900 font-medium">{rec.test_total > 0 ? formatCurrency(rec.test_total) : '-'}</td>
                    <td className="px-4 py-4 text-gray-500 text-[13px]">{formatDate(rec.created_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                        <RecActionsDropdown rec={rec} onActionComplete={() => fetchRecommendations()} />
                      </div>
                    </td>
                  </tr>
                ))}
                {recommendations.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p>No recommendations found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {recommendations.map((rec, index) => (
              <Link
                key={rec.id}
                href={`/admin/recommendations/${rec.id}`}
                className={`block p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors ${index !== recommendations.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <span className="font-mono text-[13px] text-primary font-semibold">{rec.display_id}</span>
                    <div className="font-semibold text-near-black text-[15px] mt-0.5">{rec.patient?.first_name} {rec.patient?.last_name}</div>
                  </div>
                  <StatusBadge status={rec.status || 'created'} />
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-500 flex-wrap">
                  <span>{rec.doctor?.full_name || '-'}</span>
                  <span className="text-gray-300">·</span>
                  <span>{rec.item_count} test{rec.item_count !== 1 ? 's' : ''}</span>
                  <span className="text-gray-300">·</span>
                  <span>{(rec.labs || []).join(', ') || '-'}</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-[13px]">
                  <span className="font-mono font-medium text-gray-900">{rec.test_total > 0 ? formatCurrency(rec.test_total) : '-'}</span>
                  <span className="text-gray-400">{formatDate(rec.created_at)}</span>
                </div>
              </Link>
            ))}
            {recommendations.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-[14px]">No recommendations found</div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-gray-500">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-[13px] h-9 px-4 rounded-full">Previous</Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="text-[13px] h-9 px-4 rounded-full">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
