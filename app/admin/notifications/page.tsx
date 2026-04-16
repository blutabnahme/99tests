"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCheck, CreditCard, Truck, FlaskConical, Clock,
  Search, ArrowRight, UserPlus, Receipt, Stethoscope,
  AlertCircle, Package, ClipboardList
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatDate } from '@/lib/format-date';

const NOTIFICATION_ICONS: Record<string, any> = {
  payment_received: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
  bank_transfer_confirmed: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
  bank_transfer_pending: { icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
  kit_shipped: { icon: Truck, bg: 'bg-blue-50', color: 'text-blue-600' },
  results_ready: { icon: FlaskConical, bg: 'bg-[#E6F7F5]', color: 'text-[#008085]' },
  results_received: { icon: FlaskConical, bg: 'bg-[#E6F7F5]', color: 'text-[#008085]' },
  payment_confirmed: { icon: CreditCard, bg: 'bg-green-50', color: 'text-green-600' },
  new_doctor_registered: { icon: UserPlus, bg: 'bg-purple-50', color: 'text-purple-600' },
  doctor_verification_required: { icon: Stethoscope, bg: 'bg-amber-50', color: 'text-amber-600' },
  invoice_generated: { icon: Receipt, bg: 'bg-[#E6F7F5]', color: 'text-[#008085]' },
  invoice_sent: { icon: Receipt, bg: 'bg-blue-50', color: 'text-blue-600' },
  resend_requested: { icon: AlertCircle, bg: 'bg-red-50', color: 'text-red-600' },
  new_recommendation: { icon: ClipboardList, bg: 'bg-purple-50', color: 'text-purple-600' },
  new_order: { icon: Package, bg: 'bg-blue-50', color: 'text-blue-600' },
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-500' };
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tt_notification')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread' && n.is_read) return false;
      if (typeFilter !== 'all') {
        const notifType = n.notification_type || n.type;
        if (typeFilter === 'invoices' && !(notifType?.includes('invoice'))) return false;
        if (typeFilter === 'payments' && !(notifType?.includes('payment') || notifType?.includes('bank_transfer'))) return false;
        if (typeFilter === 'orders' && !(notifType?.includes('order') || notifType?.includes('kit') || notifType?.includes('results'))) return false;
        if (typeFilter === 'users' && !(notifType?.includes('doctor') || notifType?.includes('patient') || notifType?.includes('user'))) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!(n.title || '').toLowerCase().includes(q) && !(n.message || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, filter, typeFilter, search]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

  const toggleSelected = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    await supabase.from('tt_notification').update({ is_read: true }).in('id', ids);
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMarkingAll(false); return; }
    await supabase.from('tt_notification').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const markSelectedAsRead = async () => {
    await markAsRead(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleView = async (notification: any) => {
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    } else if (notification.reference_type === 'invoice') {
      router.push('/admin/invoices');
    } else if (notification.reference_type === 'recommendation' && notification.reference_id) {
      router.push(`/admin/recommendations/${notification.reference_id}`);
    } else if (notification.reference_type === 'order' && notification.reference_id) {
      router.push(`/admin/orders/${notification.reference_id}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] sm:text-[28px] text-near-black">Notifications</h1>
          <p className="text-[13px] text-gray-500 mt-1">Platform alerts and activities.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <button
                onClick={markSelectedAsRead}
                className="px-4 py-2 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[13px] font-medium transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                Mark {selectedIds.size} Read
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAll}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 text-[13px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </button>
              )}
            </>
          ) : (
            unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="px-4 py-2 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[13px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-[13px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
          />
        </div>

        {/* Read status */}
        <div className="flex items-center gap-1.5">
          {(['all', 'unread'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-full text-[12px] font-medium transition-colors ${
                filter === f
                  ? 'bg-[#008085] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : 'Unread'}
              {f === 'unread' && unreadCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter === f ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Type filter dropdown */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-full border border-gray-200 text-[13px] bg-white appearance-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%23999' stroke-width='1.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '32px',
          }}
        >
          <option value="all">All Types</option>
          <option value="invoices">Invoices</option>
          <option value="payments">Payments</option>
          <option value="orders">Orders & Shipments</option>
          <option value="users">Users</option>
        </select>
      </div>

      {/* Select All */}
      {filteredNotifications.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
            onChange={toggleSelectAll}
            className="rounded text-[#008085] focus:ring-[#008085]"
          />
          <span className="text-[12px] text-gray-500">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
          </span>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm py-16 text-center">
          <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-[14px] text-gray-400">
            {notifications.length === 0 ? "You're all caught up!" : "No notifications match your filters"}
          </p>
          <p className="text-[12px] text-gray-300 mt-1">
            {notifications.length === 0 ? "New notifications will appear here." : "Try adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notif: any) => {
            const { icon: Icon, bg, color } = getNotificationIcon(notif.notification_type || notif.type);
            const isSelected = selectedIds.has(notif.id);
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-[12px] border shadow-sm transition-all ${
                  isSelected ? 'border-[#008085]' : 'border-gray-200 hover:border-gray-300'
                } ${!notif.is_read ? 'bg-gradient-to-r from-[#E6F7F5]/30 to-transparent' : ''}`}
              >
                <div className="px-5 py-4 flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(notif.id)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1.5 rounded text-[#008085] focus:ring-[#008085]"
                  />
                  <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <button
                    onClick={() => handleView(notif)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium text-near-black">{notif.title}</span>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#008085]" />
                      )}
                      <span className="text-[11px] text-gray-400 ml-auto flex items-center gap-1 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {timeAgo(notif.created_at)}
                      </span>
                    </div>
                    {notif.message && (
                      <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                    )}
                  </button>
                  <button
                    onClick={() => handleView(notif)}
                    className="text-[#008085] hover:text-[#005C5F] transition-colors flex items-center gap-1 text-[12px] font-medium shrink-0"
                  >
                    View
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
