"use client";

import { useEffect, useState } from "react";
import { Building2, Bell, Shield, Key } from "lucide-react";
// Sub-component mocks since original Hematch settings routing was decoupled
function CompanyProfileTab() { return <div className="text-gray-500 py-10 text-center">Practice Profile settings coming soon</div>; }
function NotificationsTab() { return <div className="text-gray-500 py-10 text-center">Notification settings coming soon</div>; }
function SecurityTab() { return <div className="text-gray-500 py-10 text-center">Security settings coming soon</div>; }
function APITab() { return <div className="text-gray-500 py-10 text-center">API keys and documentation coming soon</div>; }
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const t = useTranslations('hc');

  useEffect(() => {
    // Check if there's a hash in the URL when the component mounts
    const hash = window.location.hash.replace('#', '');
    if (hash && ['profile', 'notifications', 'security', 'api'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Update the URL hash without scrolling
    window.history.replaceState(null, '', `#${tabId}`);
  };

  const tabs = [
    { id: "profile", label: t('settings.tabs.profile.title', { fallback: "Practice Profile" }), icon: Building2 },
    { id: "notifications", label: t('settings.tabs.notifications.title', { fallback: "Notifications" }), icon: Bell },
    { id: "security", label: t('settings.tabs.security.title', { fallback: "Security" }), icon: Shield },
    { id: "api", label: t('settings.tabs.api.title', { fallback: "API Access" }), icon: Key },
  ];

  return (
    <div className="flex-1 min-w-0 w-full mb-20 font-body">
      <div className="mb-6 xl:mb-8">
        <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
          {t('settings.title', { fallback: "Settings" })}
        </h1>
        <p className="text-[13px] sm:text-[15px] text-gray-500 m-0">
          {t('settings.subtitle', { fallback: "Manage your practice account preferences and security." })}
        </p>
      </div>

      <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        <div className="w-full md:w-[240px] xl:w-[280px] border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 p-4 shrink-0 overflow-x-auto hide-scrollbar">
          <div className="flex flex-row md:flex-col gap-1 min-w-max md:min-w-0 pb-1 md:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all text-[13px] font-medium text-left ${
                    isActive
                      ? "bg-white text-primary-dark shadow-xs border border-gray-200 font-semibold"
                      : "text-gray-600 hover:bg-gray-100 hover:text-near-black border border-transparent"
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] ${isActive ? "text-primary text-[20px]" : "text-gray-400"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 xl:p-10 min-w-0 max-w-full">
          {activeTab === "profile" && <CompanyProfileTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "api" && <APITab />}
        </div>
      </div>
    </div>
  );
}
