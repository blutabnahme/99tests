"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, ShoppingCart, TrendingUp, TrendingDown, Clock,
  Users, AlertCircle, ExternalLink, CheckCircle2, ArrowRight,
  ShieldCheck, Mail, Building2, ChevronDown, ChevronRight, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import OrderKanban from '@/components/admin/OrderKanban';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function formatCurrency(n: number): string {
  return `€${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

import { formatDate } from '@/lib/format-date';

function formatPaymentMethod(m: string): string {
  const map: Record<string, string> = {
    'doctor_invoice': 'Doctor Invoice',
    'bank_transfer': 'Bank Transfer', 
    'bank': 'Bank Transfer',
    'card': 'Credit Card',
    'credit_card': 'Credit Card',
    'sepa': 'SEPA',
    'mock': 'Mock',
  };
  return map[m] || m || '-';
}

function MetricCard({ label, value, subtitle, icon: Icon, trend, trendLabel }: {
  label: string; value: string; subtitle?: string; icon: any; trend?: 'up' | 'down' | 'neutral'; trendLabel?: string;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[12px] font-medium px-2 py-1 rounded-full ${
            trend === 'up' ? 'text-green-700 bg-green-50' : 
            trend === 'down' ? 'text-red-700 bg-red-50' : 
            'text-gray-600 bg-gray-100'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendLabel}
          </div>
        )}
      </div>
      <div className="text-[28px] font-heading font-medium text-near-black mb-1 leading-none">{value}</div>
      <div className="text-[14px] font-medium text-gray-800">{label}</div>
      {subtitle && <div className="text-[12px] text-gray-500 mt-1">{subtitle}</div>}
    </div>
  );
}

function RevenueChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  
  const totalRevenue = data.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const totalOrders = data.reduce((sum, d) => sum + (d.orders || 0), 0);
  
  return (
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-heading font-medium text-[16px] text-near-black">Revenue</h2>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-[22px] font-heading font-medium text-near-black">€{totalRevenue.toFixed(2)}</span>
            <span className="text-[13px] text-gray-400">{totalOrders} order(s)</span>
          </div>
        </div>
        <span className="text-[12px] font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-500">Last 30 Days</span>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#008085" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#008085" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              interval={4}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={(v) => v > 0 ? `€${v}` : ''}
              width={45}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: '1px solid #E5E7EB', 
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
              }}
              formatter={(value: number) => [`€${value.toFixed(2)}`, 'Revenue']}
              labelStyle={{ fontWeight: 500, marginBottom: 4 }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#008085" 
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#008085', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleVerifyDoctor = async (id: string, action: 'approve' | 'reject') => {
    setVerifyingId(id);
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Verification failed');
      
      setData((prev: any) => ({
        ...prev,
        pending_verifications: prev.pending_verifications.filter((d: any) => d.id !== id)
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleConfirmTransfer = async (id: string) => {
    setConfirmingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/confirm-payment`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Payment confirmation failed');
      
      setData((prev: any) => ({
        ...prev,
        pending_transfers: prev.pending_transfers.filter((t: any) => t.id !== id)
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center flex-1 items-center py-20 min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">
        {error}
      </div>
    );
  }

  const m = data?.metrics || {};
  const ordersTrend = m.orders_last_month > 0
    ? ((m.orders_this_month - m.orders_last_month) / m.orders_last_month * 100).toFixed(0)
    : null;
  const revenueTrend = m.revenue_last_month > 0
    ? ((m.revenue_this_month - m.revenue_last_month) / m.revenue_last_month * 100).toFixed(0)
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 text-[14px] mt-1">Platform overview and pending actions</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={ShoppingCart}
          value={String(m.orders_this_month || 0)}
          label="Orders this month"
          subtitle={`${m.orders_last_month || 0} last month`}
          trend={ordersTrend ? (Number(ordersTrend) >= 0 ? 'up' : 'down') : 'neutral'}
          trendLabel={ordersTrend ? `${Number(ordersTrend) >= 0 ? '+' : ''}${ordersTrend}%` : 'No data'}
        />
        <MetricCard
          icon={TrendingUp}
          value={formatCurrency(m.revenue_this_month || 0)}
          label="Revenue this month"
          subtitle={`${formatCurrency(m.revenue_last_month || 0)} last month`}
          trend={revenueTrend ? (Number(revenueTrend) >= 0 ? 'up' : 'down') : 'neutral'}
          trendLabel={revenueTrend ? `${Number(revenueTrend) >= 0 ? '+' : ''}${revenueTrend}%` : 'No data'}
        />
        <MetricCard
          icon={Clock}
          value={String(m.awaiting_payment || 0)}
          label="Awaiting payment"
          subtitle="Bank transfers pending"
        />
        <MetricCard
          icon={Users}
          value={String(m.active_doctors || 0)}
          label="Active doctors"
        />
      </div>

      {/* Middle row: Pending Verifications + Pending Transfers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Verifications */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <h2 className="font-heading font-medium text-[16px] text-near-black flex items-center gap-2 !normal-case">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Pending Verifications
            </h2>
            {(data?.pending_verifications?.length || 0) > 0 && (
              <span className="text-[12px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {data.pending_verifications.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-100 flex-1 overflow-y-auto min-h-[150px] max-h-[300px]">
            {(data?.pending_verifications || []).length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-[14px]">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                No pending verifications
              </div>
            ) : (
              (data.pending_verifications || []).map((doc: any) => {
                const isExpanded = expandedDoctor === doc.id;
                return (
                  <div key={doc.id} className="flex flex-col">
                    <button
                      onClick={() => setExpandedDoctor(isExpanded ? null : doc.id)}
                      className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left w-full"
                    >
                      <div className="flex items-center gap-2 text-[14px] font-medium text-near-black">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        {doc.full_name || 'Unnamed Doctor'}
                      </div>
                      <span className="text-[12px] text-gray-400">{formatDate(doc.created_at)}</span>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-1 bg-gray-50/30">
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-[13px] text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {doc.email}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-gray-600">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {doc.practice_name || 'No practice specified'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleVerifyDoctor(doc.id, 'approve')}
                            disabled={verifyingId === doc.id}
                            className="flex-1 rounded-full text-[12px] h-8"
                          >
                            {verifyingId === doc.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : <><Check className="w-3 h-3 mr-1" /> Approve</>}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleVerifyDoctor(doc.id, 'reject')}
                            disabled={verifyingId === doc.id}
                            className="flex-1 rounded-full text-[12px] h-8 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <X className="w-3 h-3 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pending Bank Transfers */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading font-medium text-[16px] text-near-black normal-case flex items-center gap-2 uppercase tracking-wide">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Pending Transfers
            </h2>
            {(data?.pending_transfers?.length || 0) > 0 && (
              <span className="text-[12px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {data.pending_transfers.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
            {(data?.pending_transfers || []).length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-[14px]">
                <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                No pending transfers
              </div>
            ) : (
              (data.pending_transfers || []).map((t: any) => (
                <div key={t.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium text-near-black">
                      {t.patient?.first_name} {t.patient?.last_name}
                    </div>
                    <div className="text-[12px] text-gray-500 flex items-center gap-2">
                      <span className="font-mono">{t.display_id}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-mono">{formatCurrency(Number(t.total) || 0)}</span>
                      <span className="text-gray-300">·</span>
                      <span>{formatDate(t.created_at)}</span>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => handleConfirmTransfer(t.id)}
                    disabled={confirmingId === t.id}
                    className="rounded-full text-[12px] h-8 px-3 shrink-0 ml-3"
                  >
                    {confirmingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Order Kanban */}
      <OrderKanban orders={data?.kanban_orders || []} />

      {/* Recent Orders */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-heading font-medium text-[16px] text-near-black normal-case">Recent Orders</h2>
          <Link href="/admin/orders" className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px] whitespace-nowrap">
            <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-body">
              {(data?.recent_orders || []).map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-[13px] text-primary hover:underline font-semibold">
                      {order.display_id || order.id?.substring(0, 8)}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-near-black font-medium">
                    {order.patient?.first_name} {order.patient?.last_name}
                  </td>
                  <td className="px-6 py-3 text-gray-600 truncate max-w-[120px]">
                    {order.doctor?.full_name || '-'}
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-900">
                    {order.total != null ? formatCurrency(Number(order.total)) : '-'}
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-[13px]">
                    {formatPaymentMethod(order.payment_method)}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={order.status || 'preparing'} />
                  </td>
                  <td className="px-6 py-3 text-gray-500 text-[13px]">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="p-1.5 text-gray-400 hover:text-primary rounded-full transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {(data?.recent_orders || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={data?.revenue_chart || []} />
    </div>
  );
}
