"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useState, useEffect, useMemo } from "react";
import {
  Users, Stethoscope, ClipboardList, Package, FlaskConical,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Clock,
  CheckCircle2, XCircle, Truck, FileText
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts";

const COLORS = ['#008085', '#005C5F', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

function formatPeriod(key: string): string {
  if (key.includes('-W')) {
    const [year, week] = key.split('-');
    return `${week} ${year}`;
  }
  const [year, month] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1] || month} ${year}`;
}

export default function AdminInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<'30d' | '90d' | '6m' | 'year' | 'all'>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/insights');
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error('Failed to fetch insights:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Date filter
  const filterByDate = (items: any[], dateField = 'created_at') => {
    if (!items || dateFilter === 'all') return items;
    const now = new Date();
    let cutoff: Date;
    switch (dateFilter) {
      case '30d': cutoff = new Date(now.getTime() - 30 * 86400000); break;
      case '90d': cutoff = new Date(now.getTime() - 90 * 86400000); break;
      case '6m': cutoff = new Date(now.getFullYear(), now.getMonth() - 6, 1); break;
      case 'year': cutoff = new Date(now.getFullYear(), 0, 1); break;
      default: return items;
    }
    return items.filter((i: any) => new Date(i[dateField]) >= cutoff);
  };

  // Core metrics
  const metrics = useMemo(() => {
    if (!data) return null;
    const recs = filterByDate(data.recommendations);
    const orders = filterByDate(data.orders);
    const doctors = data.doctors || [];
    const patients = data.patients || [];
    const shipments = filterByDate(data.shipments);
    const results = filterByDate(data.results);

    // Unique patients and doctors in period
    const activeDoctorIds = new Set(recs.map((r: any) => r.doctor_id));
    const activePatientIds = new Set(orders.map((o: any) => o.patient_id));

    // Conversion rate: recommendations → orders
    const recIds = new Set(recs.map((r: any) => r.id));
    const ordersFromRecs = orders.filter((o: any) => recIds.has(o.recommendation_id));
    const conversionRate = recs.length > 0 ? (ordersFromRecs.length / recs.length * 100) : 0;

    // Recommendation status breakdown
    const recStatuses = new Map<string, number>();
    recs.forEach((r: any) => {
      const s = r.status || 'unknown';
      recStatuses.set(s, (recStatuses.get(s) || 0) + 1);
    });

    // Order status breakdown
    const orderStatuses = new Map<string, number>();
    orders.forEach((o: any) => {
      const s = o.status || 'unknown';
      orderStatuses.set(s, (orderStatuses.get(s) || 0) + 1);
    });

    return {
      totalDoctors: doctors.length,
      verifiedDoctors: doctors.filter((d: any) => d.is_verified === true).length,
      totalPatients: patients.length,
      totalRecommendations: recs.length,
      totalOrders: orders.length,
      activeDoctors: activeDoctorIds.size,
      activePatients: activePatientIds.size,
      conversionRate,
      totalShipments: shipments.length,
      totalResults: results.length,
      recStatuses: Object.fromEntries(recStatuses),
      orderStatuses: Object.fromEntries(orderStatuses),
    };
  }, [data, dateFilter]);

  // Growth over time (recommendations + orders per month)
  const growthOverTime = useMemo(() => {
    if (!data) return [];
    const recs = filterByDate(data.recommendations);
    const orders = filterByDate(data.orders);
    const monthMap = new Map<string, { recommendations: number; orders: number; patients: number }>();

    recs.forEach((r: any) => {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) monthMap.set(key, { recommendations: 0, orders: 0, patients: 0 });
      monthMap.get(key)!.recommendations += 1;
    });

    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(key)) monthMap.set(key, { recommendations: 0, orders: 0, patients: 0 });
      monthMap.get(key)!.orders += 1;
    });

    // Count unique patients per month
    const patientsByMonth = new Map<string, Set<string>>();
    orders.forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!patientsByMonth.has(key)) patientsByMonth.set(key, new Set());
      if (o.patient_id) patientsByMonth.get(key)!.add(o.patient_id);
    });
    patientsByMonth.forEach((patients, key) => {
      if (monthMap.has(key)) monthMap.get(key)!.patients = patients.size;
    });

    return Array.from(monthMap.entries())
      .map(([key, val]) => ({ period: key, ...val }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data, dateFilter]);

  // Top doctors by recommendations
  const topDoctors = useMemo(() => {
    if (!data) return [];
    const recs = filterByDate(data.recommendations);
    const docMap = new Map<string, { name: string; practice: string; recs: number; orders: number }>();

    recs.forEach((r: any) => {
      const docId = r.doctor_id;
      if (!docId) return;
      const doc = data.doctors.find((d: any) => d.id === docId);
      if (!docMap.has(docId)) {
        docMap.set(docId, {
          name: doc?.full_name || 'Unknown',
          practice: doc?.practice_name || '',
          recs: 0,
          orders: 0,
        });
      }
      docMap.get(docId)!.recs += 1;
    });

    const orders = filterByDate(data.orders);
    orders.forEach((o: any) => {
      if (o.doctor_id && docMap.has(o.doctor_id)) {
        docMap.get(o.doctor_id)!.orders += 1;
      }
    });

    return Array.from(docMap.values())
      .sort((a, b) => b.recs - a.recs)
      .slice(0, 10);
  }, [data, dateFilter]);

  // Most ordered tests
  const popularTests = useMemo(() => {
    if (!data?.recommendation_items || !data?.test_catalog) return [];
    const testMap = new Map<string, { name: string; lab: string; count: number }>();

    data.recommendation_items.forEach((item: any) => {
      const testId = item.test_id;
      if (!testId) return;
      const test = data.test_catalog.find((t: any) => t.id === testId);
      const testName = test?.test_name || test?.short_name || testId;
      const labName = item.laboratory?.name || 'Unknown';

      if (!testMap.has(testId)) testMap.set(testId, { name: testName, lab: labName, count: 0 });
      testMap.get(testId)!.count += 1;
    });

    return Array.from(testMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [data]);

  // Recommendation status distribution
  const recStatusChart = useMemo(() => {
    if (!metrics?.recStatuses) return [];
    return Object.entries(metrics.recStatuses).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      value: count as number,
    })).sort((a, b) => b.value - a.value);
  }, [metrics]);

  // Order status distribution
  const orderStatusChart = useMemo(() => {
    if (!metrics?.orderStatuses) return [];
    return Object.entries(metrics.orderStatuses).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
      value: count as number,
    })).sort((a, b) => b.value - a.value);
  }, [metrics]);

  // Resend analytics
  const resendInsights = useMemo(() => {
    if (!data?.resends) return { total: 0, byReason: [], byLab: [] };
    const resends = filterByDate(data.resends);

    // By reason
    const reasonMap = new Map<string, number>();
    resends.forEach((r: any) => {
      const reason = (r.reason || 'unknown').replace(/_/g, ' ');
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    // By lab (through order → recommendation_items)
    const labResendMap = new Map<string, { name: string; count: number; reasons: Map<string, number> }>();
    resends.forEach((r: any) => {
      const orderId = r.order_id;
      // Find the order's recommendation
      const order = (data.orders || []).find((o: any) => o.id === orderId);
      if (!order?.recommendation_id) return;
      // Find the recommendation items to get lab
      const items = (data.recommendation_items || []).filter((i: any) => i.recommendation_id === order.recommendation_id);
      items.forEach((item: any) => {
        const labId = item.lab_id;
        const labName = item.laboratory?.name || 'Unknown Lab';
        if (!labResendMap.has(labId)) {
          labResendMap.set(labId, { name: labName, count: 0, reasons: new Map() });
        }
        const lab = labResendMap.get(labId)!;
        lab.count += 1;
        const reason = (r.reason || 'unknown').replace(/_/g, ' ');
        lab.reasons.set(reason, (lab.reasons.get(reason) || 0) + 1);
      });
    });

    return {
      total: resends.length,
      byReason: Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ name: reason.charAt(0).toUpperCase() + reason.slice(1), value: count }))
        .sort((a, b) => b.value - a.value),
      byLab: Array.from(labResendMap.values())
        .sort((a, b) => b.count - a.count)
        .map(l => ({
          name: l.name,
          count: l.count,
          topReason: Array.from(l.reasons.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
        })),
    };
  }, [data, dateFilter]);

  // Cancellation analytics
  const cancellationInsights = useMemo(() => {
    if (!data?.recommendations) return { total: 0, rate: 0, byDoctor: [] };
    const recs = filterByDate(data.recommendations);
    const cancelled = recs.filter((r: any) => r.status === 'cancelled');
    const rate = recs.length > 0 ? (cancelled.length / recs.length * 100) : 0;

    // Cancellations by doctor
    const docCancelMap = new Map<string, { name: string; cancelled: number; total: number }>();
    recs.forEach((r: any) => {
      const docId = r.doctor_id;
      if (!docId) return;
      const doc = (data.doctors || []).find((d: any) => d.id === docId);
      if (!docCancelMap.has(docId)) {
        docCancelMap.set(docId, { name: doc?.full_name || 'Unknown', cancelled: 0, total: 0 });
      }
      const d = docCancelMap.get(docId)!;
      d.total += 1;
      if (r.status === 'cancelled') d.cancelled += 1;
    });

    return {
      total: cancelled.length,
      rate,
      byDoctor: Array.from(docCancelMap.values())
        .filter(d => d.cancelled > 0)
        .sort((a, b) => b.cancelled - a.cancelled)
        .slice(0, 10),
    };
  }, [data, dateFilter]);

  if (loading || !metrics) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header + Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] sm:text-[28px] text-near-black">Platform Insights</h1>
          <p className="text-[13px] text-gray-500 mt-1">Usage analytics, growth trends, and platform health.</p>
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
        </div>
      </div>

      {/* Metrics Row 1: Platform Size */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Doctors', value: metrics.totalDoctors, sub: `${metrics.verifiedDoctors} verified`, icon: Stethoscope, color: 'text-[#008085]', bg: 'bg-teal-50' },
          { label: 'Patients', value: metrics.totalPatients, sub: `${metrics.activePatients} active`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Recommendations', value: metrics.totalRecommendations, sub: `${metrics.activeDoctors} doctors active`, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Orders', value: metrics.totalOrders, sub: `${metrics.conversionRate.toFixed(0)}% conversion`, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <div className="text-[22px] font-heading font-medium text-near-black">{m.value}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{m.label}</div>
            <div className="text-[11px] text-gray-300 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Metrics Row 2: Activity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Shipments', value: metrics.totalShipments, icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Results Uploaded', value: metrics.totalResults, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Doctors', value: metrics.activeDoctors, icon: Activity, color: 'text-[#008085]', bg: 'bg-teal-50' },
          { label: 'Active Patients', value: metrics.activePatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((m, i) => (
          <div key={i} className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
            </div>
            <div className="text-[22px] font-heading font-medium text-near-black">{m.value}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Growth Chart + Rec Status Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Platform Growth</h2>
          {growthOverTime.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-[14px]">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} stroke="#ccc" tickFormatter={formatPeriod} />
                <YAxis tick={{ fontSize: 11 }} stroke="#ccc" />
                <RechartsTooltip
                  labelFormatter={formatPeriod}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="recommendations" name="Recommendations" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#008085" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="patients" name="Unique Patients" stroke="#3B82F6" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recommendation Status */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Recommendation Status</h2>
          {recStatusChart.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-400 text-[14px]">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={recStatusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {recStatusChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {recStatusChart.map((item, i) => {
                  const total = recStatusChart.reduce((s, p) => s + p.value, 0);
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{pct}%</span>
                        <span className="font-mono text-near-black">{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Popular Tests + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Most Ordered Tests */}
        <div className="lg:col-span-2 bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Most Ordered Tests</h2>
          {popularTests.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-[14px]">No test data</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, popularTests.length * 40)}>
              <BarChart data={popularTests} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#ccc" />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 10 }} stroke="#ccc" />
                <RechartsTooltip
                  formatter={(value: number) => [value, 'Times Ordered']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="count" fill="#008085" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Order Status</h2>
          {orderStatusChart.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-400 text-[14px]">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={orderStatusChart} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {orderStatusChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {orderStatusChart.map((item, i) => {
                  const total = orderStatusChart.reduce((s, p) => s + p.value, 0);
                  const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">{pct}%</span>
                        <span className="font-mono text-near-black">{item.value}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Doctors Table */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Most Active Doctors</h2>
        </div>
        {topDoctors.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-[14px]">No doctor activity</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="text-center px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Doctor</th>
                  <th className="text-left px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Practice</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Recommendations</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Orders</th>
                  <th className="text-right px-6 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topDoctors.map((doc: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/30">
                    <td className="px-4 py-3 text-center text-[12px] text-gray-400 font-mono">{i + 1}</td>
                    <td className="px-6 py-3 font-medium text-near-black">{doc.name}</td>
                    <td className="px-6 py-3 text-gray-500">{doc.practice || '—'}</td>
                    <td className="px-6 py-3 text-right font-mono text-purple-600">{doc.recs}</td>
                    <td className="px-6 py-3 text-right font-mono text-[#008085]">{doc.orders}</td>
                    <td className="px-6 py-3 text-right font-mono text-gray-600">{doc.recs > 0 ? ((doc.orders / doc.recs) * 100).toFixed(0) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellations & Quality Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cancellation Overview */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Cancellations</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 rounded-[12px] p-4">
              <div className="text-[22px] font-heading font-medium text-red-600">{cancellationInsights.total}</div>
              <div className="text-[12px] text-red-400">Cancelled</div>
            </div>
            <div className="bg-gray-50 rounded-[12px] p-4">
              <div className="text-[22px] font-heading font-medium text-near-black">{cancellationInsights.rate.toFixed(1)}%</div>
              <div className="text-[12px] text-gray-400">Cancellation Rate</div>
            </div>
          </div>
          {cancellationInsights.byDoctor.length > 0 ? (
            <div>
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">By Doctor</div>
              <div className="space-y-2">
                {cancellationInsights.byDoctor.map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-gray-600">{doc.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-mono">{doc.cancelled}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-400 font-mono">{doc.total}</span>
                      <span className="text-[11px] text-gray-400">({doc.total > 0 ? ((doc.cancelled / doc.total) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 text-[14px] py-4">No cancellations</div>
          )}
        </div>

        {/* Resend / Quality Issues */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Resends & Quality</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-amber-50 rounded-[12px] p-4">
              <div className="text-[22px] font-heading font-medium text-amber-600">{resendInsights.total}</div>
              <div className="text-[12px] text-amber-400">Total Resends</div>
            </div>
            <div className="bg-gray-50 rounded-[12px] p-4">
              <div className="text-[22px] font-heading font-medium text-near-black">{metrics ? metrics.totalOrders > 0 ? ((resendInsights.total / metrics.totalOrders) * 100).toFixed(1) : '0' : '0'}%</div>
              <div className="text-[12px] text-gray-400">Resend Rate</div>
            </div>
          </div>

          {/* Resend reasons */}
          {resendInsights.byReason.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">By Reason</div>
              <div className="space-y-2">
                {resendInsights.byReason.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{r.name}</span>
                    </div>
                    <span className="font-mono text-near-black">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Labs with most resends */}
          {resendInsights.byLab.length > 0 && (
            <div>
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Labs with Resends</div>
              <div className="space-y-2">
                {resendInsights.byLab.map((lab: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <div>
                      <span className="text-gray-600">{lab.name}</span>
                      <span className="text-[11px] text-gray-400 ml-2">({lab.topReason})</span>
                    </div>
                    <span className="font-mono text-amber-600">{lab.count} resend{lab.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resendInsights.total === 0 && (
            <div className="text-center text-gray-400 text-[14px] py-4">No resends recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}
