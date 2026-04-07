"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { 
 Bell, Check, Clock, FileText, CheckCircle, XCircle, 
 Activity, Star, Calendar, CreditCard, AlertTriangle, 
 Users, Search, ArrowRight, UserCircle, ChevronLeft, ChevronRight, CheckCircle2, Trash2, ChevronDown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslations } from "next-intl";

type Notification = {
 id: string;
 type: string;
 title: string;
 message: string;
 link: string | null;
 read: boolean;
 created_at: string;
};

const TABS = ['All', 'Unread', 'Critical', 'Recommendations', 'Users', 'System'];

export default function AdminNotificationsPage() {
 const t = useTranslations();
 const supabase = createClient();
 const router = useRouter();
 
 // Use the hook to sync global unread count badge on sidebar, but manage local large list here
 const { markAsRead: globalMarkAsRead, markAllAsRead: globalMarkAllAsRead } = useNotifications();
 
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState("All");
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const [selectedIds, setSelectedIds] = useState<string[]>([]);
 const itemsPerPage = 10;

 useEffect(() => {
 fetchNotifications();

 const fetchUser = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;
 
 const channel = supabase.channel('page_notifications_changes')
 .on('postgres_changes', { 
 event: '*', 
 schema: 'public', 
 table: 'notifications',
 filter: `user_id=eq.${user.id}`
 }, () => {
 fetchNotifications();
 })
 .subscribe();
 
 return () => {
 supabase.removeChannel(channel);
 };
 };
 
 fetchUser();
 }, []);

 const fetchNotifications = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;

 const { data, error } = await supabase
 .from('notifications')
 .select('*')
 .eq('user_id', user.id)
 .order('created_at', { ascending: false })
 .limit(500); // Fetch a large chunk for local filtering/pagination

 if (!error && data) {
 setNotifications(data);
 }
 setLoading(false);
 };

 const getSeverity = (type: string) => {
 if (type === 'system_alert') return 'critical';
 if (type === 'appointment_reminder') return 'warning';
 return 'info';
 };

 const getIcon = (type: string) => {
 switch (type) {
 case "new_opportunity": return <Star className="w-5 h-5 text-amber-500" />;
 case "application_received": return <FileText className="w-5 h-5 text-blue-500" />;
 case "application_accepted": return <CheckCircle className="w-5 h-5 text-emerald-500" />;
 case "application_rejected": return <XCircle className="w-5 h-5 text-rose-500" />;
 case "case_update": return <Activity className="w-5 h-5 text-indigo-500" />;
 case "shortlist_ready": return <Users className="w-5 h-5 text-purple-500" />;
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

 const handleMarkAsRead = async (ids: string[]) => {
 // Manually push to exact same API that handles array bulk marks natively
 await fetch('/api/notifications', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'mark_read', ids })
 });
 // Trigger global navbar update (which requires iterative pulls)
 for (const id of ids) {
 await globalMarkAsRead(id);
 }
 setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
 };

 const handleMarkAllAsRead = async () => {
 if (selectedIds.length > 0) {
 await handleMarkAsRead(selectedIds);
 setSelectedIds([]);
 } else {
 await globalMarkAllAsRead();
 setNotifications(prev => prev.map(n => ({ ...n, read: true })));
 }
 };

 const handleClearResolved = async () => {
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return;
 
 if (selectedIds.length > 0) {
 await supabase.from('notifications').delete().eq('user_id', user.id).in('id', selectedIds);
 setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
 setSelectedIds([]);
 } else {
 await supabase.from('notifications').delete().eq('user_id', user.id).eq('read', true);
 setNotifications(prev => prev.filter(n => !n.read));
 }
 };

 const filteredNotifications = useMemo(() => {
 return notifications
 .filter(n => {
 // Tab filter
 if (activeTab === 'Unread') return !n.read;
 if (activeTab === 'Critical') return n.type === 'system_alert';
 if (activeTab === 'Recommendations') return n.type === 'case_update' || n.type === 'new_opportunity' || n.type === 'appointment_reminder';
 if (activeTab === 'Users') return n.type.includes('application') || n.type === 'shortlist_ready';
 if (activeTab === 'System') return n.type === 'system_alert' || n.type === 'payment_received';
 return true;
 })
 .filter(n => {
 // Text filter
 if (!searchQuery.trim()) return true;
 const query = searchQuery.toLowerCase();
 return n.title.toLowerCase().includes(query) || n.message.toLowerCase().includes(query);
 });
 }, [notifications, activeTab, searchQuery]);

 const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
 const currentItems = filteredNotifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

 // Reset to page 1 when filters change
 useEffect(() => {
 setCurrentPage(1);
 }, [activeTab, searchQuery]);

 return (
 <div className="flex-1 min-w-0">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
 <div>
 <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
 {t('nav.notifications')}
 </h1>
 <p className="text-[13px] sm:text-[15px] text-gray-500">Manage your platform alerts and activities.</p>
 </div>
 <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
 {selectedIds.length > 0 && (
 <span className="hidden sm:inline text-[13px] text-gray-500 sm:mr-2">{selectedIds.length} selected</span>
 )}
 <button 
 onClick={handleMarkAllAsRead}
 className="flex-1 sm:flex-none h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-near-black text-[12px] sm:text-[13px] font-semibold rounded-lg sm:rounded-full hover:bg-gray-50 transition-colors shadow-sm"
 >
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 {selectedIds.length > 0 ? "Mark Selected" : "Mark All Read"}
 </button>
 <button 
 onClick={handleClearResolved}
 className="flex-1 sm:flex-none h-9 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-near-black text-[12px] sm:text-[13px] font-semibold rounded-lg sm:rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
 >
 <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 shrink-0" />
 {selectedIds.length > 0 ? "Clear Selected" : "Clear Resolved"}
 </button>
 </div>
 </div>

 <div className="bg-white rounded-lg border border-gray-200 flex flex-col min-h-[400px] mt-4 overflow-hidden">
 
 {/* Desktop Toolbar */}
 <div className="hidden sm:flex lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
 <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" style={{ scrollbarWidth: 'none' }}>
 {TABS.map(tab => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-4 py-2 rounded-lg text-[13px] shrink-0 font-semibold transition-colors whitespace-nowrap ${
 activeTab === tab 
 ? "bg-gray-100 text-near-black" 
 : "text-gray-500 hover:bg-gray-50 hover:text-near-black"
 }`}
 >
 {tab}
 {tab === 'Unread' && (
 <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary-light text-primary-dark text-[11px]">
 {notifications.filter(n => !n.read).length}
 </span>
 )}
 </button>
 ))}
 </div>

 <div className="flex items-center gap-4 shrink-0">
 <label className="flex items-center gap-2 shrink-0 cursor-pointer text-[13px] font-medium text-gray-600 hover:text-near-black transition-colors pl-1">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
 checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
 onChange={(e) => {
 if (e.target.checked) setSelectedIds(currentItems.map(n => n.id));
 else setSelectedIds([]);
 }}
 />
 Select All
 </label>
 <div className="relative w-[300px] shrink-0">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input 
 type="text"
 placeholder="Search notifications..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-9 w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-400"
 />
 </div>
 </div>
 </div>

 {/* Mobile Toolbar Elements */}
 <div className="flex flex-col sm:hidden">
 {/* Mobile Tab Select */}
 <div className="relative p-3 border-b border-gray-100">
 <select
 value={activeTab}
 onChange={(e) => setActiveTab(e.target.value)}
 className="w-full h-9 rounded-lg border border-gray-200 bg-white text-[13px] pl-3 pr-8 font-medium text-near-black appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
 >
 {TABS.map(tab => (
 <option key={tab} value={tab}>
 {tab} {tab === 'Unread' ? `(${notifications.filter(n => !n.read).length})` : ''}
 </option>
 ))}
 </select>
 <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 </div>

 {/* Mobile Select All & Search */}
 <div className="flex items-center gap-3 p-3 border-b border-gray-100">
 <label className="shrink-0 flex items-center gap-2 cursor-pointer text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors">
 <input
 type="checkbox"
 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
 checked={currentItems.length > 0 && selectedIds.length === currentItems.length}
 onChange={(e) => {
 if (e.target.checked) setSelectedIds(currentItems.map(n => n.id));
 else setSelectedIds([]);
 }}
 />
 Select All
 </label>
 <div className="relative flex-1 shrink-0">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input 
 type="text"
 placeholder="Search..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="h-9 w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-gray-400"
 />
 </div>
 </div>
 </div>

 {/* List Content */}
 <div className="flex-1 flex flex-col">
 {loading ? (
 <div className="flex justify-center py-20">
 <div className="w-8 h-8 flex items-center justify-center rounded-full animate-pulse bg-gray-200"></div>
 </div>
 ) : currentItems.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-24 text-center">
 <div className="w-16 h-16 rounded-full bg-emerald-50 relative flex items-center justify-center mb-5">
 <Bell className="w-7 h-7 text-emerald-600" />
 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
 <CheckCircle className="w-4 h-4 text-emerald-600 fill-white" />
 </div>
 </div>
 <h3 className="text-lg font-medium text-near-black">No notifications yet</h3>
 <p className="text-[14px] text-gray-500 mt-1.5 max-w-[250px] mx-auto">When something important happens, you will see it here.</p>
 </div>
 ) : (
 currentItems.map(notification => {
 const severity = getSeverity(notification.type);
 const isUnread = !notification.read;
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
 {/* Select Checkbox */}
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
 <h4 className={`hidden sm:block text-[14px] font-medium ${isUnread ? 'text-near-black' : 'text-gray-500'}`}>
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
 <p className={`text-[13px] mt-1 sm:mt-0 ${isUnread ? 'text-gray-700' : 'text-gray-500'} sm:truncate break-words`}>
 {notification.message}
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0 ml-[36px] sm:ml-0 pr-1 lg:pr-3">
 {isUnread ? (
 <button 
 onClick={() => handleMarkAsRead([notification.id])}
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
 onClick={async () => {
 if (!notification.read) await handleMarkAsRead([notification.id]);
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
 })
 )}
 </div>
 {/* Pagination */}
 {totalPages > 1 && (
 <div className="p-4 flex items-center justify-between text-[13px] font-medium text-gray-500">
 <div>
 Showing <span className="text-near-black">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-near-black">{Math.min(currentPage * itemsPerPage, filteredNotifications.length)}</span> of <span className="text-near-black">{filteredNotifications.length}</span> notifications
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={currentPage === 1}
 className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white bg-white transition-colors"
 >
 <ChevronLeft className="w-4 h-4" />
 </button>
 <div className="px-2">
 Page {currentPage} of {totalPages}
 </div>
 <button 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={currentPage === totalPages}
 className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white bg-white transition-colors"
 >
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
