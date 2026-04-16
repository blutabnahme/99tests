"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Wallet, Building2, Receipt, Users, Package,
  ArrowUpRight, ArrowDownRight, Download
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { formatDate } from '@/lib/format-date';

const COLORS = ['#008085', '#005C5F', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function formatCompact(n: number): string {
  if (n >= 1000000) return `€${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}K`;
  return `€${n.toFixed(2)}`;
}

function formatPeriod(key: string): string {
  // Converts "2026-03" -> "Mar 2026" or "2026-W12" -> "W12 2026"
  if (key.includes('-W')) {
    const [year, week] = key.split('-');
    return `${week} ${year}`;
  }
  const [year, month] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1] || month} ${year}`;
}

export default function AdminFinancialPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<'30d' | '90d' | '6m' | 'year' | 'all'>('all');
  const [breakdownView, setBreakdownView] = useState<'weekly' | 'monthly'>('monthly');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/financial');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch financial data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    if (!data?.orders) return [];
    const now = new Date();
    let cutoff: Date | null = null;

    switch (dateFilter) {
      case '30d': cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case '6m': cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
      case 'year': cutoff = new Date(now.getFullYear(), 0, 1); break;
      default: cutoff = null;
    }

    if (!cutoff) return data.orders;
    return data.orders.filter((o: any) => new Date(o.created_at) >= cutoff!);
  }, [data?.orders, dateFilter]);

  // Aggregated metrics
  const metrics = useMemo(() => {
    const orders = filteredOrders;
    const totalGMV = orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    const totalServiceFees = orders.reduce((s: number, o: any) => s + Number(o.service_fee_amount || 0), 0);
    const totalShipping = orders.reduce((s: number, o: any) => s + Number(o.shipping_cost || 0), 0);
    const totalLabCosts = orders.reduce((s: number, o: any) => s + Number(o.test_costs_total || 0), 0);
    const totalVAT = orders.reduce((s: number, o: any) => s + Number(o.vat_amount || 0), 0);
    const revenue = totalServiceFees + totalShipping;
    const netMargin = revenue;
    const avgOrderValue = orders.length > 0 ? totalGMV / orders.length : 0;

    const invoices = data?.invoices || [];
    const outstandingInvoices = invoices
      .filter((inv: any) => inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'issued')
      .reduce((s: number, inv: any) => s + Number(inv.total || inv.gross_total || 0), 0);

    const patientPayOrders = orders.filter((o: any) => o.payment_method === 'patient');
    const doctorPayOrders = orders.filter((o: any) => o.payment_method === 'doctor_invoice');

    return {
      totalGMV, totalServiceFees, totalShipping, totalLabCosts, totalVAT,
      revenue, netMargin, avgOrderValue, outstandingInvoices,
      orderCount: orders.length,
      patientPayCount: patientPayOrders.length,
      patientPayTotal: patientPayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      doctorPayCount: doctorPayOrders.length,
      doctorPayTotal: doctorPayOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
    };
  }, [filteredOrders, data?.invoices]);

  // Revenue over time
  const revenueOverTime = useMemo(() => {
    const orders = filteredOrders;
    const monthMap = new Map<string, { gmv: number; revenue: number; labCosts: number; shipping: number; vat: number; orders: number }>();

    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = breakdownView === 'monthly'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)).padStart(2, '0')}`;

      if (!monthMap.has(key)) monthMap.set(key, { gmv: 0, revenue: 0, labCosts: 0, shipping: 0, vat: 0, orders: 0 });
      const m = monthMap.get(key)!;
      m.gmv += Number(o.total || 0);
      m.revenue += Number(o.service_fee_amount || 0) + Number(o.shipping_cost || 0);
      m.labCosts += Number(o.test_costs_total || 0);
      m.shipping += Number(o.shipping_cost || 0);
      m.vat += Number(o.vat_amount || 0);
      m.orders += 1;
    });

    return Array.from(monthMap.entries())
      .map(([key, val]) => ({ period: key, ...val }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredOrders, breakdownView]);

  // Lab costs breakdown
  const labCostsBreakdown = useMemo(() => {
    if (!data?.recommendation_items) return [];
    const labMap = new Map<string, { name: string; total: number; count: number }>();

    data.recommendation_items.forEach((item: any) => {
      const labId = item.lab_id;
      if (!labId) return;
      const labName = item.laboratory?.name || 'Unknown Lab';
      if (!labMap.has(labId)) labMap.set(labId, { name: labName, total: 0, count: 0 });
      const l = labMap.get(labId)!;
      l.total += Number(item.lab_cost || item.unit_price || 0) * Number(item.quantity || 1);
      l.count += 1;
    });

    return Array.from(labMap.values()).sort((a, b) => b.total - a.total);
  }, [data?.recommendation_items]);

  const invoiceBreakdown = useMemo(() => {
    if (!data?.invoices) return [];
    const statusMap = new Map<string, { count: number; total: number }>();

    data.invoices.forEach((inv: any) => {
      const s = inv.status || 'unknown';
      if (!statusMap.has(s)) statusMap.set(s, { count: 0, total: 0 });
      const m = statusMap.get(s)!;
      m.count += 1;
      m.total += Number(inv.total || inv.gross_total || 0);
    });

    return Array.from(statusMap.entries()).map(([status, val]) => ({
      status,
      label: status.charAt(0).toUpperCase() + status.slice(1),
      ...val,
    }));
  }, [data?.invoices]);

  // Top doctors
  const topDoctors = useMemo(() => {
    if (!data?.doctors) return [];
    const docMap = new Map<string, { name: string; practice: string; orders: number; gmv: number; fees: number }>();

    filteredOrders.forEach((o: any) => {
      const docId = o.doctor_id;
      if (!docId) return;
      const doc = data.doctors.find((d: any) => d.id === docId);
      if (!docMap.has(docId)) {
        docMap.set(docId, {
          name: doc?.full_name || 'Unknown',
          practice: doc?.practice_name || '',
          orders: 0, gmv: 0, fees: 0,
        });
      }
      const d = docMap.get(docId)!;
      d.orders += 1;
      d.gmv += Number(o.total || 0);
      d.fees += Number(o.service_fee_amount || 0);
    });

    return Array.from(docMap.values()).sort((a, b) => b.gmv - a.gmv).slice(0, 10);
  }, [filteredOrders, data?.doctors]);

  // Payment method split
  const paymentSplit = useMemo(() => {
    return [
      { name: 'Patient Pays', value: metrics.patientPayTotal, count: metrics.patientPayCount },
      { name: 'Doctor Invoice', value: metrics.doctorPayTotal, count: metrics.doctorPayCount },
    ].filter(p => p.count > 0);
  }, [metrics]);

  // Revenue breakdown pie
  const revenueBreakdown = useMemo(() => {
    return [
      { name: 'Service Fees', value: metrics.totalServiceFees },
      { name: 'Shipping', value: metrics.totalShipping },
      { name: 'Lab Costs', value: metrics.totalLabCosts },
    ].filter(p => p.value > 0);
  }, [metrics]);

  const exportCSV = () => {
    const rows = [
      ['Period', 'Orders', 'GMV', 'Service Fees', 'Shipping', 'Lab Costs', 'VAT', 'Net Margin'],
      ...revenueOverTime.map((r: any) => [
        r.period,
        r.orders,
        r.gmv.toFixed(2),
        r.revenue.toFixed(2),
        filteredOrders.filter((o: any) => {
          const d = new Date(o.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === r.period;
        }).reduce((s: number, o: any) => s + Number(o.shipping_cost || 0), 0).toFixed(2),
        r.labCosts.toFixed(2),
        filteredOrders.filter((o: any) => {
          const d = new Date(o.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return key === r.period;
        }).reduce((s: number, o: any) => s + Number(o.vat_amount || 0), 0).toFixed(2),
        r.revenue.toFixed(2),
      ]),
      ['Total', metrics.orderCount, metrics.totalGMV.toFixed(2), metrics.totalServiceFees.toFixed(2), metrics.totalShipping.toFixed(2), metrics.totalLabCosts.toFixed(2), metrics.totalVAT.toFixed(2), metrics.revenue.toFixed(2)],
    ];

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `99tests-financial-${dateFilter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] sm:text-[28px] text-near-black">Financial Overview</h1>
          <p className="text-[13px] text-gray-500 mt-1">Revenue, costs, and billing analytics.</p>
        </div>
        <div className="flex items-center gap-1.5">
          {(['30d', '90d', '6m', 'year', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                dateFilter === f
                  ? 'bg-[#008085] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f === '30d' ? '30 Days' : f === '90d' ? '90 Days' : f === '6m' ? '6 Months' : f === 'year' ? 'This Year' : 'All Time'}
            </button>
          ))}
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 text-[12px] font-medium transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'GMV', value: formatCompact(metrics.totalGMV), sub: `${metrics.orderCount} orders`, icon: TrendingUp, color: 'text-[#008085]', bg: 'bg-teal-50' },
          { label: 'Revenue', value: formatCompact(metrics.revenue), sub: 'Fees + Shipping', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Lab Costs', value: formatCompact(metrics.totalLabCosts), sub: 'Passed to labs', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Net Margin', value: formatCompact(metrics.netMargin), sub: `${metrics.totalGMV > 0 ? ((metrics.netMargin / metrics.totalGMV) * 100).toFixed(1) : 0}% of GMV`, icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <div className="text-[20px] font-heading font-medium text-near-black">{m.value}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{m.label}</div>
            {m.sub && <div className="text-[11px] text-gray-300 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Metrics Row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'VAT Collected', value: formatCompact(metrics.totalVAT), sub: 'On fees & shipping', icon: Receipt, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Outstanding', value: formatCompact(metrics.outstandingInvoices), sub: 'Unpaid invoices', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Shipping Revenue', value: formatCompact(metrics.totalShipping), sub: `${metrics.orderCount > 0 ? (metrics.totalShipping / metrics.orderCount).toFixed(2) : 0} avg/order`, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Avg. Order Value', value: formatCompact(metrics.avgOrderValue), sub: 'Per order', icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <div className="text-[20px] font-heading font-medium text-near-black">{m.value}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{m.label}</div>
            {m.sub && <div className="text-[11px] text-gray-300 mt-0.5">{m.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts Row 1: Revenue Over Time + Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Over Time — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Revenue Over Time</h2>
            <div className="flex items-center gap-1">
              {(['weekly', 'monthly'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setBreakdownView(v)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                    breakdownView === v ? 'bg-gray-100 text-near-black' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {v === 'weekly' ? 'Weekly' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>
          {revenueOverTime.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-[14px]">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#ccc" tickFormatter={formatPeriod} />
                <YAxis tick={{ fontSize: 11 }} stroke="#ccc" tickFormatter={(v) => `€${v}`} />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="gmv" name="GMV" stroke="#008085" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="labCosts" name="Lab Costs" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Breakdown — 1/3 width */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Where Money Goes</h2>
          {revenueBreakdown.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-[14px]">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenueBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {revenueBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {revenueBreakdown.map((item, i) => {
                  const totalValue = revenueBreakdown.reduce((s, p) => s + p.value, 0);
                  const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{pct}%</span>
                        <span className="font-mono text-near-black">{formatCurrency(item.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row 2: Lab Costs + Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lab Costs by Laboratory — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Lab Costs by Laboratory</h2>
          {labCostsBreakdown.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-[14px]">No lab data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, labCostsBreakdown.length * 45)}>
              <BarChart data={labCostsBreakdown} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#ccc" tickFormatter={(v) => `€${v}`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#ccc" />
                <RechartsTooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total Cost']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Split — 1/3 width */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Payment Methods</h2>
          {paymentSplit.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-[14px]">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentSplit} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {paymentSplit.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? '#008085' : '#F59E0B'} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {paymentSplit.map((item, i) => {
                  const totalValue = paymentSplit.reduce((s, p) => s + p.value, 0);
                  const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? '#008085' : '#F59E0B' }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{pct}%</span>
                        <span className="font-mono text-near-black">{formatCurrency(item.value)}</span>
                        <span className="text-gray-400 ml-1.5 text-[11px]">({item.count})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Invoice Status Breakdown */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
        <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Invoice Status</h2>
        {invoiceBreakdown.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-[14px]">No invoices yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {invoiceBreakdown.map((item: any) => {
              const colorMap: Record<string, string> = {
                issued: 'text-gray-600 bg-gray-50',
                sent: 'text-blue-600 bg-blue-50',
                paid: 'text-emerald-600 bg-emerald-50',
                overdue: 'text-red-600 bg-red-50',
                cancelled: 'text-gray-400 bg-gray-50',
              };
              const colors = colorMap[item.status] || 'text-gray-600 bg-gray-50';
              const [textColor, bgColor] = colors.split(' ');
              return (
                <div key={item.status} className={`rounded-[12px] p-4 ${bgColor}`}>
                  <div className={`text-[20px] font-heading font-medium ${textColor}`}>{item.count}</div>
                  <div className="text-[13px] text-gray-600 mt-0.5">{item.label}</div>
                  <div className="text-[12px] text-gray-400 font-mono mt-1">{formatCurrency(item.total)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Doctors Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Top Doctors by GMV</h2>
        </div>
        {topDoctors.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[14px]">No doctor data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-center px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Doctor</th>
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Practice</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Orders</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">GMV</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Service Fees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topDoctors.map((doc: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/30">
                    <td className="px-4 py-3 text-center text-[12px] text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-near-black">{doc.name}</td>
                    <td className="px-6 py-3 text-gray-500">{doc.practice || '—'}</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-600">{doc.orders}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-near-black">{formatCurrency(doc.gmv)}</td>
                    <td className="px-6 py-3 text-right font-mono text-[#008085]">{formatCurrency(doc.fees)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Monthly Breakdown</h2>
        </div>
        {revenueOverTime.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[14px]">No data for this period</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Orders</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">GMV</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Service Fees</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Shipping</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Lab Costs</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">VAT</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {revenueOverTime.map((row: any) => (
                  <tr key={row.period} className="hover:bg-gray-50/30">
                    <td className="px-6 py-3 font-medium text-near-black">{formatPeriod(row.period)}</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-600">{row.orders}</td>
                    <td className="px-6 py-3 text-right font-mono text-near-black">{formatCurrency(row.gmv)}</td>
                    <td className="px-6 py-3 text-right font-mono text-[#008085]">{formatCurrency(row.revenue - row.shipping)}</td>
                    <td className="px-6 py-3 text-right font-mono text-indigo-600">{formatCurrency(row.shipping)}</td>
                    <td className="px-6 py-3 text-right font-mono text-blue-600">{formatCurrency(row.labCosts)}</td>
                    <td className="px-6 py-3 text-right font-mono text-purple-600">{formatCurrency(row.vat)}</td>
                    <td className="px-6 py-3 text-right font-mono font-medium text-emerald-600">{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="px-6 py-3 text-near-black">Total</td>
                  <td className="px-6 py-3 text-right font-mono text-near-black">{metrics.orderCount}</td>
                  <td className="px-6 py-3 text-right font-mono text-near-black">{formatCurrency(metrics.totalGMV)}</td>
                  <td className="px-6 py-3 text-right font-mono text-[#008085]">{formatCurrency(metrics.totalServiceFees)}</td>
                  <td className="px-6 py-3 text-right font-mono text-indigo-600">{formatCurrency(metrics.totalShipping)}</td>
                  <td className="px-6 py-3 text-right font-mono text-blue-600">{formatCurrency(metrics.totalLabCosts)}</td>
                  <td className="px-6 py-3 text-right font-mono text-purple-600">{formatCurrency(metrics.totalVAT)}</td>
                  <td className="px-6 py-3 text-right font-mono font-medium text-emerald-600">{formatCurrency(metrics.revenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
