"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import {
  Loader2, Receipt, Plus, Eye, Send, CheckCircle2, XCircle,
  Calendar, AlertCircle, ChevronDown, ChevronRight, Download
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createPortal } from 'react-dom';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-50 text-blue-700',
    paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-600',
    cancelled: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerateResult(null);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', period_start: periodStart, period_end: periodEnd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setGenerateResult(data);
      if (data.invoices_created > 0) await fetchInvoices();
    } catch (err: any) { setGenerateResult({ error: err.message }); }
    finally { setGenerating(false); }
  };

  const handleUpdateStatus = async (invoiceId: string, status: string) => {
    const confirmMsg = status === 'paid' ? 'Mark this invoice as paid?' : status === 'sent' ? 'Mark as sent to doctor?' : `Change status to ${status}?`;
    if (!confirm(confirmMsg)) return;
    setActionLoading(invoiceId);
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', invoice_id: invoiceId, status }),
      });
      if (!res.ok) throw new Error('Failed');
      setSuccessMsg(`Invoice marked as ${status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await fetchInvoices();
    } catch (err: any) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>Doctor Invoices</h1>
          <p className="text-gray-500 text-[14px] mt-1">Generate and manage monthly invoices for doctor-billed orders.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={genMonth}
            onChange={(e) => setGenMonth(e.target.value)}
            className="h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          <button
            onClick={async () => {
              const [year, month] = genMonth.split('-').map(Number);
              const periodStart = new Date(year, month - 1, 1);
              const periodEnd = new Date(year, month, 0, 23, 59, 59);
              if (!confirm(`Generate invoices for ${periodStart.toLocaleString('en', { month: 'long', year: 'numeric' })}?`)) return;
              setGenerating(true);
              try {
                const res = await fetch('/api/admin/invoices/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    period_start: periodStart.toISOString(),
                    period_end: periodEnd.toISOString(),
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to generate');
                alert(`Generated ${data.invoices_created} invoice(s)`);
                window.location.reload();
              } catch (err: any) {
                alert(err.message);
              } finally {
                setGenerating(false);
              }
            }}
            disabled={generating}
            className="h-11 px-6 rounded-full bg-primary text-white text-[14px] font-semibold hover:bg-[#005C5F] transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 rounded-[16px] text-sm font-medium border border-green-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}
        </div>
      )}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error}</div>}

      {/* Invoices List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No invoices generated yet</p>
          <p className="text-gray-400 text-[13px] mt-1">Use "Generate Invoices" to create monthly invoices for doctor-billed orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => {
            const isExpanded = expandedId === inv.id;
            return (
              <div key={inv.id} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                >
                  <div className="text-gray-300 shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[14px] font-semibold text-primary">{inv.invoice_number}</span>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <div className="text-[13px] text-gray-500">
                      {inv.doctor?.full_name || 'Unknown'} · {inv.doctor?.practice_name || ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-semibold text-[16px] text-near-black">{formatCurrency(inv.total)}</div>
                    <div className="text-[12px] text-gray-400">{formatDate(inv.period_start)} – {formatDate(inv.period_end)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    {inv.status === 'draft' && (
                      <button onClick={() => handleUpdateStatus(inv.id, 'sent')} disabled={actionLoading === inv.id} className="p-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors" title="Mark as sent">
                        {actionLoading === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    )}
                    {(inv.status === 'draft' || inv.status === 'sent' || inv.status === 'overdue') && (
                      <button onClick={() => handleUpdateStatus(inv.id, 'paid')} disabled={actionLoading === inv.id} className="p-2 text-gray-400 hover:text-green-600 rounded-full transition-colors" title="Mark as paid">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    <div className="px-6 py-3 bg-gray-50/50 grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
                      <div><span className="text-gray-500">Subtotal:</span> <span className="font-mono text-gray-700">{formatCurrency(inv.subtotal)}</span></div>
                      <div><span className="text-gray-500">Service Fee:</span> <span className="font-mono text-gray-700">{formatCurrency(inv.service_fee_total)}</span></div>
                      <div><span className="text-gray-500">VAT:</span> <span className="font-mono text-gray-700">{formatCurrency(inv.vat_total)}</span></div>
                      <div><span className="text-gray-500">Total:</span> <span className="font-mono font-semibold text-primary">{formatCurrency(inv.total)}</span></div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[13px] whitespace-nowrap">
                        <thead className="bg-gray-50/30 text-gray-500 font-medium text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-2">Order</th>
                            <th className="px-6 py-2">Patient</th>
                            <th className="px-6 py-2">Tests</th>
                            <th className="px-6 py-2">Service Fee</th>
                            <th className="px-6 py-2">Shipping</th>
                            <th className="px-6 py-2">VAT</th>
                            <th className="px-6 py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(inv.items || []).map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-2 font-mono text-primary font-semibold">{item.display_id}</td>
                              <td className="px-6 py-2 text-gray-700">{item.patient_name}</td>
                              <td className="px-6 py-2 font-mono text-gray-600">{formatCurrency(item.test_total)}</td>
                              <td className="px-6 py-2 font-mono text-gray-600">{formatCurrency(item.service_fee)}</td>
                              <td className="px-6 py-2 font-mono text-gray-600">{formatCurrency(item.shipping)}</td>
                              <td className="px-6 py-2 font-mono text-gray-600">{formatCurrency(item.vat)}</td>
                              <td className="px-6 py-2 font-mono font-semibold text-gray-800">{formatCurrency(item.line_total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {inv.notes && (
                      <div className="px-6 py-3 border-t border-gray-100 text-[13px] text-gray-500">
                        <span className="font-semibold">Notes:</span> {inv.notes}
                      </div>
                    )}
                    {inv.paid_at && (
                      <div className="px-6 py-2 border-t border-gray-100 text-[12px] text-gray-400">
                        Paid on {formatDate(inv.paid_at)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => !generating && setShowGenerate(false)}>
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-heading font-medium text-[20px] text-near-black mb-1" style={{ textTransform: 'none' }}>Generate Invoices</h2>
            <p className="text-[14px] text-gray-500 mb-5">Create invoices for all doctor-billed orders in the selected period.</p>

            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Period Start</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Period End</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>

            {generateResult && (
              <div className={`mb-4 p-3 rounded-[10px] text-[13px] font-medium ${
                generateResult.error ? 'bg-red-50 text-red-600 border border-red-100' :
                generateResult.invoices_created > 0 ? 'bg-green-50 text-green-700 border border-green-100' :
                'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                {generateResult.error ? generateResult.error :
                 generateResult.invoices_created > 0 ? `${generateResult.invoices_created} invoice(s) generated successfully.` :
                 generateResult.message || 'No orders found for this period.'}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => { setShowGenerate(false); setGenerateResult(null); }} className="rounded-full px-5 h-10 text-[14px]" disabled={generating}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerate} className="rounded-full px-5 h-10 text-[14px]" disabled={generating || !periodStart || !periodEnd}>
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Receipt className="w-4 h-4 mr-1.5" />}
                Generate
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
