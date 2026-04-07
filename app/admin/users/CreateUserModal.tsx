"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from "react";
import { 
 Shield, 
 Building2, 
 User, 
 Heart,
 Loader2,
 AlertCircle,
 Search,
 X,
 Check,
 Copy,
 Mail
} from "lucide-react";

type Role = "admin" | "doctor_practice" | "blood_collector" | "patient";

interface CreateUserModalProps {
 onClose: () => void;
 onSuccess: () => void;
}

export function CreateUserModal({ onClose, onSuccess }: CreateUserModalProps) {
 const [role, setRole] = useState<Role>("admin");
 const [loading, setLoading] = useState(false);
 const [errorString, setErrorString] = useState("");
 const [successData, setSuccessData] = useState<{name: string, email: string, role: string, tempPassword: string, emailSent?: boolean} | null>(null);
 const [copied, setCopied] = useState(false);
 const [sendEmail, setSendEmail] = useState(true);

 // Form Fields
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 
 // Doctor Fields
 const [companyName, setCompanyName] = useState("");
 const [companyType, setCompanyType] = useState("practice");
 const [city, setCity] = useState("");
 const [phone, setPhone] = useState("");

 // BC Fields
 const [practiceFee, setPracticeFee] = useState("");
 const [homeVisitFee, setHomeVisitFee] = useState("");

 // Patient Fields
 const [selectedHc, setSelectedHc] = useState("");
 const [selectedHcName, setSelectedHcName] = useState("");
 const [hcSearchTerm, setHcSearchTerm] = useState("");
 const [showHcDropdown, setShowHcDropdown] = useState(false);
 const [dateOfBirth, setDateOfBirth] = useState("");
 const [insuranceProvider, setInsuranceProvider] = useState("");
 const [insuranceNumber, setInsuranceNumber] = useState("");
 const [hcs, setHcs] = useState<{id: string, name: string, type: string}[]>([]);

 const filteredHcs = hcSearchTerm.length >= 2 
 ? hcs.filter(hc => hc.name.toLowerCase().includes(hcSearchTerm.toLowerCase()))
 : [];

 // Pre-fetch HCs for Patient dropdown
 useEffect(() => {
 fetch('/api/admin/users')
 .then(res => res.json())
 .then(data => {
 if (data.hcs) setHcs(data.hcs.map((h: any) => ({ id: h.id, name: h.name, type: h.type || 'practice' })));
 })
 .catch(err => console.error("Failed to fetch HCs", err));
 }, []);

 const roles = [
 { id: "admin", label: "Admin", icon: Shield },
 { id: "doctor_practice", label: "Healthcare Company", icon: Building2 },
 { id: "blood_collector", label: "Blood Collector", icon: User },
 { id: "patient", label: "Patient", icon: Heart },
 ] as const;

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorString("");
 
 if (!name.trim() || !email.trim()) {
 return setErrorString("Full Name and Email are required.");
 }
 if (role === "doctor_practice" && (!companyName.trim() || !companyType.trim())) {
 return setErrorString("Company Name and Type are required for Healthcare Companies.");
 }

 setLoading(true);
 
 try {
 const payload = {
 role,
 name,
 email,
 companyName,
 companyType,
 city,
 phone,
 practiceFee,
 homeVisitFee,
 dateOfBirth,
 insuranceProvider,
 insuranceNumber,
 hcId: selectedHc,
 sendEmail
 };

 const res = await fetch("/api/admin/users/create", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload)
 });
 
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || "Failed to create user.");
 
 setSuccessData({
 name,
 email,
 role: roles.find(r => r.id === role)?.label || role,
 tempPassword: data.tempPassword,
 emailSent: data.emailSent
 });
 } catch (err: any) {
 setErrorString(err.message || "An unexpected error occurred.");
 } finally {
 setLoading(false);
 }
 };

 const handleCopy = () => {
 if (successData?.tempPassword) {
 navigator.clipboard.writeText(successData.tempPassword);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 };

 const inputClass = "w-full rounded-full border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 px-4 py-2.5 text-[14px] bg-white disabled:opacity-50";
 const labelClass = "block text-[13px] font-medium text-gray-700 mb-1.5";

 if (successData) {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white rounded-[16px] shadow-xl w-full max-w-[480px] overflow-hidden flex flex-col mx-4 animate-in zoom-in-95 duration-200">
 
 <div className="p-8 pb-6 flex flex-col items-center">
 <div className="bg-green-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
 <Check className="w-7 h-7 text-green-600" />
 </div>
 <h2 className="font-heading text-[18px] font-medium text-center text-near-black mb-6">User Created Successfully</h2>
 
 <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mb-2">
 <div className="flex justify-between items-center mb-1">
 <span className="text-[13px] text-gray-500">Name</span>
 <span className="text-[14px] font-medium text-near-black">{successData.name}</span>
 </div>
 <div className="flex justify-between items-center mb-1">
 <span className="text-[13px] text-gray-500">Email</span>
 <span className="text-[14px] font-medium text-gray-600 truncate max-w-[200px]">{successData.email}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[13px] text-gray-500">Role</span>
 <span className="text-[12px] font-medium text-primary bg-open-bg px-2 py-0.5 rounded-md">{successData.role}</span>
 </div>
 </div>

 <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
 <div className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</div>
 <div className="font-mono text-[16px] text-near-black bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
 <span>{successData.tempPassword}</span>
 <button 
 onClick={handleCopy}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors hover:bg-gray-100 text-gray-600"
 >
 {copied ? (
 <><Check className="w-4 h-4 text-green-600" /> <span className="text-green-600">Copied!</span></>
 ) : (
 <><Copy className="w-4 h-4" /> Copy</>
 )}
 </button>
 </div>
 <div className="text-[12px] text-gray-500 mt-3 flex items-start gap-1.5 leading-relaxed">
 <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
 <span>
 {successData.emailSent 
 ? "A password reset link was also sent to their email. The temporary password above can be used for immediate access."
 : "Share this password securely with the user. They should change it after their first login."}
 </span>
 </div>
 </div>

 {successData.emailSent && (
 <div className="text-[13px] text-green-600 flex items-center gap-1.5 mt-2 w-full">
 <Mail className="w-4 h-4 shrink-0" />
 <span>A password reset email has been sent to <strong>{successData.email}</strong></span>
 </div>
 )}
 </div>

 <div className="px-6 py-5 border-t border-gray-100 bg-white flex justify-end">
 <button 
 onClick={() => onSuccess()}
 className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] "
 >
 Done
 </button>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white rounded-[16px] shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col mx-4 animate-in zoom-in-95 duration-200">
 
 <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 shrink-0 bg-white">
 <h2 className="font-heading text-[20px] font-medium text-near-black">Create New User</h2>
 </div>

 <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
 {errorString && (
 <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-[13px] flex items-start gap-2">
 <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
 <span>{errorString}</span>
 </div>
 )}

 <form id="createUserForm" onSubmit={handleSubmit} className="space-y-6">
 <div>
 <label className={labelClass}>Select Role</label>
 <div className="grid grid-cols-2 gap-3">
 {roles.map(r => {
 const Icon = r.icon;
 const isSelected = role === r.id;
 return (
 <div 
 key={r.id}
 onClick={() => !loading && setRole(r.id)}
 className={`flex flex-col items-center justify-center text-center p-4 rounded-xl cursor-pointer transition-colors border-2 ${
 isSelected 
 ? 'border-primary bg-open-bg' 
 : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
 } ${loading ? 'opacity-50 pointer-events-none cursor-not-allowed bg-gray-50' : ''}`}
 >
                  <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                  <span className={`text-[13px] font-semibold ${isSelected ? 'text-primary-dark' : 'text-gray-600'}`}>{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-1 sm:col-span-2">
            <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={loading} className={inputClass} placeholder="First Last" />
          </div>
          <div className="col-span-1 sm:col-span-2">
            <label className={labelClass}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} className={inputClass} placeholder="email@example.com" />
          </div>

          {role === 'doctor_practice' && (
            <>
              <div className="col-span-1 sm:col-span-2">
                <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} disabled={loading} className={inputClass} placeholder="e.g. Praxis Dr. med. Beispiel" />
              </div>
              <div className="col-span-1">
                <label className={labelClass}>Company Type <span className="text-red-500">*</span></label>
                <select value={companyType} onChange={e => setCompanyType(e.target.value)} disabled={loading} className={inputClass}>
                  <option value="practice">Medical Practice</option>
                  <option value="clinic">Clinic / Hospital</option>
                  <option value="lab">Laboratory</option>
                  <option value="other">Other Healthcare Company</option>
                </select>
              </div>
            </>
          )}

          {(role === 'doctor_practice' || role === 'blood_collector' || role === 'patient') && (
             <div className="col-span-1">
                <label className={labelClass}>City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} disabled={loading} className={inputClass} placeholder="e.g. Berlin" />
             </div>
          )}

          <div className="col-span-1 sm:col-span-2">
            <label className={labelClass}>Phone</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} className={inputClass} placeholder="+49 ..." />
          </div>

          {role === 'blood_collector' && (
            <>
              <div className="col-span-1">
                 <label className={labelClass}>Practice Fee (€)</label>
                 <input type="number" step="0.01" value={practiceFee} onChange={e => setPracticeFee(e.target.value)} disabled={loading} className={inputClass} placeholder="15.00" />
              </div>
              <div className="col-span-1">
                 <label className={labelClass}>Home Visit Fee (€)</label>
                 <input type="number" step="0.01" value={homeVisitFee} onChange={e => setHomeVisitFee(e.target.value)} disabled={loading} className={inputClass} placeholder="35.00" />
              </div>
            </>
          )}

          {role === 'patient' && (
            <>
              <div className="col-span-1">
                 <label className={labelClass}>Date of Birth</label>
                 <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} disabled={loading} className={inputClass} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                 <label className={labelClass}>Assign to Healthcare Company</label>
                 <select value={selectedHc} onChange={e => setSelectedHc(e.target.value)} disabled={loading} className={inputClass}>
                   <option value="">None / Unassigned</option>
                   {hcs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                 </select>
              </div>
            </>
          )}

          <div className="col-span-1 sm:col-span-2 flex items-center gap-3 mt-2">
             <input type="checkbox" id="sendEmail" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} disabled={loading} className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
             <label htmlFor="sendEmail" className="text-[13px] text-gray-700 font-medium">Send welcome email with password setup</label>
          </div>
        </div>
      </form>
      </div>

      <div className="px-6 sm:px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0 bg-gray-50/50">
        <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 text-[14px] font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50">Cancel</button>
        <button type="submit" form="createUserForm" disabled={loading} className="min-w-[120px] px-6 py-2 rounded-full text-[14px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-70 disabled:hover:bg-primary flex items-center justify-center">
          {loading ? <LoadingSpinner size="lg" /> : "Create User"}
        </button>
      </div>
    </div>
  </div>
  );
}
