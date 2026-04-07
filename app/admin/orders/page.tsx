"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, Search, ShoppingCart, ExternalLink, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import Link from 'next/link';

const ORDER_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'kit_shipped', label: 'Shipped' },
  { value: 'collecting', label: 'Collecting' },
  { value: 'at_lab', label: 'At Lab' },
  { value: 'results_ready', label: 'Results Ready' },
  { value: 'completed', label: 'Completed' },
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'All Methods' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'sepa', label: 'SEPA' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    credit_card: 'Credit Card',
    card: 'Credit Card',
    sepa: 'SEPA',
    bank_transfer: 'Bank Transfer',
    paypal: 'PayPal',
  };
  return map[method] || method || '-';
}

function PipelineDotsIndicator({ status }: { status: any }) {
  if (!status || typeof status !== 'object') return <span className="text-gray-400 text-[12px]">—</span>;
  const steps = ['materials', 'anamnese_pdf', 'ldt_file', 'pad_pvs', 'dhl_label'];
  return (
    <div className="flex items-center gap-1">
      {steps.map(step => {
        const s = status[step];
        const color = s?.status === 'completed' ? 'bg-green-500'
          : s?.status === 'failed' ? 'bg-red-500'
          : s?.status === 'skipped' ? 'bg-yellow-400'
          : 'bg-gray-200';
        return <div key={step} className={`w-2 h-2 rounded-full ${color}`} title={`${step}: ${s?.status || 'pending'}`} />;
      })}
    </div>
  );
}

function DoctorSearchSelect({ doctors, value, onChange }: { doctors: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selectedDoctor = doctors.find(d => d.id === value);
  const filtered = query ? doctors.filter(d => d.full_name?.toLowerCase().includes(query.toLowerCase())) : doctors;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-52">
      <div onClick={() => setOpen(!open)} className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 bg-white flex items-center cursor-pointer hover:border-gray-300 transition-colors">
        <span className={`truncate ${value === 'all' ? 'text-gray-500' : 'text-near-black'}`}>
          {value === 'all' ? 'All Doctors' : selectedDoctor?.full_name || 'All Doctors'}
        </span>
        {value !== 'all' && (
          <button onClick={(e) => { e.stopPropagation(); onChange('all'); setQuery(''); }} className="absolute right-8 p-0.5 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3" />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search doctors..." className="w-full h-9 px-3 text-[13px] rounded-[8px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none" autoFocus />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <button onClick={() => { onChange('all'); setOpen(false); setQuery(''); }} className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 ${value === 'all' ? 'text-primary font-semibold' : 'text-gray-700'}`}>All Doctors</button>
            {filtered.map((d: any) => (
              <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); setQuery(''); }} className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 ${value === d.id ? 'text-primary font-semibold' : 'text-gray-700'}`}>
                <div>{d.full_name}</div>
                {d.practice_name && <div className="text-[11px] text-gray-400">{d.practice_name}</div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort }: {
  label: string; sortKey: string; currentSort: string; onSort: (key: string) => void;
}) {
  const isAsc = currentSort === `${sortKey}_asc`;
  const isDesc = currentSort === `${sortKey}_desc`;
  const handleClick = () => { if (isAsc) onSort(`${sortKey}_desc`); else onSort(`${sortKey}_asc`); };
  return (
    <th className="px-6 py-4 cursor-pointer select-none hover:text-near-black transition-colors group" onClick={handleClick}>
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [doctorId, setDoctorId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [columnSort, setColumnSort] = useState('');

  const sortedOrders = useMemo(() => {
    if (!columnSort) return orders;
    const items = [...orders];
    items.sort((a, b) => {
      if (columnSort === 'order_asc') return (a.display_id || '').localeCompare(b.display_id || '');
      if (columnSort === 'order_desc') return (b.display_id || '').localeCompare(a.display_id || '');
      if (columnSort === 'patient_asc') return ((a.patient?.last_name || '') + (a.patient?.first_name || '')).localeCompare((b.patient?.last_name || '') + (b.patient?.first_name || ''));
      if (columnSort === 'patient_desc') return ((b.patient?.last_name || '') + (b.patient?.first_name || '')).localeCompare((a.patient?.last_name || '') + (a.patient?.first_name || ''));
      if (columnSort === 'doctor_asc') return (a.doctor?.full_name || '').localeCompare(b.doctor?.full_name || '');
      if (columnSort === 'doctor_desc') return (b.doctor?.full_name || '').localeCompare(a.doctor?.full_name || '');
      if (columnSort === 'total_asc') return (Number(a.total) || 0) - (Number(b.total) || 0);
      if (columnSort === 'total_desc') return (Number(b.total) || 0) - (Number(a.total) || 0);
      if (columnSort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (columnSort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });
    return items;
  }, [orders, columnSort]);

  const selectClasses = "h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white shrink-0 appearance-none";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/admin/users?type=doctors&limit=100');
        if (res.ok) { const d = await res.json(); setDoctors(d.data || []); }
      } catch (e) {}
    }
    fetchDoctors();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status !== 'all') params.append('status', status);
      if (paymentMethod !== 'all') params.append('payment_method', paymentMethod);
      if (search) params.append('search', search);
      if (doctorId !== 'all') params.append('doctor_id', doctorId);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.data);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, paymentMethod, search, doctorId, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
            Orders
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">{total} orders total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[14px] placeholder:text-gray-400"
            placeholder="Search by Order ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-44`} style={selectStyle}>
          {ORDER_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <DoctorSearchSelect doctors={doctors} value={doctorId} onChange={(id) => { setDoctorId(id); setPage(1); }} />

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white w-44" />
          <span className="text-gray-400 text-[13px]">–</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white w-44" />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <tr>
                  <SortableHeader label="Order ID" sortKey="order" currentSort={columnSort} onSort={setColumnSort} />
                  <SortableHeader label="Patient" sortKey="patient" currentSort={columnSort} onSort={setColumnSort} />
                  <SortableHeader label="Doctor" sortKey="doctor" currentSort={columnSort} onSort={setColumnSort} />
                  <SortableHeader label="Total" sortKey="total" currentSort={columnSort} onSort={setColumnSort} />
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Pipeline</th>
                  <SortableHeader label="Date" sortKey="date" currentSort={columnSort} onSort={setColumnSort} />
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {sortedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] text-primary hover:underline font-semibold">
                        {order.display_id || order.id?.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-near-black">{order.patient?.first_name} {order.patient?.last_name}</div>
                      <div className="text-[12px] text-gray-500">{order.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">
                      {order.doctor?.full_name || '-'}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-900">
                      {order.total != null ? `€${Number(order.total).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-[13px]">
                      {formatPaymentMethod(order.payment_method)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status || 'preparing'} />
                    </td>
                    <td className="px-6 py-4">
                      <PipelineDotsIndicator status={order.preparation_status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <p>No orders found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {orders.map((order, index) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className={`block p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors ${index !== orders.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono text-[13px] text-primary font-semibold">{order.display_id || order.id?.substring(0, 8)}</span>
                    <div className="font-semibold text-near-black text-[15px] mt-0.5">{order.patient?.first_name} {order.patient?.last_name}</div>
                  </div>
                  <StatusBadge status={order.status || 'preparing'} />
                </div>
                <div className="flex items-center gap-3 text-[13px] text-gray-500">
                  <span className="font-mono">€{Number(order.total || 0).toFixed(2)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatPaymentMethod(order.payment_method)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="mt-2">
                  <PipelineDotsIndicator status={order.preparation_status} />
                </div>
              </Link>
            ))}
            {orders.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-[14px]">No orders found</div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-gray-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-[13px] h-9 px-4 rounded-full">
              Previous
            </Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="text-[13px] h-9 px-4 rounded-full">
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
