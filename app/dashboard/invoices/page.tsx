"use client";
import { useState, useEffect, useMemo } from "react";
import { Receipt, Clock, CheckCircle2, Download, ChevronRight, Search, FileText, AlertCircle } from "lucide-react";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format-date';

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

export default function DoctorInvoicesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'upcoming'>('invoices');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/doctor/invoices');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!data?.invoices) return [];
    return data.invoices.filter((inv: any) => {
      // Status filter
      if (statusFilter === 'unpaid' && inv.status === 'paid') return false;
      if (statusFilter === 'paid' && inv.status !== 'paid') return false;
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!(inv.invoice_number || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data?.invoices, statusFilter, searchQuery]);

  const handleDownload = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/doctor/invoices/${invoiceId}/download`);
      if (res.ok) {
        const json = await res.json();
        window.open(json.url, '_blank');
      }
    } catch (err: any) {
      alert('Download error: ' + err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  const summary = data?.summary || {};
  const pendingOrders = data?.pending_orders || [];
  const invoices = data?.invoices || [];

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] sm:text-[28px] text-near-black">Invoices</h1>
        <p className="text-[13px] text-gray-500 mt-1">Your billing history and upcoming charges.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="text-[22px] font-heading font-medium text-near-black">{formatCurrency(summary.total_outstanding || 0)}</div>
            <div className="text-[13px] text-gray-500">Outstanding</div>
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-[22px] font-heading font-medium text-near-black">{formatCurrency(summary.pending_total || 0)}</div>
            <div className="text-[13px] text-gray-500">Upcoming ({summary.pending_count || 0} orders)</div>
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-[22px] font-heading font-medium text-near-black">{formatCurrency(summary.total_paid || 0)}</div>
            <div className="text-[13px] text-gray-500">Paid</div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'invoices', label: 'Invoices', count: invoices.length },
          { key: 'upcoming', label: 'Upcoming', count: pendingOrders.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-near-black'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold rounded-full px-1 ${
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-4 mt-4">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice number..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-[13px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {['all', 'unpaid', 'paid'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as any)}
                  className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-[#008085] text-white'
                      : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'unpaid' ? 'Unpaid' : 'Paid'}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice list */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm py-10 text-center">
              <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] text-gray-400">
                {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
              </p>
              {invoices.length === 0 && (
                <p className="text-[12px] text-gray-300 mt-1">Invoices will appear here once generated by the admin.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((inv: any) => {
                const isExpanded = expandedInvoice === inv.id;
                const lineItems = inv.line_items || inv.items || [];
                const periodLabel = inv.period_start
                  ? new Date(inv.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : '';

                return (
                  <div key={inv.id} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                    {/* Collapsed row */}
                    <button
                      onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[14px] text-[#008085] font-semibold">{inv.invoice_number}</span>
                            <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                              inv.status === 'overdue' ? 'bg-red-50 text-red-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {inv.status === 'paid' ? 'Paid' :
                               inv.status === 'overdue' ? 'Overdue' :
                               'Unpaid'}
                            </span>
                          </div>
                          <div className="text-[12px] text-gray-400 mt-0.5">{periodLabel}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-mono font-medium text-near-black">{formatCurrency(inv.total || inv.gross_total || 0)}</div>
                        {inv.due_date && inv.status !== 'paid' && (
                          <div className="text-[11px] text-gray-400">Due {formatDate(inv.due_date)}</div>
                        )}
                        {inv.paid_at && inv.status === 'paid' && (
                          <div className="text-[11px] text-emerald-500">Paid {formatDate(inv.paid_at)}</div>
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-gray-100">
                        {/* Summary metrics */}
                        <div className="grid grid-cols-4 gap-4 py-4">
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
                        </div>

                        {/* Line items */}
                        {lineItems.length > 0 && (
                          <div className="border border-gray-100 rounded-[12px] overflow-hidden max-h-[300px] overflow-y-auto">
                            <table className="w-full text-[13px]">
                              <thead>
                                <tr className="bg-gray-50/50">
                                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Order</th>
                                  <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Patient</th>
                                  <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tests</th>
                                  <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Fee</th>
                                  <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {lineItems.map((item: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-2.5 font-mono text-[#008085] font-semibold">{item.display_id}</td>
                                    <td className="px-4 py-2.5 text-gray-600">{item.patient_name}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-600">{formatCurrency(item.test_total || 0)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono text-gray-600">{formatCurrency(item.service_fee || 0)}</td>
                                    <td className="px-4 py-2.5 text-right font-mono font-medium text-near-black">{formatCurrency(item.line_total || 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Download */}
                        <div className="mt-4">
                          <button
                            onClick={() => handleDownload(inv.id)}
                            className="px-4 py-2 rounded-full border border-[#008085] text-[#008085] hover:bg-[#008085]/5 text-[13px] font-medium transition-colors flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* UPCOMING TAB */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4 mt-4">
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] text-gray-400">No pending charges</p>
              <p className="text-[12px] text-gray-300 mt-1">All your orders have been invoiced.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50/50 rounded-[12px] p-4">
                <p className="text-[13px] text-blue-700">
                  These orders will be included in your next invoice. The invoice will be generated at the end of the billing period.
                </p>
              </div>

              <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Order</th>
                      <th className="text-left px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Patient</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Tests</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Fee</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Shipping</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Total</th>
                      <th className="text-right px-4 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50/30">
                        <td className="px-4 py-3 font-mono text-[#008085] font-semibold">{order.display_id}</td>
                        <td className="px-4 py-3 text-gray-600">{order.patient?.first_name} {order.patient?.last_name}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(order.test_costs_total || 0)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(order.service_fee_amount || 0)}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(order.shipping_cost || 0)}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-near-black">{formatCurrency(order.total || 0)}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Upcoming total */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-[12px]">
                <span className="text-[13px] text-gray-500">
                  {pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} pending
                </span>
                <span className="text-[16px] font-heading font-medium text-primary">
                  {formatCurrency(summary.pending_total || 0)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
