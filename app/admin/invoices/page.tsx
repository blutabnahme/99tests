"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import {
  Loader2, Receipt, Plus, Eye, Send, CheckCircle2, XCircle,
  Calendar, AlertCircle, ChevronDown, ChevronRight, Download, X, Search, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createPortal } from 'react-dom';

import { formatDate } from '@/lib/format-date';

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
      status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
      status === 'sent' ? 'bg-blue-50 text-blue-700' :
      status === 'overdue' ? 'bg-red-50 text-red-700' :
      status === 'issued' ? 'bg-gray-100 text-gray-600' :
      'bg-gray-100 text-gray-500'
    }`}>
      {status === 'paid' ? 'Paid' :
       status === 'issued' ? 'Issued' :
       status === 'sent' ? 'Sent' :
       status === 'overdue' ? 'Overdue' :
       status === 'cancelled' ? 'Cancelled' :
       'Draft'}
    </span>
  );
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [periodFilterKey, setPeriodFilterKey] = useState('all');

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  });
  const [generateResult, setGenerateResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [customDueDate, setCustomDueDate] = useState('');

  // Generate wizard state
  const [generateStep, setGenerateStep] = useState(1);
  const [generateDoctorId, setGenerateDoctorId] = useState('');
  const [generateDoctorSearch, setGenerateDoctorSearch] = useState('');
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [doctorOrders, setDoctorOrders] = useState<any[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [wizardPeriodStart, setWizardPeriodStart] = useState<Date | null>(null);
  const [wizardPeriodEnd, setWizardPeriodEnd] = useState<Date | null>(null);
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Set default period to previous month
  useEffect(() => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfPrevMonth = new Date(firstOfMonth.getTime() - 1);
    const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
    setPeriodStart(firstOfPrevMonth.toISOString().split('T')[0]);
    setPeriodEnd(lastOfPrevMonth.toISOString().split('T')[0]);
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInvoices(data.data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const fetchDoctorsWithOrders = async () => {
    setLoadingDoctors(true);
    try {
      const res = await fetch('/api/admin/invoices/generate?action=list_doctors');
      if (res.ok) {
        const data = await res.json();
        setAvailableDoctors(data.doctors || []);
      }
    } catch {}
    finally { setLoadingDoctors(false); }
  };

  const fetchDoctorPeriods = async (doctorId: string) => {
    setLoadingPeriods(true);
    try {
      const res = await fetch(`/api/admin/invoices/generate?action=list_periods&doctor_id=${doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailablePeriods(data.periods || []);
        // Auto-select the most recent period
        if (data.periods?.length > 0) {
          const latest = data.periods[0];
          setWizardPeriodStart(new Date(latest.period_start));
          setWizardPeriodEnd(new Date(latest.period_end));
          // Fetch orders for this period
          fetchDoctorOrders(doctorId, latest.period_start, latest.period_end);
        }
      }
    } catch {}
    finally { setLoadingPeriods(false); }
  };

  const fetchDoctorOrders = async (doctorId: string, periodStartStr?: string, periodEndStr?: string) => {
    setLoadingOrders(true);
    try {
      const start = periodStartStr || wizardPeriodStart?.toISOString() || '';
      const end = periodEndStr || wizardPeriodEnd?.toISOString() || '';
      const res = await fetch(`/api/admin/invoices/generate?action=list_orders&doctor_id=${doctorId}&period_start=${start}&period_end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorOrders(data.orders || []);
        setSelectedOrderIds(new Set((data.orders || []).map((o: any) => o.id)));
      }
    } catch {}
    finally { setLoadingOrders(false); }
  };

  const openGenerateWizard = () => {
    setGenerateStep(1);
    setGenerateDoctorId('');
    setGenerateDoctorSearch('');
    setDoctorOrders([]);
    setSelectedOrderIds(new Set());
    setGenerateResult(null);
    setCustomDueDate('');
    setWizardPeriodStart(null);
    setWizardPeriodEnd(null);
    setAvailablePeriods([]);
    setShowGenerate(true);
    fetchDoctorsWithOrders();
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }
      setSuccessMsg(`Invoice marked as ${status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchInvoices();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    setActionLoading(invoiceId);
    try {
      const res = await fetch(`/api/admin/invoices/${invoiceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete invoice');
      setSuccessMsg(data.message || 'Invoice deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      setDeleteConfirmId(null);
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    (invoices || []).forEach((inv: any) => {
      if (inv.period_start) {
        const d = new Date(inv.period_start);
        months.add(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);

  const filteredInvoices = (invoices || []).filter((inv: any) => {
    // Status filter
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    // Search filter
    if (invoiceSearch) {
      const q = invoiceSearch.toLowerCase();
      if (!(inv.invoice_number || '').toLowerCase().includes(q) &&
          !(inv.doctor?.full_name || '').toLowerCase().includes(q) &&
          !(inv.doctor?.practice_name || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    // Period filter
    if (periodFilterKey !== 'all') {
      const invMonth = new Date(inv.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (invMonth !== periodFilterKey) return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black">Invoices</h1>
          <p className="text-gray-500 text-[14px] mt-1">Generate and manage invoices for doctor-billed orders.</p>
        </div>
        <button
          onClick={openGenerateWizard}
          className="px-5 py-2.5 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[13px] font-medium transition-colors flex items-center gap-2 shrink-0"
        >
          <Receipt className="w-4 h-4" />
          Generate
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-[16px] text-sm font-medium border border-green-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error}</div>}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
        {/* Search — first, takes most space */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            placeholder="Search by invoice #, doctor..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-[13px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'issued', 'sent', 'paid', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-[#008085] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Period filter — simple select */}
        <select
          value={periodFilterKey}
          onChange={(e) => setPeriodFilterKey(e.target.value)}
          className="px-4 py-2.5 rounded-full border border-gray-200 text-[13px] bg-white appearance-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none shrink-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23999' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
          }}
        >
          <option value="all">All Periods</option>
          {availableMonths.map((m: string) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map(inv => {
            const isExpanded = expandedId === inv.id;
            return (
              <div key={inv.id} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[14px] text-[#008085] font-semibold">{inv.invoice_number}</span>
                        {/* Status badge */}
                        <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                          inv.status === 'sent' ? 'bg-blue-50 text-blue-700' :
                          inv.status === 'overdue' ? 'bg-red-50 text-red-700' :
                          inv.status === 'issued' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1)}
                        </span>
                      </div>
                      <div className="text-[13px] text-gray-500 mt-0.5">
                        {inv.doctor?.full_name || 'Unknown'} · {inv.doctor?.practice_name || ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[16px] font-mono font-medium text-near-black">€{Number(inv.total || 0).toFixed(2)}</div>
                      <div className="text-[12px] text-gray-400">
                        {new Date(inv.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {inv.due_date && inv.status !== 'paid' && (
                          <span className="ml-2 text-gray-300">· Due {formatDate(inv.due_date)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-6 pb-5 border-t border-gray-100 mt-1">
                    {/* Summary metrics */}
                    <div className="grid grid-cols-5 gap-4 py-4">
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Tests</div>
                        <div className="text-[14px] font-mono font-medium text-near-black mt-0.5">{formatCurrency(inv.subtotal || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Service Fee</div>
                        <div className="text-[14px] font-mono font-medium text-near-black mt-0.5">{formatCurrency(inv.service_fee_total || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">VAT</div>
                        <div className="text-[14px] font-mono font-medium text-near-black mt-0.5">{formatCurrency(inv.vat_total || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Total</div>
                        <div className="text-[14px] font-mono font-medium text-primary mt-0.5">{formatCurrency(inv.total || inv.gross_total || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wider">Due Date</div>
                        <div className="text-[14px] font-medium text-near-black mt-0.5">{inv.due_date ? formatDate(inv.due_date) : '—'}</div>
                      </div>
                    </div>

                    {/* Line items table */}
                    {(inv.line_items || inv.items) && (inv.line_items || inv.items).length > 0 && (
                      <div className="border border-gray-100 rounded-[12px] overflow-hidden max-h-[300px] overflow-y-auto">
                        <table className="w-full text-[13px]">
                          <thead>
                            <tr className="bg-gray-50/50">
                              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Order</th>
                              <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Patient</th>
                              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tests</th>
                              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Fee</th>
                              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Shipping</th>
                              <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(inv.line_items || inv.items).map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50/30">
                                <td className="px-4 py-2.5 font-mono text-[#008085] font-semibold">{item.display_id}</td>
                                <td className="px-4 py-2.5 text-gray-600">{item.patient_name}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600">€{Number(item.test_total || 0).toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600">€{Number(item.service_fee || 0).toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-right font-mono text-gray-600">€{Number(item.shipping || 0).toFixed(2)}</td>
                                <td className="px-4 py-2.5 text-right font-mono font-medium text-near-black">€{Number(item.line_total || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={async () => {
                          window.open(`/api/admin/invoices/${inv.id}/download`, '_blank');
                        }}
                        className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 text-[12px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={async () => { handleUpdateStatus(inv.id, 'paid') }}
                          className="px-4 py-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-[12px] font-medium transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Paid
                        </button>
                      )}
                      {inv.status === 'issued' && (
                        <button
                          onClick={async () => { handleUpdateStatus(inv.id, 'sent') }}
                          className="px-4 py-2 rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 text-[12px] font-medium transition-colors flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send to Doctor
                        </button>
                      )}
                      {inv.status !== 'paid' && (
                        <>
                          {deleteConfirmId === inv.id ? (
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-[12px] text-red-500">Delete this invoice?</span>
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[12px] font-medium hover:bg-red-600 transition-colors"
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 text-[12px] font-medium hover:border-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(inv.id)}
                              className="px-4 py-2 rounded-full border border-red-200 text-red-500 hover:bg-red-50 text-[12px] font-medium transition-colors flex items-center gap-1.5 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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
      )}

      {/* Generate Modal */}
      {showGenerate && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowGenerate(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-medium text-[18px] text-near-black">Generate Invoice</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {wizardPeriodStart 
                    ? `Period: ${new Date(wizardPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                    : 'Select a doctor and billing period'}
                </p>
              </div>
              <button onClick={() => setShowGenerate(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-3">
              {[
                { num: 1, label: 'Select Doctor' },
                { num: 2, label: 'Period & Orders' },
                { num: 3, label: 'Review' },
              ].map((s, i) => (
                <React.Fragment key={s.num}>
                  {i > 0 && <div className="w-8 h-[2px] bg-gray-200" />}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      generateStep === s.num ? 'bg-[#008085] text-white' :
                      generateStep > s.num ? 'bg-[#008085]/15 text-[#008085]' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {generateStep > s.num ? '✓' : s.num}
                    </div>
                    <span className={`text-[12px] font-medium ${
                      generateStep === s.num ? 'text-near-black' : 'text-gray-400'
                    }`}>{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">

              {/* STEP 1: Select Doctor */}
              {generateStep === 1 && (
                <div className="space-y-4">
                  <p className="text-[13px] text-gray-500">Select a doctor to generate an invoice for.</p>

                  {/* Search */}
                  <input
                    type="text"
                    value={generateDoctorSearch}
                    onChange={(e) => setGenerateDoctorSearch(e.target.value)}
                    placeholder="Search by name or practice..."
                    className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                  />

                  {loadingDoctors ? (
                    <div className="py-6 flex justify-center"><LoadingSpinner size="lg" /></div>
                  ) : (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {availableDoctors
                        .filter((d: any) => {
                          if (!generateDoctorSearch) return true;
                          const q = generateDoctorSearch.toLowerCase();
                          return (d.full_name || '').toLowerCase().includes(q) || (d.practice_name || '').toLowerCase().includes(q);
                        })
                        .map((doctor: any) => (
                          <label
                            key={doctor.id}
                            className={`flex items-center gap-4 p-4 rounded-[12px] cursor-pointer transition-all border-2 ${
                              generateDoctorId === doctor.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="generate-doctor"
                              value={doctor.id}
                              checked={generateDoctorId === doctor.id}
                              onChange={() => setGenerateDoctorId(doctor.id)}
                              className="hidden"
                            />
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-medium shrink-0">
                              {(doctor.full_name || '??').split(' ').filter((p: string) => !['dr.', 'med.', 'prof.'].includes(p.toLowerCase())).map((p: string) => p[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-[14px] font-medium text-near-black">{doctor.full_name}</div>
                              <div className="text-[12px] text-gray-400">{doctor.practice_name || 'No practice name'}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[14px] font-mono font-medium text-near-black">{doctor.order_count} orders</div>
                              <div className="text-[12px] text-gray-400">€{Number(doctor.total || 0).toFixed(2)}</div>
                            </div>
                          </label>
                        ))}
                      {availableDoctors.length === 0 && !loadingDoctors && (
                        <div className="py-6 text-center">
                          <p className="text-[14px] text-gray-400">No doctors with uninvoiced orders for this period.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Select Orders */}
              {generateStep === 2 && (
                <div className="space-y-4">
                  {/* Period Selector */}
                  <div>
                    <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Billing Period</div>
                    {loadingPeriods ? (
                      <div className="py-4 flex justify-center"><LoadingSpinner size="lg" /></div>
                    ) : availablePeriods.length === 0 ? (
                      <div className="py-4 text-center text-[14px] text-gray-400">No uninvoiced periods found for this doctor.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availablePeriods.map((period: any) => {
                          const isSelected = wizardPeriodStart?.toISOString() === period.period_start;
                          return (
                            <button
                              key={period.period_start}
                              onClick={() => {
                                setWizardPeriodStart(new Date(period.period_start));
                                setWizardPeriodEnd(new Date(period.period_end));
                                fetchDoctorOrders(generateDoctorId, period.period_start, period.period_end);
                              }}
                              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all border-2 ${
                                isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                              }`}
                            >
                              {new Date(period.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              <span className="ml-2 text-[11px] text-gray-400">{period.order_count} orders</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Orders List */}
                  {wizardPeriodStart && (
                    <>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Orders</div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedOrderIds(new Set(doctorOrders.map((o: any) => o.id)))}
                              className="text-[12px] text-[#008085] font-medium hover:underline"
                            >
                              Select all
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => setSelectedOrderIds(new Set())}
                              className="text-[12px] text-gray-400 font-medium hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {loadingOrders ? (
                        <div className="py-4 flex justify-center"><LoadingSpinner size="lg" /></div>
                      ) : doctorOrders.length === 0 ? (
                        <div className="py-4 text-center text-[14px] text-gray-400">No uninvoiced orders for this period.</div>
                      ) : (
                        <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                          {doctorOrders.map((order: any) => {
                            const isSelected = selectedOrderIds.has(order.id);
                            return (
                              <label
                                key={order.id}
                                className={`flex items-center gap-3 p-3 rounded-[12px] cursor-pointer transition-colors ${
                                  isSelected ? 'bg-[#008085]/5 border border-[#008085]/20' : 'hover:bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const next = new Set(selectedOrderIds);
                                    if (e.target.checked) next.add(order.id);
                                    else next.delete(order.id);
                                    setSelectedOrderIds(next);
                                  }}
                                  className="rounded text-[#008085] focus:ring-[#008085]"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[13px] text-[#008085] font-semibold">{order.display_id}</span>
                                    <span className="text-[13px] text-gray-500">{order.patient?.first_name} {order.patient?.last_name}</span>
                                  </div>
                                  <div className="text-[12px] text-gray-400 mt-0.5">{formatDate(order.created_at)}</div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[13px] font-mono text-near-black">€{Number(order.total || order.test_costs_total || 0).toFixed(2)}</div>
                                  <div className="text-[11px] text-gray-400">Fee: €{Number(order.service_fee_amount || 0).toFixed(2)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Running total */}
                      {doctorOrders.length > 0 && (
                        <div className="bg-gray-50 rounded-[12px] p-3 flex items-center justify-between">
                          <span className="text-[13px] text-gray-500">{selectedOrderIds.size} order{selectedOrderIds.size !== 1 ? 's' : ''} selected</span>
                          <span className="text-[15px] font-heading font-medium text-primary">
                            €{doctorOrders.filter((o: any) => selectedOrderIds.has(o.id)).reduce((sum: number, o: any) => sum + Number(o.total || o.test_costs_total || 0), 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: Review & Generate */}
              {generateStep === 3 && (
                <div className="space-y-4">
                  {generateResult ? (
                    // Show result
                    <div className={`rounded-[12px] p-4 ${generateResult.error ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                      {generateResult.error ? (
                        <div className="text-[14px] text-red-600">{generateResult.error}</div>
                      ) : (
                        <div>
                          <div className="text-[14px] font-medium text-emerald-700 mb-1">Invoice generated successfully!</div>
                          <div className="text-[13px] text-emerald-600">
                            Invoice #{generateResult.invoice_number || ''} — €{Number(generateResult.gross_total || generateResult.total || 0).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Show summary before generating
                    <>
                      <div className="bg-gray-50 rounded-[12px] p-4 space-y-3">
                        <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Summary</div>
                        <div className="text-[13px] text-gray-600 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Doctor</span>
                            <span className="font-medium text-near-black">
                              {availableDoctors.find((d: any) => d.id === generateDoctorId)?.full_name || 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Practice</span>
                            <span className="font-medium text-near-black">
                              {availableDoctors.find((d: any) => d.id === generateDoctorId)?.practice_name || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Period</span>
                            <span className="font-medium text-near-black">
                              {wizardPeriodStart ? new Date(wizardPeriodStart).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Orders</span>
                            <span className="font-medium text-near-black">{selectedOrderIds.size}</span>
                          </div>
                          {/* Optional due date override */}
                          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
                            <div>
                              <span className="text-gray-500">Due Date</span>
                              <p className="text-[11px] text-gray-400 mt-0.5">Leave empty for platform default</p>
                            </div>
                            <input
                              type="date"
                              value={customDueDate}
                              onChange={(e) => setCustomDueDate(e.target.value)}
                              className="px-3 py-1.5 rounded-full border border-gray-200 text-[13px] text-near-black focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                            />
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[14px] font-medium text-near-black">Estimated Total</span>
                            <span className="text-[18px] font-heading font-medium text-primary">
                              €{doctorOrders.filter((o: any) => selectedOrderIds.has(o.id)).reduce((sum: number, o: any) => sum + Number(o.total || o.test_costs_total || 0), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 rounded-[12px] p-3 text-[12px] text-amber-700">
                        This will generate a PDF invoice, link the selected orders, and increment the invoice counter. This action cannot be undone.
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              {generateStep === 1 ? (
                <>
                  <div />
                  <button
                    onClick={() => {
                      if (!generateDoctorId) { return; }
                      fetchDoctorPeriods(generateDoctorId);
                      setGenerateStep(2);
                    }}
                    disabled={!generateDoctorId}
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Period & Orders →
                  </button>
                </>
              ) : generateStep === 2 ? (
                <>
                  <button
                    onClick={() => setGenerateStep(1)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (selectedOrderIds.size === 0) return;
                      setGenerateStep(3);
                    }}
                    disabled={selectedOrderIds.size === 0}
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Review →
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => generateResult ? setShowGenerate(false) : setGenerateStep(2)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200"
                  >
                    {generateResult ? 'Close' : '← Back'}
                  </button>
                  {!generateResult && (
                    <button
                      onClick={async () => {
                        setGenerating(true);
                        try {
                          const res = await fetch('/api/admin/invoices/generate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              action: 'generate_single',
                              doctor_id: generateDoctorId,
                              order_ids: Array.from(selectedOrderIds),
                              period_start: wizardPeriodStart?.toISOString(),
                              period_end: wizardPeriodEnd?.toISOString(),
                              custom_due_date: customDueDate || undefined,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to generate invoice');
                          setGenerateResult(data);
                          fetchInvoices(); // refresh the list
                        } catch (err: any) {
                          setGenerateResult({ error: err.message });
                        } finally {
                          setGenerating(false);
                        }
                      }}
                      disabled={generating}
                      className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Receipt className="w-4 h-4" /> Generate Invoice</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
