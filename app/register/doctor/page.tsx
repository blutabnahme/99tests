"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { createClient } from "@/lib/supabase";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { COUNTRIES, PHONE_PREFIXES } from "@/lib/countries";
import { SPECIALTIES } from "@/lib/specialties";
import { PhoneInput } from "@/components/ui/PhoneInput";
import {
  Building2,
  FileText,
  User,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { useTranslations } from 'next-intl';

const steps = [
  { icon: User, label: "Account Setup" },
  { icon: Building2, label: "Practice Information" },
  { icon: FileText, label: "Contact Details" }
];

export default function DoctorRegistrationPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations();

  const [step, setStep] = useState(0);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Practice Info
  const [fullName, setFullName] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Step 3: Contact
  const [phonePrefix, setPhonePrefix] = useState("+49");
  const [phoneSystem, setPhoneSystem] = useState("");
  
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("DE"); // Default to DE (Deutschland)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (step === 0 && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setStep(Math.min(step + 1, steps.length - 1));
  };
  
  const prev = () => setStep(Math.max(step - 1, 0));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be strictly less than 5MB");
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only PDF, JPG, and PNG are allowed.");
      return;
    }

    setUploadingDoc(true);
    setError(null);
    setDocFile(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // 'doctorId' will just use Date.now() on the server if missing, perfect for pre-auth uploads
      
      const res = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload document");

      setDocUrl(data.url);
    } catch (err: any) {
      setError(err.message);
      setDocFile(null);
      setDocUrl(null);
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = () => {
    setDocFile(null);
    setDocUrl(null);
    const fileInput = document.getElementById('verification-doc') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const completePhone = `${phonePrefix}${phoneSystem.replace(/^0+/, '')}`;

    try {
      // 1. Hit the server proxy API directly to forge user via supabaseAdmin
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          practiceName,
          specialty,
          licenseNumber,
          phone: completePhone,
          street,
          zip,
          city,
          country,
          verificationDocumentUrl: docUrl
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete registration");
      }

      // 2. We now sign in the user via the client to populate their local session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        router.push("/login?success=Account created, please log in.");
        return;
      }

      // 3. Navigate to dashboard securely
      router.push("/dashboard");

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h2 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">Account Setup</h2>
              <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1 mb-6">Create your 99Tests Doctor Profile securely.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-gray-200">
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <Label required>{t('auth.email')}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.hc.emailPlaceholder")}
                />
              </div>
              <div className="space-y-1.5">
                <Label required>{t('auth.password')}</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.pwdPlaceholderCreate")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label required>{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.pwdPlaceholderReenter")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100 mt-4 leading-relaxed">
                {error}
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">Practice Information</h2>
              <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1 mb-6">Tell us about your practice.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label required>Full Name (Title & Name)</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. med. Max Mustermann"
                />
              </div>
              
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label required>Practice Name</Label>
                <Input
                  value={practiceName}
                  onChange={(e) => setPracticeName(e.target.value)}
                  placeholder="e.g. Hausarztpraxis Mustermann"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Specialty</Label>
                <SearchableSelect
                  value={specialty}
                  onChange={(val) => setSpecialty(val)}
                  options={SPECIALTIES.map(s => ({ id: s.value, name: s.label }))}
                  placeholder="Select specialty..."
                  searchPlaceholder="Search specialty..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>License Number (Arztnummer)</Label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. 123456789"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                <Label>Verification Document</Label>
                <p className="text-[12px] text-gray-500 mb-3 mt-0.5">Upload a verification document (e.g., Approbationsurkunde, Arztnummer-Nachweis). PDF, PNG, JPG up to 5MB.</p>
                
                {docFile ? (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-[10px] bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 pr-4">
                        <div className="text-[13px] font-medium text-near-black truncate max-w-[200px]">{docFile.name}</div>
                        <div className="text-[11px] text-gray-400">{(docFile.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    {uploadingDoc ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                    ) : (
                      <button type="button" onClick={removeDocument} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative group">
                    <input 
                      type="file" 
                      id="verification-doc"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[12px] p-6 bg-gray-50/50 group-hover:bg-primary/5 group-hover:border-primary/50 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-primary mb-2 transition-colors" />
                      <div className="text-[13px] font-medium text-near-black">Click to upload or drag and drop</div>
                      <div className="text-[12px] text-gray-400 mt-1">PDF, JPG, PNG</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100 mt-4 leading-relaxed">
                {error}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">Contact Details</h2>
              <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1 mb-6">Where is your primary practice located?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Phone</Label>
                <PhoneInput
                  prefix={phonePrefix}
                  onPrefixChange={(val) => setPhonePrefix(val)}
                  value={phoneSystem}
                  onChange={(val) => setPhoneSystem(val)}
                  placeholder="176 1234 5678"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Street & House Number</Label>
                <Input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Musterstrasse 1"
                />
              </div>

              <div className="space-y-1.5">
                <Label>ZIP</Label>
                <Input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="10115"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Berlin"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 space-y-1.5">
                <Label>Country</Label>
                <SearchableSelect
                  value={country}
                  onChange={(val) => setCountry(val)}
                  options={COUNTRIES.map(c => ({ id: c.code, name: c.name, description: c.flag }))}
                  placeholder="Select a country..."
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-[13px] rounded-lg border border-red-100 mt-4 leading-relaxed">
                {error}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex flex-col font-body pb-12">
      {/* ════════ HEADER ════════ */}
      <header className="sticky top-0 z-30 flex items-center justify-between w-full px-4 py-3 bg-white border-b border-gray-100 shrink-0 mb-8">
        <Link href="/">
          <img src="/logo.svg" alt="99Tests" className="h-7 sm:h-8 w-auto" />
        </Link>
        <div className="text-[12px] sm:text-[13px] text-gray-500 whitespace-nowrap">
          <span className="hidden sm:inline">{t('auth.hasAccount')}</span> <Link href="/login" className="text-primary-dark font-semibold hover:text-primary ml-1">{t('auth.login')}</Link>
        </div>
      </header>

      <div className="w-full max-w-[1000px] mx-auto flex flex-col md:flex-row gap-8 px-4 sm:px-6">
        
        {/* ════════ STEP INDICATOR SIDEBAR ════════ */}
        <div className="hidden md:block w-56 shrink-0 pt-4">
          <div className="sticky top-8 space-y-6">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isPast = i < step;

              return (
                <div key={i} className="flex flex-col relative">
                  {i < steps.length - 1 && (
                    <div className={`absolute top-8 left-[19px] bottom-[-24px] w-[2px] ${isPast ? "bg-primary" : "bg-gray-200"} transition-colors`} />
                  )}
                  <div 
                    onClick={() => i <= step && setStep(i)}
                    className={`flex items-center gap-4 ${i <= step ? "cursor-pointer" : "opacity-60"}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all shadow-sm ${
                      isActive ? "bg-primary text-white shadow-primary/30 scale-110" : 
                      isPast ? "bg-primary text-white" : 
                      "bg-white border border-gray-200 text-gray-500"
                    }`}>
                      {isPast ? (
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                      )}
                    </div>
                    <span className={`text-[14px] font-semibold ${
                      isActive ? "text-primary-dark" : 
                      isPast ? "text-near-black" : 
                      "text-gray-500"
                    }`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════ MAIN CONTENT ════════ */}
        <div className="flex-1">
          <div className="bg-white rounded-[20px] border border-gray-200 p-6 sm:p-10 md:p-12 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {renderStep()}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button
              variant="ghost"
              onClick={prev}
              disabled={step === 0 || loading}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-semibold text-[14px] transition-all
                ${step === 0 || loading ? "opacity-0 cursor-default hidden sm:flex" : "text-gray-500 hover:bg-gray-100"}`}
              style={{ height: "44px" }}
            >
              <ArrowLeft className="w-4 h-4" /> {t("auth.btnPrevious")}
            </Button>

            {/* Mobile indicator text */}
            <div className="text-center text-[12px] text-gray-400 font-medium md:hidden">
              Step {step + 1} of {steps.length}
            </div>

            {step < steps.length - 1 ? (
              <Button 
                onClick={next} 
                variant="primary" 
                className="w-full sm:w-auto order-first sm:order-last px-6 py-2.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2"
                style={{ height: "44px" }}
                disabled={uploadingDoc}
              >
                {t("auth.btnContinue")} <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading || uploadingDoc} 
                variant="primary" 
                className="w-full sm:w-auto order-first sm:order-last px-6 py-2.5 rounded-full text-[14px] font-semibold flex items-center justify-center gap-2"
                style={{ height: "44px" }}
              >
                {loading || uploadingDoc ? "Registering..." : (
                  <>Complete Registration <CheckSquare className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
