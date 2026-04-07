/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect, useMemo } from "react";
import { 
 CreditCard, TrendingUp, Wallet, PackageSearch, Building2,
 Download, Receipt, ArrowUpRight, FileText, BarChart3, Activity, Users, MapPin, Search
} from "lucide-react";
import { 
 LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
 PieChart, Pie, Cell,
 BarChart, Bar
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isWithinInterval, parseISO } from "date-fns";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const PIE_COLORS = ['#BE1E2D', '#10B981', '#3B82F6', '#F59E0B'];
const BAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function AdminFinancialPage() {
 const [loading, setLoading] = useState(true);
 
 // Raw Data State
 const [payments, setPayments] = useState<any[]>([]);
 const [recommendations, setCases] = useState<any[]>([]);
 const [refunds, setRefunds] = useState<any[]>([]);
 
 // Filter State
 const [dateFilter, setDateFilter] = useState<'week'|'month'|'30d'|'90d'|'year'|'all'>('30d');
 const [breakdownView, setBreakdownView] = useState<'weekly'|'monthly'>('monthly');
 const [isSample, setIsSample] = useState(false);
 
 useEffect(() => {
 async function fetchFinancials() {
 try {
 setLoading(true);
 const res = await fetch('/api/admin/financial');
 if (!res.ok) throw new Error('Failed to fetch');
 const data = await res.json();

 let processedPayments = data.payments || [];
 let processedCases = data.recommendations || [];
 let processedRefunds = data.refunds || [];

 // Generate Sample Data if Empty or if we don't have enough payments yet
 if (processedCases.length < 2 || processedPayments.length === 0) {
 setIsSample(true);
 const dummyCases = [];
 const dummyPayments = [];
 const now = new Date();
 
 for (let i = 0; i < 200; i++) {
 const d = new Date(now.getTime() - Math.random() * 120 * 24 * 60 * 60 * 1000); // spread over 120 days
 
 // Funnel simulation
 const r = Math.random();
 const cStatus = r > 0.8 ? 'created' : r > 0.7 ? 'matched' : r > 0.6 ? 'booked' : r > 0.1 ? 'completed' : 'cancelled';
 
 const bcId = `bc-${Math.floor(Math.random() * 10)}`;
 const bcName = `Collector ${bcId.split('-')[1]}`;
 const hcId = `hc-${Math.floor(Math.random() * 5)}`;
 const hcName = `Klinik ${hcId.split('-')[1]}`;
 
 const base = 40 + Math.random() * 20;
 const travel = Math.random() * 15;
 const com = (base + travel) * 0.15;
 const orgFee = 25 + Math.random() * 20;
 const matRev = 10 + Math.random() * 10;
 const logRev = 8.5;
 const patientPay = base + travel + orgFee + matRev + logRev;

 dummyCases.push({
 id: `recommendation-${i}`,
 status: cStatus,
 created_at: d.toISOString(),
 estimated_fees: {
 base_fee: base, travel_fee: travel, commission: com, bc_payout: base + travel - com, doctor_org_fee: orgFee, material_cost: matRev, logistics_fee: logRev
 },
 patient: { address: { city: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'][Math.floor(Math.random() * 5)] } },
 doctor_practice: { id: hcId, name: hcName },
 case_application: [{ status: 'accepted', blood_collector: { id: bcId, first_name: bcName.split(' ')[0], last_name: bcName.split(' ')[1], rating: 4 + Math.random() } }]
 });

 if (cStatus === 'completed') {
 dummyPayments.push({
 id: `pay-${i}`,
 patient_amount: patientPay,
 status: Math.random() > 0.1 ? 'captured' : 'pending',
 created_at: new Date(d.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
 platform_commission: com,
 b2b_fee: orgFee,
 bc_payout: base + travel - com,
 material_revenue: matRev,
 logistics_revenue: logRev,
 vat_amount: patientPay * 0.19,
 bc_id: bcId,
 bc_name: bcName
 });
 }
 }
 processedCases = dummyCases;
 processedPayments = dummyPayments;
 } else {
 // Normalize real data payments to extract bc names easily
 processedPayments = processedPayments.map((p: any) => {
 // Payment API route maps: 'recommendation_id'
 // Find matching recommendation application to grab BC details
 const cMatch = processedCases.find((c: any) => c.id === p.recommendation_id);
 const activeApp = (cMatch?.case_application || []).find((a: any) => ['accepted', 'booked'].includes(a.status));
 const bc = activeApp?.blood_collector;

 return {
 ...p,
 bc_id: bc?.id,
 bc_name: bc ? `${bc.first_name} ${bc.last_name}` : 'UnknownBC'
 };
 });
 }

 setCases(processedCases);
 setPayments(processedPayments);
 setRefunds(processedRefunds);

 } catch (err) {
 console.error("Error fetching financials:", err);
 } finally {
 setLoading(false);
 }
 }
 
 fetchFinancials();
 }, [dateFilter]);

 const handleReleasePayout = async (bcId: string) => {
 if (!confirm('Release payout for this collector?')) return;
 try {
 setLoading(true);
 const res = await fetch('/api/admin/financial/payouts', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'release_single', bcId })
 });
 if (res.ok) {
 setPayments(prev => prev.map(p => p.bc_id === bcId && p.payout_status === 'confirmed' ? { ...p, status: 'released', payout_status: 'released' } : p));
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 const handleReleaseAll = async () => {
 if (!confirm('Release all ready payouts?')) return;
 try {
 setLoading(true);
 const res = await fetch('/api/admin/financial/payouts', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'release_all' })
 });
 if (res.ok) {
 setPayments(prev => prev.map(p => p.payout_status === 'confirmed' ? { ...p, status: 'released', payout_status: 'released' } : p));
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 const handleGenerateInvoices = async () => {
 if (!confirm('Generate monthly invoices for all Healthcare Companies? This action cannot be undone.')) return;
 try {
 setLoading(true);
 const res = await fetch('/api/admin/financial/invoices', { method: 'POST' });
 const data = await res.json();
 if (res.ok) {
 alert(`Successfully generated ${data.generated} new invoices.`);
 window.location.reload();
 } else {
 alert(data.error || 'Failed to generate');
 }
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 // --- Date Range Filter ---
 const filteredDates = useMemo(() => {
 const now = new Date();
 let startD = new Date(0);
 
 if (dateFilter === 'week') startD = startOfWeek(now);
 if (dateFilter === 'month') startD = startOfMonth(now);
 if (dateFilter === '30d') startD = subDays(now, 30);
 if (dateFilter === '90d') startD = subDays(now, 90);
 if (dateFilter === 'year') startD = startOfYear(now);

 return {
 recommendations: recommendations.filter(c => dateFilter === 'all' || isWithinInterval(parseISO(c.created_at), { start: startD, end: now })),
 payments: payments.filter(p => dateFilter === 'all' || isWithinInterval(parseISO(p.created_at), { start: startD, end: now })),
 refunds: refunds.filter(r => dateFilter === 'all' || isWithinInterval(parseISO(r.created_at), { start: startD, end: now }))
 };
 }, [recommendations, payments, refunds, dateFilter]);

 const fCases = filteredDates.recommendations;
 const fPayments = filteredDates.payments;
 const fRefunds = filteredDates.refunds;

 // --- Aggregate Metrics ---
 const totalRev = fPayments.reduce((acc, p: any) => {
 return acc + Number(p.platform_commission || 0) + Number(p.b2b_fee || 0) + Number(p.material_revenue || 0) + Number(p.logistics_revenue || 0);
 }, 0);
 const totalCommission = fPayments.reduce((acc, p) => acc + (p.platform_commission || 0), 0);
 const totalOrgFees = fPayments.reduce((acc, p) => acc + (p.b2b_fee || 0), 0);
 const totalMatLog = fPayments.reduce((acc, p) => acc + (p.material_revenue || 0) + (p.logistics_revenue || 0), 0);
 const totalVat = fPayments.reduce((acc, p) => acc + (p.vat_amount || 0), 0);
 
 // Total specifically refunded back to patients
 const totalRefundedSum = fRefunds.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

 const pendingPayoutsList = fPayments
 .filter(p => p.payout_status === 'confirmed')
 .reduce((acc: any[], p: any) => {
 const amt = p.bc_payout || 0;
 const existing = acc.find(x => x.bcId === p.bc_id);
 if (existing) existing.amount += amt;
 else acc.push({ bcId: p.bc_id, bcName: p.bc_name || 'Collector', amount: amt, nextDate: new Date(new Date().getTime() + 3 * 86400000) });
 return acc;
 }, []);
 const totalPendingPayouts = pendingPayoutsList.reduce((acc: number, p: any) => acc + p.amount, 0);

 // --- 1. Revenue Trend Chart (Daily/Weekly) ---
 const trendData = useMemo(() => {
 const groups: any = {};
 fPayments.forEach(p => {
 const d = parseISO(p.created_at);
 const key = format(d, dateFilter === '90d' || dateFilter === 'year' || dateFilter === 'all' ? 'MMM yyyy' : 'MMM dd');
 if (!groups[key]) groups[key] = { date: key, gross: 0, net: 0, order: d.getTime() };
 
 const net = (p.platform_commission || 0) + (p.b2b_fee || 0) + (p.material_revenue || 0) + (p.logistics_revenue || 0);
 groups[key].gross += p.patient_amount || 0;
 groups[key].net += net;
 });
 return Object.values(groups).sort((a: any, b: any) => a.order - b.order);
 }, [fPayments, dateFilter]);

 // --- 2. Revenue Breakdown Pie Chart ---
 const pieData = [
 { name: 'Commission', value: totalCommission },
 { name: 'B2B Org Fees', value: totalOrgFees },
 { name: 'Materials', value: fPayments.reduce((a,p) => a + (p.material_revenue || 0), 0) },
 { name: 'Logistics', value: fPayments.reduce((a,p) => a + (p.logistics_revenue || 0), 0) }
 ].filter(d => d.value > 0);

 // --- 3. Doctor Spending Overview ---
 const hcSpending = useMemo(() => {
 const acc: any = {};
 fCases.forEach(c => {
 if (c.status === 'completed' && c.doctor_practice) {
 const hc = c.doctor_practice;
 if (!acc[hc.id]) acc[hc.id] = { name: hc.name, id: hc.id, spend: 0, recommendations: 0 };
 acc[hc.id].recommendations++;
 acc[hc.id].spend += c.estimated_fees?.doctor_org_fee || 0; 
 }
 });
 return Object.values(acc).sort((a:any, b:any) => b.spend - a.spend).slice(0, 10);
 }, [fCases]);

 // --- 4. Revenue Breakdown Table ---
 const breakdownData = useMemo(() => {
 const groups: any = {};
 fPayments.forEach(p => {
 const d = parseISO(p.created_at);
 const key = format(d, breakdownView === 'weekly' ? "wo '-' yyyy" : "MMM yyyy");
 const displayLabel = breakdownView === 'weekly' 
 ? `Week ${format(d, "ww, yyyy")} (${format(startOfWeek(d, { weekStartsOn: 1 }), "MMM d")} - ${format(new Date(startOfWeek(d, { weekStartsOn: 1 }).getTime() + 6*86400000), "MMM d")})`
 : format(d, "MMMM yyyy");

 if (!groups[key]) {
 groups[key] = {
 key, label: displayLabel, recommendations: 0, patientPayments: 0, bcPayouts: 0, commission: 0,
 orgFees: 0, material: 0, logistics: 0, netRevenue: 0, refundsIssued: 0, order: d.getTime()
 };
 }
 
 groups[key].recommendations += 1;
 groups[key].patientPayments += p.patient_amount || 0;
 groups[key].bcPayouts += p.bc_payout || 0;
 groups[key].commission += p.platform_commission || 0;
 groups[key].orgFees += p.b2b_fee || 0;
 groups[key].material += p.material_revenue || 0;
 groups[key].logistics += p.logistics_revenue || 0;
 groups[key].netRevenue += (p.platform_commission || 0) + (p.b2b_fee || 0) + (p.material_revenue || 0) + (p.logistics_revenue || 0);
 });

 fRefunds.forEach(r => {
 const d = parseISO(r.created_at);
 const key = format(d, breakdownView === 'weekly' ? "wo '-' yyyy" : "MMM yyyy");
 const amt = Number(r.amount) || 0;
 if (groups[key]) {
 groups[key].refundsIssued += amt;
 groups[key].netRevenue -= amt; // Deplete net revenue by the refunded penalty
 }
 });

 return Object.values(groups).sort((a: any, b: any) => b.order - a.order);
 }, [fPayments, fRefunds, breakdownView]);

 const exportPDF = () => {
 window.print();
 };

 return (
 <div className="flex-1 min-w-0 w-full font-body print:p-0 print:m-0 print:max-w-full print:bg-white text-near-black">
 
 {/* Header & Date Filter */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:mb-4">
 <div>
 <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">Financial & Analytics Overview</h1>
 <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">Consolidated revenue, platform performance, and spatial distributions.</p>
 </div>
 
 <div className="flex flex-col sm:flex-row gap-3 items-center print:hidden w-full sm:w-auto">
 <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 overflow-x-auto hide-scrollbar max-w-full -mx-1 px-1 w-full sm:w-auto">
 {['week', 'month', '30d', '90d', 'year', 'all'].map(v => (
 <button 
 key={v}
 onClick={() => setDateFilter(v as any)}
 className={`px-4 py-1.5 rounded-md text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors ${dateFilter === v ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-near-black'}`}
 >
 {v === 'week' ? 'This Week' : v === 'month' ? 'This Month' : v === '30d' ? '30 Days' : v === '90d' ? '90 Days' : v === 'year' ? 'This Year' : 'All Time'}
 </button>
 ))}
 </div>
 
 <button onClick={exportPDF} className="flex flex-1 sm:flex-none justify-center w-full sm:w-auto items-center gap-2 px-4 py-2 bg-open-bg border border-primary-light text-primary-dark text-[13px] font-semibold rounded-lg hover:bg-primary-light transition-colors shrink-0">
 <FileText className="w-4 h-4" /> Export PDF
 </button>
 <button onClick={handleGenerateInvoices} disabled={loading} className="flex flex-1 sm:flex-none justify-center w-full sm:w-auto items-center gap-2 px-4 py-2 bg-primary-dark text-white text-[13px] font-semibold rounded-lg hover:bg-primary transition-colors shrink-0 shadow-sm shadow-primary-dark/20">
 <Receipt className="w-4 h-4" /> Generate Invoices
 </button>
 </div>
 </div>

 {isSample && (
 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3 print:hidden shadow-sm">
 <Activity className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
 <div>
 <h4 className="font-heading text-[14px] font-medium text-amber-900">Showing Sample Data</h4>
 <p className="text-[13px] text-amber-800/80">You are viewing a demonstration of the analytics engine using generated placeholder recommendations because your database does not yet have enough completed payments.</p>
 </div>
 </div>
 )}

 {/* Top Metrics Row */}
 <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-8 metric-grid">
 <MetricCard title="Net Revenue" value={`€${(totalRev - totalRefundedSum).toFixed(0)}`} icon={CreditCard} highlight />
 <MetricCard title="Total Commission" value={`€${totalCommission.toFixed(0)}`} icon={TrendingUp} />
 <MetricCard title="B2B Org Fees" value={`€${totalOrgFees.toFixed(0)}`} icon={Building2} />
 <MetricCard title="Material & Logistics" value={`€${totalMatLog.toFixed(0)}`} icon={PackageSearch} />
 <MetricCard title="Patient Refunds" value={`€${totalRefundedSum.toFixed(0)}`} icon={Receipt} alert={totalRefundedSum > 0} className="text-red-600" />
 <MetricCard title="Pending BC Payouts" value={`€${totalPendingPayouts.toFixed(0)}`} icon={Wallet} alert={totalPendingPayouts > 0} />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
 
 {/* 1. Revenue Trend Chart */}
 <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-5 lg:p-6 print:break-inside-avoid">
 <div>
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black">Revenue Trend</h3>
 <p className="text-[13px] text-gray-500 mb-6">Gross patient payments vs Net platform revenue over time.</p>
 </div>
 <div className="h-[300px] w-full overflow-hidden">
 {loading ? <LoadingPlaceholder /> : (
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
 <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `€${val}`} dx={-10} />
 <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val: any) => `€${Number(val).toFixed(2)}`} />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
 <Line type="monotone" name="Gross Flow (Patient Payments)" dataKey="gross" stroke="#94A3B8" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
 <Line type="monotone" name="Net Platform Revenue" dataKey="net" stroke="#BE1E2D" strokeWidth={3} dot={{ r: 3, fill: '#BE1E2D', strokeWidth: 0 }} activeDot={{ r: 6 }} />
 </LineChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 {/* 2. Revenue Breakdown Pie Chart */}
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-5 lg:p-6 print:break-inside-avoid">
 <div>
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black">Revenue Composition</h3>
 <p className="text-[13px] text-gray-500 mb-2">Sources of platform net revenue.</p>
 </div>
 <div className="h-[250px] w-full overflow-hidden">
 {loading ? <LoadingPlaceholder /> : (
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <RechartsTooltip formatter={(val: any) => `€${Number(val).toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
 {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
 </Pie>
 <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
 </PieChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
 
 {/* 3. Top Healthcare Accounts by Spend */}
 <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-5 lg:p-6 print:break-inside-avoid">
 <div className="flex items-center gap-2 mb-6">
 <Building2 className="w-5 h-5 text-emerald-500" />
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black">Top Healthcare Accounts by Spend</h3>
 </div>
 <div className="h-[250px] w-full overflow-hidden">
 {loading ? <LoadingPlaceholder /> : (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={hcSpending} margin={{ top: 5, right: 10, left: 0, bottom: 25 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
 <XAxis 
 dataKey="name" 
 axisLine={false} 
 tickLine={false} 
 interval={0}
 tick={(props: any) => {
 const { x, y, payload } = props;
 const hc = hcSpending.find((h: any) => h.name === payload.value);
 const displayVal = payload.value.length > 15 ? payload.value.substring(0,15)+'...' : payload.value;
 return (
 <g transform={`translate(${x},${y})`}>
 <Link href={`/admin/users?tab=healthcare&id=${(hc as any)?.id}`} target="_blank">
 <text x={0} y={0} dy={16} textAnchor="middle" fill="#2563EB" className="text-[11px] font-semibold hover:underline cursor-pointer">
 {displayVal}
 </text>
 </Link>
 </g>
 );
 }} 
 />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(val) => `€${val}`} dx={-10} width={50} />
 <RechartsTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: any) => `€${Number(val).toFixed(2)}`} />
 <Bar dataKey="spend" name="Total Fees Paid" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
 </BarChart>
 </ResponsiveContainer>
 )}
 </div>
 </div>

 {/* VAT Summary */}
 <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-5 lg:p-6 print:break-inside-avoid flex flex-col items-center justify-center text-center">
 <Receipt className="w-12 h-12 text-gray-500/30 mb-4" />
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black mb-1">VAT Summary</h3>
 <p className="text-[13px] text-gray-500 mb-6">Estimated Value Added Tax collected.</p>
 <div className="text-4xl font-medium text-near-black tracking-tight mb-2">
 €{totalVat.toFixed(2)}
 </div>
 <p className="text-[12px] text-gray-500/70">Based on processed payments</p>
 </div>
 </div>

 {/* Revenue Breakdown Table */}
 <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 print:break-inside-avoid">
 <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black flex items-center gap-2">
 <FileText className="w-5 h-5 text-indigo-500" />
 Revenue Breakdown
 </h3>
 <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 print:hidden w-full sm:w-auto">
 <button 
 onClick={() => setBreakdownView('weekly')}
 className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[12px] font-semibold transition-colors ${breakdownView === 'weekly' ? 'bg-white text-near-black shadow-sm' : 'text-gray-500'}`}
 >
 Weekly
 </button>
 <button 
 onClick={() => setBreakdownView('monthly')}
 className={`flex-1 sm:flex-none px-3 py-1 rounded-md text-[12px] font-semibold transition-colors ${breakdownView === 'monthly' ? 'bg-white text-near-black shadow-sm' : 'text-gray-500'}`}
 >
 Monthly
 </button>
 </div>
 </div>
 <div className="hidden sm:block overflow-x-auto">
 <table className="w-full text-left whitespace-nowrap">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-200">
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Date Range</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-center">Recommendations</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Patient Pay</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">BC Payouts</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right text-primary-dark">Commission</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right text-emerald-700">Org Fees</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right text-blue-700">Material</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right text-amber-700">Logistics</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Refunds</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right text-near-black">Net Rev</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {loading ? (
 <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
 ) : breakdownData.length === 0 ? (
 <tr><td colSpan={9} className="px-6 py-8 text-center"><EmptyState /></td></tr>
 ) : (
 breakdownData.map((d: any) => (
 <tr key={d.key} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-6 py-4 text-[14px] font-medium text-near-black">{d.label}</td>
 <td className="px-6 py-4 text-[14px] text-gray-500 text-center">{d.recommendations}</td>
 <td className="px-6 py-4 text-[14px] text-gray-500 text-right">€{d.patientPayments.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] text-gray-500 text-right">€{d.bcPayouts.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-medium text-primary-dark text-right">€{d.commission.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-medium text-emerald-600 text-right">€{d.orgFees.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-medium text-blue-600 text-right">€{d.material.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-medium text-amber-600 text-right">€{d.logistics.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-medium text-red-600 text-right">€{d.refundsIssued.toFixed(2)}</td>
 <td className="px-6 py-4 text-[14px] font-bold text-near-black text-right">€{d.netRevenue.toFixed(2)}</td>
 </tr>
 ))
 )}
 </tbody>
 {breakdownData.length > 0 && !loading && (
 <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-[14px]">
 <tr>
 <td className="px-6 py-4 text-near-black">Total</td>
 <td className="px-6 py-4 text-center text-near-black">{breakdownData.reduce((a:any, b:any) => a + b.recommendations, 0) as number}</td>
 <td className="px-6 py-4 text-right text-near-black">€{(breakdownData.reduce((a:any, b:any) => a + b.patientPayments, 0) as number).toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-near-black">€{(breakdownData.reduce((a:any, b:any) => a + b.bcPayouts, 0) as number).toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-primary-dark">€{totalCommission.toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-emerald-600">€{totalOrgFees.toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-blue-600">€{fPayments.reduce((a:any,p:any) => a + (p.material_revenue || 0), 0).toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-amber-600">€{fPayments.reduce((a:any,p:any) => a + (p.logistics_revenue || 0), 0).toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-red-600">€{totalRefundedSum.toFixed(2)}</td>
 <td className="px-6 py-4 text-right text-near-black">€{(totalRev - totalRefundedSum).toFixed(2)}</td>
 </tr>
 </tfoot>
 )}
 </table>
 </div>

 {/* Mobile View */}
 <div className="block sm:hidden">
 {loading ? (
 <div className="p-8 text-center text-[13px] text-gray-500">Loading data...</div>
 ) : breakdownData.length === 0 ? (
 <div className="p-8 text-center text-[13px] text-gray-500">No data available</div>
 ) : (
 breakdownData.map((d: any) => (
 <div key={d.key} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex justify-between items-center mb-1">
 <div className="text-[14px] font-medium text-near-black">{d.label}</div>
 <div className="text-[13px] font-medium text-near-black">{d.recommendations} recommendations</div>
 </div>
 <div className="flex justify-between items-center text-[13px] text-gray-500">
 <div>Patient Pay: €{d.patientPayments.toFixed(2)}</div>
 <div className="font-bold text-near-black">Net: €{d.netRevenue.toFixed(2)}</div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>

 {/* Pending Payouts Table */}
 <div className="bg-white rounded-lg sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:break-inside-avoid">
 <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <h3 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black flex items-center gap-2">
 <Wallet className="w-5 h-5 text-amber-500" />
 Pending BC Payouts
 </h3>
 {totalPendingPayouts > 0 && (
 <div className="flex gap-3">
 <Badge variant="warning">Action Required</Badge>
 <button 
 onClick={handleReleaseAll}
 disabled={loading}
 className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[12px] font-bold"
 >
 Release All
 </button>
 </div>
 )}
 </div>
 <div className="hidden sm:block overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-gray-50 border-b border-gray-200">
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Blood Collector</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider">Next Payout Date</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Outstanding Balance</th>
 <th className="px-6 py-3 text-[12px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {loading ? (
 <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading data...</td></tr>
 ) : pendingPayoutsList.length === 0 ? (
 <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No pending payouts at this time.</td></tr>
 ) : (
 pendingPayoutsList.map((p: any) => (
 <tr key={p.bcId} className="hover:bg-gray-50/50 transition-colors">
 <td className="px-6 py-4">
 <Link href={`/admin/users?tab=blood_collectors&id=${p.bcId}`} className="text-[14px] font-bold text-blue-600 hover:underline">
 {p.bcName}
 </Link>
 </td>
 <td className="px-6 py-4 text-[14px] text-gray-500">
 {format(p.nextDate, 'MMM dd, yyyy')}
 </td>
 <td className="px-6 py-4 text-right text-[14px] font-bold text-near-black">
 €{p.amount.toFixed(2)}
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => handleReleasePayout(p.bcId)}
 disabled={loading}
 className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-md text-[12px] font-bold"
 >
 Release Payout
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 <div className="block sm:hidden">
 {loading ? (
 <div className="p-8 text-center text-[13px] text-gray-500">Loading...</div>
 ) : pendingPayoutsList.length === 0 ? (
 <div className="p-8 text-center text-[13px] text-gray-500">No pending payouts at this time.</div>
 ) : (
 pendingPayoutsList.map((p: any) => (
 <div key={p.bcId} className="p-4 border-b border-gray-100 last:border-b-0">
 <div className="flex justify-between items-center mb-1">
 <Link href={`/admin/users?tab=blood_collectors&id=${p.bcId}`} className="text-[14px] font-bold text-blue-600 hover:underline">
 {p.bcName}
 </Link>
 <div className="text-[14px] font-bold text-near-black">€{p.amount.toFixed(2)}</div>
 </div>
 <div className="text-[13px] text-gray-500">Next Payout: {format(p.nextDate, 'MMM dd, yyyy')}</div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 );
}

// --- Helper Components ---
function MetricCard({ title, value, icon: Icon, alert, highlight, className }: { title: string; value: string | number; icon: any; alert?: boolean, highlight?: boolean, className?: string }) {
  return (
    <div className={`rounded-2xl border p-3 sm:p-5 shadow-sm flex flex-col justify-between ${highlight ? 'bg-gradient-to-br from-primary to-primary-dark border-transparent text-white' : 'bg-white border-gray-200 print:shadow-none print:border-gray-300'} print:break-inside-avoid`}>
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-white/20' : 'bg-gray-50'}`}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-white' : 'text-gray-600'}`} />
        </div>
        {alert && <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm animate-pulse" />}
      </div>
      <div>
        <div className={`text-[13px] sm:text-[14px] font-medium mb-1 ${highlight ? 'text-white/80' : 'text-gray-500'}`}>{title}</div>
        <div className={`text-[20px] sm:text-[24px] font-bold tracking-tight ${className || (highlight ? 'text-white' : 'text-near-black')}`}>{value}</div>
      </div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
      <LoadingSpinner size="lg" />
      <span className="text-[12px] mt-2">Loading analytics...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500/60 text-center px-4">
      <Activity className="w-6 h-6 mb-2 opacity-50" />
      <span className="text-[12px]">Showing sample data — real data will appear as more recommendations are processed.</span>
    </div>
  );
}
