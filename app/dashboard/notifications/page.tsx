"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, CreditCard, Truck, FlaskConical, Clock, Search, ArrowRight, UserPlus } from 'lucide-react';
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
  return formatDate(date);
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?filter=${filter}&limit=${page * 20}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) markAsRead(notification.id);
    if (notification.reference_id) {
      if (notification.reference_type === 'recommendation' || notification.reference_type === 'order') {
        router.push(`/dashboard/recommendations/${notification.reference_id}`);
      }
    }
  };

  // Client-side filtering
  const filteredNotifications = notifications.filter(n => {
    if (typeFilter !== 'all' && n.notification_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const selectedAll = filteredNotifications.length > 0 && filteredNotifications.every(n => selectedIds.has(n.id));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight">Notifications</h1>
          <p className="text-gray-500 text-[14px] mt-1">Manage your alerts and activity updates.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-[13px] font-semibold text-[#008085] hover:text-[#005C5F] transition-colors">
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center justify-between">
        <div className="flex">
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              filter === 'all' ? 'border-[#008085] text-[#008085]' : 'border-transparent text-gray-500 hover:text-[#1A1D23]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-5 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              filter === 'unread' ? 'border-[#008085] text-[#008085]' : 'border-transparent text-gray-500 hover:text-[#1A1D23]'
            }`}
          >
            Unread
          </button>
        </div>

        <div className="flex items-center gap-3 pb-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 pr-8 text-[13px] rounded-full border border-gray-200 outline-none bg-white appearance-none cursor-pointer
              bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236E7280%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')]
              bg-[length:12px] bg-[right_10px_center] bg-no-repeat"
          >
            <option value="all">All Types</option>
            <option value="payment_received">Payment Received</option>
            <option value="bank_transfer_confirmed">Bank Transfer</option>
            <option value="kit_shipped">Kit Shipped</option>
            <option value="results_ready">Results Ready</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-4 w-56 text-[13px] rounded-full border border-gray-200 outline-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-[16px] overflow-hidden shadow-sm" style={{ marginTop: '24px' }}>
          {/* Select All row */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <input
              type="checkbox"
              checked={selectedAll}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
                } else {
                  setSelectedIds(new Set());
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]"
            />
            <span className="text-[13px] text-gray-500">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
            </span>
            {selectedIds.size > 0 && (
              <button
                onClick={async () => {
                  for (const id of Array.from(selectedIds)) {
                    await fetch(`/api/notifications/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ is_read: true }),
                    });
                  }
                  setNotifications(prev => prev.map(n => selectedIds.has(n.id) ? { ...n, is_read: true } : n));
                  setSelectedIds(new Set());
                }}
                className="text-[12px] font-semibold text-[#008085] hover:text-[#005C5F] ml-2"
              >
                Mark selected as read
              </button>
            )}
          </div>

          {/* Notification rows */}
          {filteredNotifications.map((notification, index) => {
            const { icon: Icon, bg, color } = getNotificationIcon(notification.notification_type);
            const isSelected = selectedIds.has(notification.id);

            return (
              <div
                key={notification.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  !notification.is_read ? 'bg-[#FAFFFE]' : 'bg-white'
                } hover:bg-gray-50 ${
                  index !== filteredNotifications.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    const newSelected = new Set(selectedIds);
                    if (isSelected) newSelected.delete(notification.id);
                    else newSelected.add(notification.id);
                    setSelectedIds(newSelected);
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085] flex-shrink-0"
                />

                <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[14px] ${!notification.is_read ? 'font-semibold' : 'font-medium'} text-[#1A1D23]`}>
                      {notification.title}
                    </span>
                    {notification.metadata?.display_id && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-mono text-gray-500">
                        Rec {notification.metadata.display_id}
                      </span>
                    )}
                    <span className="text-[12px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#6E7280] mt-0.5 truncate">{notification.message}</p>
                </div>

                {notification.reference_id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNotificationClick(notification); }}
                    className="flex items-center gap-1 text-[12px] font-semibold text-[#008085] hover:text-[#005C5F] transition-colors flex-shrink-0"
                  >
                    View
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Load More */}
          {notifications.length < total && (
            <div className="py-4 text-center border-t border-gray-100">
              <button
                onClick={() => setPage(p => p + 1)}
                className="text-[13px] font-semibold text-gray-500 hover:text-[#1A1D23] transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
