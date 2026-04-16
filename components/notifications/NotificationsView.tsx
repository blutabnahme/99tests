"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Clock, FileText, CheckCircle, XCircle, Activity, Star, Calendar, CreditCard, AlertTriangle, ChevronDown, ChevronRight, Filter, 
 Trash2, CheckCircle2, ArrowRight, Search, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

export default function NotificationsView({
 searchParams = {},
 basePath = "/dashboard/notifications"
}: {
 searchParams?: { filter?: string; type?: string };
 basePath?: string;
}) {
 const router = useRouter();
 const t = useTranslations();
 const [notifications, setNotifications] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [total, setTotal] = useState(0);
 const [unreadCount, setUnreadCount] = useState(0);
 const [page, setPage] = useState(1);
 const [filter, setFilter] = useState<'all' | 'unread'>((searchParams?.filter as any) || 'all');
 const [typeFilter, setTypeFilter] = useState(searchParams?.type || 'all');
 const [searchQuery, setSearchQuery] = useState("");
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const supabase = createClient();
 const limit = 10;

 const fetchNotifications = useCallback(async (isLoadMore = false) => {
 try {
 if (!isLoadMore) setLoading(true);
 const res = await fetch(`/api/notifications?filter=${filter}&type=${typeFilter}&page=${page}&limit=${limit}`);
 if (res.ok) {
 const data = await res.json();
 if (page === 1) {
 setNotifications(data.notifications || []);
 } else {
 setNotifications(prev => [...prev, ...(data.notifications || [])]);
 }
 setTotal(data.total || 0);
 setUnreadCount(data.unreadCount || 0);
 }
 } catch (error) {
 console.error("Failed to fetch notifications:", error);
 } finally {
 setLoading(false);
 }
 }, [filter, typeFilter, page, limit]);

 useEffect(() => {
 fetchNotifications(page > 1);
 }, [fetchNotifications, page, filter, typeFilter]);

 const markAsRead = async (ids: string[]) => {
 try {
 const res = await fetch('/api/notifications', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'mark_read', ids })
 });
 if (res.ok) {
 setNotifications(prev => prev.map(n => 
 ids.includes(n.id) ? { ...n, is_read: true } : n
 ));
 setUnreadCount(prev => Math.max(0, prev - ids.length));
 }
 } catch (error) {
 console.error("Failed to mark as read:", error);
 }
 };

 const handleMarkAllAsRead = async () => {
 if (selectedIds.length > 0) {
 await markAsRead(selectedIds);
 setSelectedIds([]);
 } else {
 try {
 const res = await fetch('/api/notifications', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'mark_all_read' })
 });
 if (res.ok) {
 setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
 setUnreadCount(0);
 }
 } catch (error) {
 console.error("Failed to mark all as read:", error);
 }
 }
 };

 const handleClearResolved = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;
 
 if (selectedIds.length > 0) {
 await supabase.from('tt_notification').delete().eq('user_id', user.id).in('id', selectedIds);
 setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
 setSelectedIds([]);
 } else {
 await supabase.from('tt_notification').delete().eq('user_id', user.id).eq('is_read', true);
 setNotifications(prev => prev.filter(n => !n.read));
 }
 };
 const getIcon = (type: string) => {
 switch (type) {
 case "new_opportunity": return <Star className="w-5 h-5 text-amber-500" />;
 case "application_received": return <FileText className="w-5 h-5 text-blue-500" />;
 case "application_accepted": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
 case "application_rejected": return <XCircle className="w-5 h-5 text-rose-500" />;
 case "case_update": return <Activity className="w-5 h-5 text-indigo-500" />;
 case "shortlist_ready": return <AlertTriangle className="w-5 h-5 text-purple-500" />; 
 case "appointment_reminder": return <Calendar className="w-5 h-5 text-orange-500" />;
 case "payment_received": return <CreditCard className="w-5 h-5 text-emerald-600" />;
 case "system_alert": return <AlertTriangle className="w-5 h-5 text-rose-600" />;
 default: return <Bell className="w-5 h-5 text-gray-500" />;
 }
 };

 const getSource = (type: string, link: string | null) => {
 if (link?.includes('/recommendations/')) return `Recommendation ${link.split('/').pop()}`;
 if (link?.includes('/users/')) return `User ${link.split('/').pop()}`;
 if (type.includes('application')) return 'Network Application';
 if (type === 'system_alert') return 'System Event';
 return 'Platform';
 };

 const types = [
 { value: "all", label: t('notifications.allTypes') },
 { value: "new_opportunity", label: t("ui.notifications.types.new_opportunity") },
 { value: "application_received", label: t("ui.notifications.types.application_received") },
 { value: "case_update", label: t("ui.notifications.types.case_update") },
 { value: "payment_received", label: t("ui.notifications.types.payment_received") },
 { value: "system_alert", label: t("ui.notifications.types.system_alert") },
 ];

 return (
 <div className="min-h-full bg-transparent">
 <main className="flex-1 min-w-0 w-full">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">{t('notifications.title')}</h1>
 <p className="text-[13px] sm:text-[15px] text-gray-500">{t('notifications.subtitle')}</p>
 </div>

 <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
 {selectedIds.length > 0 && <span className="hidden sm:inline text-[13px] text-gray-500 sm:mr-2">{t("ui.notifications.selectedText", { count: selectedIds.length })}</span>}
 <button 
 onClick={handleMarkAllAsRead}
 className="flex-1 sm:flex-none h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-near-black text-[12px] sm:text-[13px] font-semibold rounded-lg sm:rounded-full hover:bg-gray-50 transition-colors shadow-sm"
 >
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 {selectedIds.length > 0 ? t("ui.notifications.markSelected") : t('common.markAllRead')}
 </button>
 <button 
 onClick={handleClearResolved}
 className="flex-1 sm:flex-none h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-near-black text-[12px] sm:text-[13px] font-semibold rounded-lg sm:rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
 >
 <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 shrink-0" />
 {selectedIds.length > 0 ? t("ui.notifications.clearSelected") : t("ui.notifications.clearResolved")}
 </button>
 </div>
 </div>

 <div className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-[400px] mt-4 overflow-hidden">
 
 {/* Top Filter Tabs Row */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200">
 <div className="flex overflow-x-auto gap-0" style={{ scrollbarWidth: 'none' }}>
 <button 
 onClick={() => { setFilter("all"); setPage(1); }}
 className={`px-6 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 ${
 filter === "all" ? "border-[#008085] text-[#008085]" : "border-transparent text-gray-500 hover:text-gray-900"
 }`}
 >
 {t('common.all')}
 </button>
 <button 
 onClick={() => { setFilter("unread"); setPage(1); }}
 className={`px-6 py-3 text-[14px] font-semibold whitespace-nowrap shrink-0 transition-colors border-b-2 flex items-center gap-2 ${
 filter === "unread" ? "border-[#008085] text-[#008085]" : "border-transparent text-gray-500 hover:text-gray-900"
 }`}
 >
 {t('notifications.unread')}
 {unreadCount > 0 && (
 <span className={`px-1.5 py-0.5 rounded-full text-[11px] ${filter === 'unread' ? 'bg-[#008085] text-white' : 'bg-primary-light text-primary-dark'}`}>
 {unreadCount}
 </span>
 )}
 </button>
 </div>
 
 <div className="hidden sm:block p-3">
 {/* Type Filter */}
 <div className="relative group w-full sm:w-auto">
 <button className="flex items-center justify-between sm:justify-center gap-2 w-full sm:w-auto px-4 py-1.5 h-9 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-500 hover:bg-gray-100 transition-colors">
 <span className="flex items-center gap-2">
 <Filter className="w-4 h-4 text-gray-400" />
 {types.find(t => t.value === typeFilter)?.label || "Filter Type"}
 </span>
 <ChevronDown className="w-4 h-4 text-gray-400" />
 </button>
 <div className="absolute right-0 top-full w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-colors z-10 flex flex-col py-1">
 {types.map((type) => (
 <button
 key={type.value}
 onClick={() => { setTypeFilter(type.value); setPage(1); }}
 className={`px-4 py-2 text-[13px] text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${
 typeFilter === type.value ? "text-near-black font-semibold" : "text-gray-600 font-medium"
 }`}
 >
 {type.label}
 {typeFilter === type.value && <Check className="w-3.5 h-3.5" />}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* Toolbar row: Select All + Search */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
 <label className="flex items-center gap-2 shrink-0 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-near-black transition-colors pl-1">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
 checked={notifications.length > 0 && selectedIds.length === notifications.length}
 onChange={(e) => {
 if (e.target.checked) setSelectedIds(notifications.map(n => n.id));
 else setSelectedIds([]);
 }}
 />
 Select All
 </label>
 <div className="relative w-full sm:w-[300px] shrink-0">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input 
 type="text"
 placeholder={t("ui.notifications.searchPlaceholder")}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-9 w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-400"
 />
 </div>
 </div>

 <div className="flex-1 flex flex-col">
 {loading && page === 1 ? (
 <div className="flex items-center justify-center py-20">
 <div className="w-8 h-8 rounded-full border-2 border-[#008085] border-t-transparent animate-spin"></div>
 </div>
 ) : !notifications || notifications.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
 <div className="w-16 h-16 rounded-full bg-emerald-50 relative flex items-center justify-center mb-5">
 <Bell className="w-7 h-7 text-emerald-600" />
 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
 <CheckCircle className="w-4 h-4 text-emerald-600 fill-white" />
 </div>
 </div>
 <h3 className="text-lg font-medium text-near-black">{t('notifications.noNotifications')}</h3>
 <p className="text-[14px] text-gray-500 mt-1 max-w-[250px] mx-auto">
 {filter === "unread" 
 ? t('notifications.allCaughtUp')
 : t("ui.notifications.whenImportant")}
 </p>
 {(filter !== "all" || typeFilter !== "all" || searchQuery !== "") && (
 <button 
 onClick={() => { setFilter("all"); setTypeFilter("all"); setSearchQuery(""); setPage(1); }}
 className="mt-6 px-4 py-2 bg-gray-50 text-near-black border border-gray-200 font-medium text-[13px] rounded-lg hover:bg-gray-100 transition-colors"
 >
 {t('notifications.clearFilters')}
 </button>
 )}
 </div>
 ) : (
 <div className="flex flex-col">
 {notifications.filter(n => {
 if (!searchQuery.trim()) return true;
 const query = searchQuery.toLowerCase();
 return n.title?.toLowerCase().includes(query) || n.message?.toLowerCase().includes(query);
 }).map((notification) => {
 const isUnread = !notification.is_read;
 const source = getSource(notification.type, notification.link);

 return (
 <div 
 key={notification.id}
 className={`group bg-white flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-3 p-3 sm:p-4 transition-colors border-b border-gray-100 last:border-b-0 ${
 selectedIds.includes(notification.id) ? "bg-primary-light/10 border-l-[3px] border-l-[#008085]" :
 isUnread 
 ? "bg-[#FEF0F2]/30 border-l-[3px] border-l-[#008085]" 
 : "hover:bg-gray-50 border-l-[3px] border-transparent"
 }`}
 >
 <div className="flex items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mb-1 sm:mb-0">
 <div className="shrink-0 flex items-center justify-center pt-1.5 sm:pt-0 pl-1 sm:pl-2">
 <input
 type="checkbox"
 checked={selectedIds.includes(notification.id)}
 onChange={(e) => {
 if (e.target.checked) setSelectedIds(prev => [...prev, notification.id]);
 else setSelectedIds(prev => prev.filter(id => id !== notification.id));
 }}
 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
 />
 </div>
 
 <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
 {getIcon(notification.type)}
 </div>

 <div className="flex-1 min-w-0 sm:hidden">
 <h4 className={`text-[14px] font-medium leading-tight break-words pt-1 ${isUnread ? 'text-near-black' : 'text-gray-500'}`}>
 {notification.title}
 </h4>
 </div>
 </div>
 
 <div className="flex-1 min-w-0 flex flex-col justify-center ml-[36px] sm:ml-0">
 <div className="flex items-center gap-2 flex-wrap sm:mb-0.5">
 <h4 className={`hidden sm:block text-[14px] font-medium ${isUnread ? "text-near-black" : "text-gray-500"}`}>
 {notification.title}
 </h4>
 {isUnread && (
 <span className="bg-[#FEF0F2] text-[#008085] text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded shrink-0 leading-none flex items-center mt-[1px]">
 New
 </span>
 )}
 <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium sm:ml-1 mt-1 sm:mt-0">
 <span className="flex items-center gap-0.5">
 <UserCircle className="w-3.5 h-3.5" />
 {source}
 </span>
 <span className="flex items-center gap-0.5 text-gray-400">
 <Clock className="w-3.5 h-3.5" />
 {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
 </span>
 </div>
 </div>
 
 <p className={`text-[13px] mt-1 sm:mt-0 ${isUnread ? "text-gray-700" : "text-gray-500"} sm:truncate break-words`}>
 {notification.message}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0 ml-[36px] sm:ml-0 pr-1 lg:pr-3">
 {isUnread ? (
 <button 
 onClick={(e) => { e.stopPropagation(); markAsRead([notification.id]); }}
 className="text-[12px] text-gray-500 hover:text-primary px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 bg-gray-50 border border-gray-200 sm:border-transparent hover:bg-gray-100"
 >
 <Check className="w-3.5 h-3.5" />
 Resolve
 </button>
 ) : (
 <span className="text-[12px] font-semibold text-gray-400 px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-default bg-transparent">
 <CheckCircle2 className="w-3.5 h-3.5" />
 Resolved
 </span>
 )}

 {notification.link && (
 <button 
 onClick={async (e) => {
 e.stopPropagation();
 if (isUnread) await markAsRead([notification.id]);
 router.push(notification.link!);
 }}
 className="text-[12px] font-semibold text-primary-dark hover:text-primary-dark bg-open-bg hover:bg-primary-light px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
 >
 View
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>
 );
 })}
 
 {notifications.length < total && (
 <div 
 onClick={() => setPage(p => p + 1)}
 className="w-full py-3 text-center text-[13px] font-semibold text-gray-500 hover:text-near-black hover:bg-gray-50 transition-colors border-t border-gray-100 cursor-pointer flex items-center justify-center gap-2"
 >
 {loading && page > 1 ? (
 <>
 <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></div>
 Loading...
 </>
 ) : (
 t('common.loadMore')
 )}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 </main>
 </div>
 );
}

