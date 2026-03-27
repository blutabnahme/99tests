"use client";

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
              className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-white bg-primary hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px]"
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
                      className={`flex flex-col items-center justify-center text-center p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        isSelected 
                        ? 'border-primary bg-open-bg' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                      } ${loading ? 'opacity-50 pointer-events-none cursor-not-allowed bg-gray-50' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        isSelected ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Icon className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <span className={`text-[14px] font-medium leading-tight ${loading ? (isSelected ? 'text-gray-400' : 'text-gray-400') : 'text-near-black'}`}>{r.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Full Name *</label>
                <input 
                  type="text" 
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  required disabled={loading}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Email Address *</label>
                <input 
                  type="email" 
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required disabled={loading}
                  className={inputClass}
                />
              </div>

              {role === "doctor_practice" && (
                <>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Company Name *</label>
                    <input 
                      type="text" 
                      value={companyName} onChange={e => setCompanyName(e.target.value)}
                      placeholder="e.g. Health Center AG"
                      required disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Company Type *</label>
                    <select 
                      value={companyType} onChange={e => setCompanyType(e.target.value)}
                      required disabled={loading}
                      className={inputClass}
                    >
                      <option value="practice">Practice</option>
                      <option value="lab">Lab</option>
                      <option value="hospital">Hospital</option>
                      <option value="clinic">Clinic</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>City</label>
                    <input 
                      type="text" 
                      value={city} onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Berlin"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Contact Phone</label>
                    <input 
                      type="tel" 
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {role === "blood_collector" && (
                <>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Practice Fee (€)</label>
                    <input 
                      type="number" step="0.01" min="0"
                      value={practiceFee} onChange={e => setPracticeFee(e.target.value)}
                      placeholder="€0.00"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Home Visit Fee (€)</label>
                    <input 
                      type="number" step="0.01" min="0"
                      value={homeVisitFee} onChange={e => setHomeVisitFee(e.target.value)}
                      placeholder="€0.00"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {role === "patient" && (
                <>
                  <div className="sm:col-span-2 relative">
                    <label className={labelClass}>
                      Healthcare Company <span className="text-gray-400 font-normal ml-1">(optional)</span>
                    </label>

                    {selectedHc ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={selectedHcName}
                          disabled={loading}
                          className={`${inputClass} pl-10 pr-10 bg-open-bg border-primary text-primary-dark font-medium`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedHc("");
                            setSelectedHcName("");
                            setHcSearchTerm("");
                          }}
                          disabled={loading}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={hcSearchTerm}
                          onChange={(e) => {
                            setHcSearchTerm(e.target.value);
                            setShowHcDropdown(e.target.value.length >= 2);
                          }}
                          onFocus={() => {
                            if (hcSearchTerm.length >= 2) setShowHcDropdown(true);
                          }}
                          onBlur={() => setTimeout(() => setShowHcDropdown(false), 200)}
                          placeholder="Search by company name..."
                          disabled={loading}
                          className={`${inputClass} pl-10 pr-10`}
                        />
                        {hcSearchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setHcSearchTerm("");
                              setShowHcDropdown(false);
                            }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        
                        {showHcDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-[200px] overflow-y-auto">
                            {filteredHcs.length > 0 ? (
                              filteredHcs.map(hc => (
                                <div
                                  key={hc.id}
                                  onClick={() => {
                                    setSelectedHc(hc.id);
                                    setSelectedHcName(hc.name);
                                    setShowHcDropdown(false);
                                  }}
                                  className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors text-[14px] flex justify-between items-center"
                                >
                                  <span className="font-medium text-near-black">{hc.name}</span>
                                  <span className="text-[12px] text-gray-500 capitalize px-2 py-0.5 bg-gray-100 rounded-md">{hc.type.replace(/_/g, ' ')}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-[14px] text-gray-500 italic text-center">
                                No companies found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Date of Birth</label>
                    <input 
                      type="date"
                      value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone Number</label>
                    <input 
                      type="tel"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                    <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Insurance Details</label>
                  </div>
                  <div>
                    <label className={labelClass}>Provider</label>
                    <input 
                      type="text"
                      value={insuranceProvider} onChange={e => setInsuranceProvider(e.target.value)}
                      placeholder="e.g. TK, AOK"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Insurance Number</label>
                    <input 
                      type="text"
                      value={insuranceNumber} onChange={e => setInsuranceNumber(e.target.value)}
                      placeholder="123456789"
                      disabled={loading}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-start cursor-pointer group w-fit">
                <input 
                  type="checkbox" 
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary/20 cursor-pointer shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[13px] text-gray-500 ml-2 cursor-pointer transition-colors group-hover:text-near-black">Send credentials via email to the user</span>
                  <span className="text-[12px] text-gray-400 ml-6">The user will receive their login credentials at the email address provided.</span>
                </div>
              </label>
            </div>
          </form>
        </div>

        <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-gray-100 shrink-0 bg-gray-50 flex items-center justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full border border-gray-200 text-[14px] font-semibold text-gray-500 hover:text-near-black hover:bg-gray-100 bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="createUserForm"
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-[14px] font-semibold text-white bg-primary hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}
