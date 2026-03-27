"use client";

import { useEffect, useState } from "react";
import { Building2, Bell, Shield, Key, Save, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { COUNTRIES } from "@/lib/countries";
import { SPECIALTIES } from "@/lib/specialties";

interface ProfileData {
  full_name: string;
  practice_name: string;
  specialty: string;
  license_number: string;
  email: string;
  phone: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
}

function PracticeProfileTab() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/doctor/profile");
        if (!res.ok) throw new Error("Failed to load profile data");
        const json = await res.json();
        
        // Map db fields
        setData({
          full_name: json.profile.full_name || "",
          practice_name: json.profile.practice_name || "",
          specialty: json.profile.specialty || "",
          license_number: json.profile.license_number || "",
          email: json.profile.email || "",
          phone: json.profile.phone || "",
          address_street: json.profile.address_street || "",
          address_zip: json.profile.address_zip || "",
          address_city: json.profile.address_city || "",
          address_country: json.profile.address_country || "DE"
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData(prev => prev ? { ...prev, [name]: value } : null);
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to save profile updates");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 min-h-[300px]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl text-[13px] border border-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6 border-b border-gray-100 pb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-[20px] font-medium text-near-black tracking-tight m-0">Practice Profile</h2>
          <p className="text-[14px] text-gray-500 m-0 mt-0.5">Manage your personal and clinical details.</p>
        </div>
        {saved && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 transition-all">
            <CheckCircle className="w-4 h-4" /> Changes saved
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[13px] font-medium text-gray-700">Full Name</label>
            <input name="full_name" value={data?.full_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[13px] font-medium text-gray-700">Practice Name</label>
            <input name="practice_name" value={data?.practice_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Specialty</label>
            <SearchableSelect
              value={data?.specialty || ''}
              onChange={(val) => setData(p => p ? { ...p, specialty: val } : null)}
              options={SPECIALTIES.map(s => ({ id: s.value, name: s.label }))}
              placeholder="Select specialty..."
              searchPlaceholder="Search specialty..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">License Number (Arztnummer)</label>
            <input name="license_number" value={data?.license_number} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Contact Email</label>
            <input disabled name="email" value={data?.email} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-100 bg-gray-50 text-gray-500 outline-none cursor-not-allowed" />
            <span className="text-[11px] text-gray-400">Email cannot be changed here.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">Phone</label>
            <input name="phone" value={data?.phone} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>
        </div>

        <h3 className="text-[15px] font-medium text-gray-900 border-b border-gray-100 pb-2 mt-8 mb-4">Location</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[13px] font-medium text-gray-700">Street & House Number</label>
            <input name="address_street" value={data?.address_street} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">ZIP</label>
            <input name="address_zip" value={data?.address_zip} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-gray-700">City</label>
            <input name="address_city" value={data?.address_city} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none transition-colors" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[13px] font-medium text-gray-700">Country</label>
            <SearchableSelect
              value={data?.address_country || 'DE'}
              onChange={(val) => setData(p => p ? { ...p, address_country: val } : null)}
              options={COUNTRIES.map(c => ({ id: c.code, name: c.name, description: c.flag }))}
              placeholder="Select Country..."
            />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="sm:hidden">
            {saved && <span className="text-sm font-medium text-emerald-600">Saved!</span>}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-2.5 rounded-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ml-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationsTab() { 
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
        <Bell className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-[16px] font-medium text-near-black">Notifications</h3>
      <p className="text-[14px] text-gray-500 mt-1 max-w-sm">Manage your email and platform notification preferences here soon.</p>
    </div>
  ); 
}

function SecurityTab() { 
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
        <Shield className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-[16px] font-medium text-near-black">Security</h3>
      <p className="text-[14px] text-gray-500 mt-1 max-w-sm">Password management and 2FA settings will be available in future releases.</p>
    </div>
  ); 
}

function APITab() { 
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
        <Key className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-[16px] font-medium text-near-black">API Access</h3>
      <p className="text-[14px] text-gray-500 mt-1 max-w-sm">Generate developer API tokens to securely integrate your practice software.</p>
    </div>
  ); 
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const t = useTranslations('hc');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['profile', 'notifications', 'security', 'api'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  };

  const tabs = [
    { id: "profile", label: "Practice Profile", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "api", label: "API Access", icon: Key },
  ];

  return (
    <div className="flex-1 min-w-0 w-full mb-20 font-body animate-in fade-in duration-300">
      <div className="mb-6 xl:mb-8">
        <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
          Settings
        </h1>
        <p className="text-[13px] sm:text-[15px] text-gray-500 m-0">
          Manage your practice account preferences and security.
        </p>
      </div>

      <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-sm">
        <div className="w-full md:w-[240px] xl:w-[280px] border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 p-4 shrink-0 overflow-x-auto hide-scrollbar">
          <div className="flex flex-row md:flex-col gap-1.5 min-w-max md:min-w-0 pb-1 md:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-[10px] transition-all text-[13px] font-medium text-left ${
                    isActive
                      ? "bg-white text-near-black shadow-sm border border-gray-200/60 font-semibold"
                      : "text-gray-500 hover:bg-gray-100 hover:text-near-black border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-gray-400"}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 xl:p-10 min-w-0 max-w-full bg-white">
          {activeTab === "profile" && <PracticeProfileTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "api" && <APITab />}
        </div>
      </div>
    </div>
  );
}
