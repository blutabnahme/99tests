"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useEffect, useState } from "react";
import { Shield, Key, Save, CheckCircle, Loader2 } from "lucide-react";
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
 <LoadingSpinner size="lg" />
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
 <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm">
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
 <div>
 {saved && (
 <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 transition-colors">
 <CheckCircle className="w-4 h-4" /> Changes saved
 </div>
 )}
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
  const [notifPrefs, setNotifPrefs] = useState<any[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(data => { setNotifPrefs(data.preferences || []); setPrefsLoading(false); })
      .catch(() => setPrefsLoading(false));
  }, []);

  const togglePreference = async (type: string, currentEnabled: boolean) => {
    const updated = notifPrefs.map(p =>
      p.notification_type === type ? { ...p, enabled: !currentEnabled } : p
    );
    setNotifPrefs(updated);

    await fetch('/api/notifications/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: updated }),
    });
  };

  const PREF_LABELS: Record<string, { label: string; description: string }> = {
    payment_received: { label: 'Payment received', description: 'When a patient completes instant payment' },
    bank_transfer_confirmed: { label: 'Bank transfer confirmed', description: 'When admin confirms a bank transfer' },
    kit_shipped: { label: 'Kit shipped', description: 'When a test kit is shipped to the patient' },
    results_ready: { label: 'Results ready', description: 'When lab results are available' },
    bank_transfer_pending: { label: 'Bank transfer pending', description: 'When a patient selects bank transfer' },
    payment_confirmed: { label: 'Payment confirmed', description: 'When any payment is confirmed' },
    results_received: { label: 'Results received', description: 'When results arrive from the lab' },
    new_doctor_registered: { label: 'New doctor registered', description: 'When a new doctor signs up' },
  };

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm">
        {prefsLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="md" /></div>
        ) : (
          <div className="space-y-4">
            {notifPrefs.map(pref => {
              const info = PREF_LABELS[pref.notification_type] || {
                label: pref.notification_type.replace(/_/g, ' '),
                description: ''
              };
              return (
                <div key={pref.notification_type} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[#1A1D23]">{info.label}</p>
                    <p className="text-xs text-[#6E7280] mt-0.5">{info.description}</p>
                  </div>
                  <button
                    onClick={() => togglePreference(pref.notification_type, pref.enabled)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${
                      pref.enabled ? 'bg-[#008085]' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      pref.enabled ? 'left-[22px]' : 'left-[3px]'
                    }`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab() { 
 return (
 <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm py-12 flex flex-col items-center justify-center text-center min-h-[300px]">
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
 <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-sm py-12 flex flex-col items-center justify-center text-center min-h-[300px]">
 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
 <Key className="w-5 h-5 text-gray-400" />
 </div>
 <h3 className="text-[16px] font-medium text-near-black">API Access</h3>
 <p className="text-[14px] text-gray-500 mt-1 max-w-sm">Generate developer API tokens to securely integrate your practice software.</p>
 </div>
 ); 
}

const SETTINGS_TABS = [
  { id: 'profile', label: 'Practice Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'api', label: 'API Access' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SETTINGS_TABS.map(t => t.id).includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-0 mb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight">Settings</h1>
        <p className="text-gray-500 text-[14px] mt-1">Manage your practice account preferences and security.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6">
        {SETTINGS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-5 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#008085] text-[#008085]'
                : 'border-transparent text-gray-500 hover:text-[#1A1D23]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6" style={{ marginTop: '24px' }}>
        {activeTab === 'profile' && <PracticeProfileTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'api' && <APITab />}
      </div>
    </div>
  );
}
