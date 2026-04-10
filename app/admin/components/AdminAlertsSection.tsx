'use client';

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { BellRing, ShieldAlert, ArrowRight, Check, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from '@/lib/format-date';

interface Notification {
 id: string;
 type: string;
 title: string;
 message: string;
 link: string;
 read: boolean;
 created_at: string;
}

export default function AdminAlertsSection() {
 const supabase = createClient();
 const [alerts, setAlerts] = useState<Notification[]>([]);
 const [loading, setLoading] = useState(true);
 const [runningCheck, setRunningCheck] = useState(false);

 const runAlertCheck = async () => {
 setRunningCheck(true);
 try {
 const res = await fetch('/api/cron/alerts');
 const data = await res.json();
 if (data.success) {
 const r = data.alerts_created;
 alert(`Manual Check Complete:\n\nReminders: ${r.appointment_reminders}\nOpen 48h: ${r.no_applications_48h}\nOpen 72h: ${r.no_applications_72h}\nBC No Complete: ${r.bc_no_completion}\nPayments Pending: ${r.payment_pending}`);
 } else {
 alert('Failed to run alert check');
 }
 } catch (e) {
 alert('Network error while running check');
 }
 setRunningCheck(false);
 };

 useEffect(() => {
 fetchAlerts();

 // Listen for new alerts specifically for this admin
 const sub = supabase.channel('admin_alerts')
 .on('postgres_changes', { 
 event: 'INSERT', 
 schema: 'public', 
 table: 'notifications' 
 }, (payload) => {
 const newNotif = payload.new as Notification;
 if (!newNotif.read && newNotif.type === 'system_alert') {
 setAlerts(prev => [newNotif, ...prev]);
 }
 })
 .subscribe();

 return () => {
 supabase.removeChannel(sub);
 };
 }, []);

 const fetchAlerts = async () => {
 setLoading(true);
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data } = await supabase
 .from('notifications')
 .select('*')
 .eq('user_id', user.id)
 .eq('type', 'system_alert')
 .eq('read', false)
 .order('created_at', { ascending: false })
 .limit(3);

 if (data) setAlerts(data);
 setLoading(false);
 };

 const markAsResolved = async (id: string) => {
 await supabase.from('notifications').update({ read: true }).eq('id', id);
 setAlerts(prev => prev.filter(a => a.id !== id));
 };

 if (loading) {
 return <div className="animate-pulse h-32 bg-gray-100 rounded-2xl mb-8"></div>;
 }

 if (alerts.length === 0) {
 return (
 <div className="mb-8">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <h2 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black flex items-center gap-2">
 <ShieldAlert className="w-5 h-5 text-gray-400" /> 
 Critical System Alerts
 </h2>
 <button 
 onClick={runAlertCheck} 
 disabled={runningCheck}
 className="group flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
 Run Alert Check
 </button>
 </div>
 <Link href="/admin/notifications" className="text-[13px] font-semibold text-primary-dark hover:text-primary-dark">
 View All
 </Link>
 </div>
 <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
 <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
 <Check className="w-6 h-6 text-emerald-600" />
 </div>
 <h3 className="font-medium text-emerald-900 text-[15px]">All clear — no critical alerts</h3>
 <p className="text-[13px] text-emerald-800/80 mt-1">Your system is running smoothly.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="mb-8">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <h2 className="font-heading text-[16px] sm:text-[18px] font-medium text-near-black flex items-center gap-2">
 <ShieldAlert className="w-5 h-5 text-red-500" /> 
 Critical System Alerts
 </h2>
 <button 
 onClick={runAlertCheck} 
 disabled={runningCheck}
 className="group flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors disabled:opacity-50"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${runningCheck ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
 Run Alert Check
 </button>
 </div>
 <Link href="/admin/notifications" className="text-[13px] font-semibold text-primary-dark hover:text-primary-dark">
 View All
 </Link>
 </div>
 
 <div className="space-y-3">
 {alerts.map(alert => (
 <div key={alert.id} className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
 
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-red-100">
 <BellRing className="w-5 h-5 text-red-600" />
 </div>
 <div>
 <h3 className="font-medium text-red-900 text-[15px]">{alert.title}</h3>
 <p className="text-[13px] text-red-800/80 mt-0.5 max-w-2xl leading-relaxed">{alert.message}</p>
 <div className="text-[11px] font-semibold text-red-500/80 mt-2 uppercase tracking-wider">
 {formatDate(alert.created_at)}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 pl-14 sm:pl-0 shrink-0">
 <button 
 onClick={() => markAsResolved(alert.id)}
 className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 text-red-600 transition-colors"
 title="Dismiss alert"
 >
 <Check className="w-5 h-5" />
 </button>
 
 {alert.link && (
 <Link href={alert.link}>
 <Button variant="primary" className="h-10 px-5 rounded-full bg-primary hover:bg-primary-dark shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] text-[13px] font-semibold flex items-center gap-2 transition-colors">
 Take Action
 <ArrowRight className="w-4 h-4" />
 </Button>
 </Link>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
