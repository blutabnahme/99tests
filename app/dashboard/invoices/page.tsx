"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt, ChevronLeft, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, FileText, Download
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/lib/format-date';
function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function getMonthYearLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function InvoiceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', icon: FileText, label: 'Draft' },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, label: 'Sent' },
    paid: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: 'Paid' },
    overdue: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertTriangle, label: 'Overdue' },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-bold uppercase px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <Icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function DoctorInvoicesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Month navigation
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [navOffset, setNavOffset] = useState(0); // how many months back the visible window starts
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/doctor/invoices');
        if (!res.ok) throw new Error('Failed to load invoices');
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetchInvoices();
  }, []);

  // Generate visible months (5 months visible at a time)
  const visibleMonths = useMemo(() => {
    const months: Date[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - navOffset - i, 1);
      months.push(d);
    }
    return months;
  }, [navOffset]);

  const selectedKey = getMonthKey(selectedMonth);
  const currentKey = getMonthKey(now);
  const isCurrentMonth = selectedKey === currentKey;

  // Find invoice for selected month
  const monthInvoice = useMemo(() => {
    if (!data?.invoices) return null;
    return data.invoices.find((inv: any) => {
      const start = new Date(inv.period_start);
      return getMonthKey(start) === selectedKey;
    });
  }, [data?.invoices, selectedKey]);

  // Filter pending orders for selected month
  const monthOrders = useMemo(() => {
    if (!data?.pending_orders) return [];
    return data.pending_orders.filter((o: any) => {
      const d = new Date(o.created_at);
      return getMonthKey(d) === selectedKey;
    });
  }, [data?.pending_orders, selectedKey]);

  // Calculate totals for current view
  const viewTotals = useMemo(() => {
    if (monthInvoice) {
      return {
        orders: monthInvoice.items?.length || 0,
        tests: Number(monthInvoice.subtotal) || 0,
        fees: Number(monthInvoice.service_fee_total) || 0,
        vat: Number(monthInvoice.vat_total) || 0,
        total: Number(monthInvoice.total) || 0,
      };
    }
    const orders = monthOrders;
    return {
      orders: orders.length,
      tests: orders.reduce((s: number, o: any) => s + (Number(o.test_costs_total) || 0), 0),
      fees: orders.reduce((s: number, o: any) => s + (Number(o.service_fee_amount) || 0), 0),
      vat: orders.reduce((s: number, o: any) => s + (Number(o.vat_amount) || 0), 0),
      total: orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0),
    };
  }, [monthInvoice, monthOrders]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error}</div>;

  const hasContent = monthInvoice || monthOrders.length > 0;

  return (
    <>
      <style>{`
        @keyframes slideFromLeft {
          from { transform: translateX(-10px); }
          to { transform: translateX(0); }
        }
        @keyframes slideFromRight {
          from { transform: translateX(10px); }
          to { transform: translateX(0); }
        }
        .animate-slide-left {
          animation: slideFromLeft 0.15s ease-out;
        }
        .animate-slide-right {
          animation: slideFromRight 0.15s ease-out;
        }
      `}</style>
      <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>Invoices</h1>
        <p className="text-gray-500 text-[14px] mt-1">Monthly billing for doctor-paid recommendations.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-[20px] font-heading font-medium text-near-black">{data?.summary?.pending_count || 0}</div>
            <div className="text-[12px] text-gray-500">Current Period</div>
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-[20px] font-heading font-medium text-near-black">{formatCurrency(data?.summary?.pending_total || 0)}</div>
            <div className="text-[12px] text-gray-500">Period Total</div>
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[20px] font-heading font-medium text-near-black">{formatCurrency(data?.summary?.total_outstanding || 0)}</div>
            <div className="text-[12px] text-gray-500">Outstanding</div>
          </div>
        </div>
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-[20px] font-heading font-medium text-near-black">{formatCurrency(data?.summary?.total_paid || 0)}</div>
            <div className="text-[12px] text-gray-500">Total Paid</div>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Month navigator */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-medium text-[18px] text-near-black" style={{ textTransform: 'none' }}>{getMonthYearLabel(selectedMonth)}</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {isCurrentMonth ? 'Current billing period' : monthInvoice ? `Invoice ${monthInvoice.invoice_number}` : 'No invoice'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSlideDirection('right'); setNavOffset(prev => prev + 1); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-150 active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="overflow-hidden rounded-full bg-gray-100">
              <div key={`nav-${navOffset}`} className={`flex items-center gap-1 p-1 ${slideDirection === 'left' ? 'animate-slide-left' : slideDirection === 'right' ? 'animate-slide-right' : ''}`}>
                {visibleMonths.map(m => {
                  const key = getMonthKey(m);
                  const isSelected = key === selectedKey;
                  const isCurrent = key === currentKey;
                  // Check if month has an invoice
                  const hasInvoice = data?.invoices?.some((inv: any) => getMonthKey(new Date(inv.period_start)) === key);
                  const hasOrders = data?.pending_orders?.some((o: any) => getMonthKey(new Date(o.created_at)) === key);
                  const hasDot = hasInvoice || hasOrders;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedMonth(m)}
                      className={`relative px-3 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-white text-near-black shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {getMonthLabel(m)}
                      {hasDot && !isSelected && (
                        <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${hasInvoice ? 'bg-primary' : 'bg-gray-300'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              onClick={() => { setSlideDirection('left'); setNavOffset(prev => Math.max(0, prev - 1)); }}
              disabled={navOffset === 0}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice status bar (for past months with invoice) */}
        {monthInvoice && (
          <div className="px-6 py-3 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InvoiceStatusBadge status={monthInvoice.status} />
              <span className="text-[12px] text-gray-500">
                {getMonthYearLabel(new Date(monthInvoice.period_start))}
              </span>
              {monthInvoice.paid_at && (
                <span className="text-[12px] text-green-600">Paid {formatDate(monthInvoice.paid_at)}</span>
              )}
            </div>
            <button className="flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline">
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        )}

        {/* Content */}
        {!hasContent ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-[14px]">No orders in this period</p>
          </div>
        ) : (
          <div>
            {/* Orders table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-gray-50/30 text-gray-500 font-medium text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-2.5">Order</th>
                    <th className="px-6 py-2.5">Patient</th>
                    <th className="px-6 py-2.5 text-right">Tests</th>
                    <th className="px-6 py-2.5 text-right">Fee</th>
                    <th className="px-6 py-2.5 text-right">Total</th>
                    <th className="px-6 py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthInvoice ? (
                    /* Past invoice — show line items */
                    (monthInvoice.items || []).map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/dashboard/recommendations/${item.recommendation_id || item.id}`} className="font-mono text-primary font-semibold hover:underline">
                            {item.display_id}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{item.patient_name}</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-500">{formatCurrency(item.test_total)}</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-500">{formatCurrency(item.service_fee)}</td>
                        <td className="px-6 py-3 text-right font-mono font-medium text-gray-800">{formatCurrency(item.line_total)}</td>
                        <td className="px-6 py-3 text-right text-gray-500 text-[12px]">{formatDate(item.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    /* Current period — show pending orders */
                    monthOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3">
                          <Link href={`/dashboard/recommendations/${order.recommendation_id || order.id}`} className="font-mono text-primary font-semibold hover:underline">
                            {order.display_id || '-'}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-gray-700">{order.patient?.first_name} {order.patient?.last_name}</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-500">{formatCurrency(Number(order.test_costs_total) || 0)}</td>
                        <td className="px-6 py-3 text-right font-mono text-gray-500">{formatCurrency(Number(order.service_fee_amount) || 0)}</td>
                        <td className="px-6 py-3 text-right font-mono font-medium text-gray-800">{formatCurrency(Number(order.total) || 0)}</td>
                        <td className="px-6 py-3 text-right text-gray-500 text-[12px]">{formatDate(order.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="px-6 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[13px] text-gray-500">
                <span>{viewTotals.orders} order{viewTotals.orders !== 1 ? 's' : ''}</span>
                <span className="text-gray-300">·</span>
                <span>Tests {formatCurrency(viewTotals.tests)}</span>
                <span className="text-gray-300">·</span>
                <span>Fees {formatCurrency(viewTotals.fees)}</span>
                <span className="text-gray-300">·</span>
                <span>VAT {formatCurrency(viewTotals.vat)}</span>
              </div>
              <span className="font-mono font-semibold text-primary text-[20px]">{formatCurrency(viewTotals.total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Hint for current month */}
      {isCurrentMonth && monthOrders.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-[12px]">
          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-[12px] text-gray-400">Invoice will be generated at the end of the billing period.</span>
        </div>
      )}
    </div>
    </>
  );
}
