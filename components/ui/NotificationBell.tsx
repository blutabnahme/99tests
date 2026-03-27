"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, Clock, FileText, CheckCircle, XCircle, Activity, Star, Calendar, CreditCard, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useTranslations } from 'next-intl';

export function NotificationBell() {
  const t = useTranslations();
  const tc = useTranslations('common');
  const { notifications, unreadCount, markAllAsRead, markAsRead, userId } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_opportunity": return <Star className="w-4 h-4 text-amber-500" />;
      case "application_received": return <FileText className="w-4 h-4 text-blue-500" />;
      case "application_accepted": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "application_rejected": return <XCircle className="w-4 h-4 text-rose-500" />;
      case "case_update": return <Activity className="w-4 h-4 text-indigo-500" />;
      case "shortlist_ready": return <Users className="w-4 h-4 text-purple-500" />; // Assuming Users available from somewhere or fallback
      case "appointment_reminder": return <Calendar className="w-4 h-4 text-orange-500" />;
      case "payment_received": return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case "system_alert": return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-500-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-medium text-near-black text-[14px]">{t("ui.notifications.title")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[12px] font-medium text-primary-dark hover:text-primary-dark flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {tc("markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto w-full">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-500/40" />
                </div>
                <p className="text-[14px] font-medium text-gray-500-600">{t("ui.notifications.noNotifications")}</p>
                <p className="text-[12px] text-gray-500 mt-1">{t("ui.notifications.whenImportant")}</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 p-4 text-left border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start mb-0.5 gap-2">
                        <p className={`text-[13px] font-semibold truncate ${!notification.read ? "text-near-black" : "text-gray-500-700"}`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0 text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span className="text-[11px] whitespace-nowrap">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[13px] line-clamp-2 leading-relaxed ${!notification.read ? "text-gray-500-700" : "text-gray-500"}`}>
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50/50">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block w-full py-2 text-center text-[13px] font-medium text-gray-500-600 hover:text-near-black hover:bg-gray-100 rounded-md transition-colors"
            >
              {t("ui.notifications.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
