"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { COUNTRIES } from "@/lib/countries";

const calculateAge = (dob: string): number => {
 if (!dob) return 0;
 const birth = new Date(dob);
 const today = new Date();
 let age = today.getFullYear() - birth.getFullYear();
 const monthDiff = today.getMonth() - birth.getMonth();
 if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
 age--;
 }
 return age;
};

interface PatientModalProps {
 isOpen: boolean;
 onClose: () => void;
 patient?: any;
 onSuccess: () => void;
}

const TABS = [
 { id: 'personal', label: 'Personal Information' },
 { id: 'contact', label: 'Contact Details' },
 { id: 'medical', label: 'Medical Information' }
];

export function PatientModal({ isOpen, onClose, patient, onSuccess }: PatientModalProps) {
 const [mounted, setMounted] = useState(false);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState('personal');

 const [phonePrefix, setPhonePrefix] = useState(patient?.phone?.includes(" ") ? patient.phone.split(" ")[0] : "+49");
 const [phoneSystem, setPhoneSystem] = useState(patient?.phone?.includes(" ") ? patient.phone.split(" ").slice(1).join(" ") : (patient?.phone || ""));

 const [formData, setFormData] = useState({
 salutation: patient?.salutation || "Herr",
 first_name: patient?.first_name || "",
 last_name: patient?.last_name || "",
 email: patient?.email || "",
 gender: patient?.gender || "M",
 date_of_birth: patient?.date_of_birth || "",
 is_minor: patient?.is_minor || false,
 guardian_salutation: patient?.guardian_salutation || "Herr",
 guardian_first_name: patient?.guardian_first_name || "",
 guardian_last_name: patient?.guardian_last_name || "",
 address_line1: patient?.address_line1 || "",
 address_line2: patient?.address_line2 || "",
 address_city: patient?.address_city || "",
 address_state: patient?.address_state || "",
 address_zip: patient?.address_zip || "",
 address_country: patient?.address_country || "DE",
 insured_status: patient?.insured_status || "gesetzlich",
 family_doctor: patient?.family_doctor || "",
 observations: patient?.observations || ""
 });

 useEffect(() => {
 setMounted(true);
 }, []);

 if (!mounted || !isOpen) return null;

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 if (name === 'date_of_birth') {
 const isMinor = value ? calculateAge(value) < 18 : false;
 setFormData(prev => ({ ...prev, [name]: value, is_minor: isMinor }));
 } else {
 setFormData(prev => ({ ...prev, [name]: value }));
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 setError(null);

 try {
 const url = patient ? `/api/doctor/patients/${patient.id}` : `/api/doctor/patients`;
 const method = patient ? 'PUT' : 'POST';

 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 ...formData,
 phone: phoneSystem ? `${phonePrefix} ${phoneSystem}` : ""
 })
 });
 const data = await res.json();
 
 if (!res.ok) throw new Error(data.error || 'Operation failed');
 
 onSuccess();
 onClose();
 } catch (err: any) {
 setError(err.message);
 } finally {
 setIsSubmitting(false);
 }
 };

 return createPortal(
 <div 
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
 style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
 onClick={onClose}
 >
 <div 
 className="bg-white rounded-[20px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 <div className="sticky top-0 bg-white z-20 shadow-sm border-b border-gray-100">
 <div className="px-6 py-4 flex items-center justify-between">
 <div>
 <h2 className="font-heading text-lg font-medium text-near-black">
 {patient ? "Edit Patient" : "Register Patient"}
 </h2>
 <p className="text-[13px] text-gray-500 mt-0.5">
 Please provide accurate patient details for testing processes.
 </p>
 </div>
 <button 
 type="button" 
 onClick={onClose} 
 className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex overflow-x-auto px-6 hide-scrollbar">
 {TABS.map(tab => (
 <button
 type="button"
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`px-4 py-3 text-[14px] font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'}`}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>

 <div className="p-6 font-body">
 {error && (
 <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
 {error}
 </div>
 )}

 <form id="patient-form" onSubmit={handleSubmit}>
 {/* TAB: PERSONAL */}
 <div className={activeTab === 'personal' ? 'block space-y-6' : 'hidden'}>
 <div>
 <h3 className="font-heading text-[12px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Patient Profile</h3>
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
 <div className="md:col-span-3 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Salutation</label>
 <select name="salutation" value={formData.salutation} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 outline-none pr-8">
 <option value="Herr">Herr</option>
 <option value="Frau">Frau</option>
 <option value="Divers">Divers</option>
 </select>
 </div>
 <div className="md:col-span-4 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">First Name *</label>
 <input required name="first_name" value={formData.first_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="md:col-span-5 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Last Name *</label>
 <input required name="last_name" value={formData.last_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
 Date of Birth *
 {formData.is_minor && (
 <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
 Minor (Under 18)
 </span>
 )}
 </label>
 <input required type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Gender *</label>
 <select required name="gender" value={formData.gender} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none pr-8">
 <option value="M">Männlich</option>
 <option value="W">Weiblich</option>
 <option value="D">Divers</option>
 </select>
 </div>
 </div>
 </div>

 {formData.is_minor && (
 <div className="mt-6">
 <h3 className="font-heading text-[12px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Guardian Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
 <div className="md:col-span-3 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Guardian Salutation</label>
 <select name="guardian_salutation" value={formData.guardian_salutation} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 outline-none pr-8">
 <option value="Herr">Herr</option>
 <option value="Frau">Frau</option>
 <option value="Divers">Divers</option>
 </select>
 </div>
 <div className="md:col-span-4 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">First Name</label>
 <input name="guardian_first_name" value={formData.guardian_first_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="md:col-span-5 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Last Name</label>
 <input name="guardian_last_name" value={formData.guardian_last_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 </div>
 </div>
 )}
 </div>

 {/* TAB: CONTACT */}
 <div className={activeTab === 'contact' ? 'block' : 'hidden'}>
 <div>
 <h3 className="font-heading text-[12px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Contact Profile</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Email</label>
 <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Phone</label>
 <PhoneInput
 prefix={phonePrefix}
 onPrefixChange={(val) => setPhonePrefix(val)}
 value={phoneSystem}
 onChange={(val) => setPhoneSystem(val)}
 />
 </div>

 <div className="md:col-span-2 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Address Line 1</label>
 <input name="address_line1" value={formData.address_line1} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Address Line 2 (Optional)</label>
 <input name="address_line2" value={formData.address_line2} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>

 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">ZIP / Postal Code</label>
 <input name="address_zip" value={formData.address_zip} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">City</label>
 <input name="address_city" value={formData.address_city} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>

 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">State / Province</label>
 <input name="address_state" value={formData.address_state} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Country</label>
 <SearchableSelect
 value={formData.address_country}
 onChange={(val) => setFormData(p => ({ ...p, address_country: val }))}
 options={COUNTRIES.map(c => ({ id: c.code, name: c.name, description: c.flag }))}
 placeholder="Select Country..."
 />
 </div>
 </div>
 </div>
 </div>

 {/* TAB: MEDICAL */}
 <div className={activeTab === 'medical' ? 'block' : 'hidden'}>
 <div>
 <h3 className="font-heading text-[12px] font-medium text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">Medical Record Integration</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Insurance Status</label>
 <select name="insured_status" value={formData.insured_status} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none pr-8">
 <option value="gesetzlich">Gesetzlich versichert</option>
 <option value="privat_versichert">Privat versichert</option>
 <option value="selbstzahler">Selbstzahler (Oder IGeL)</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Family Doctor</label>
 <input name="family_doctor" value={formData.family_doctor} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none" placeholder="Primary Care Physician Name" />
 </div>
 <div className="md:col-span-2 space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Internal Observations</label>
 <textarea name="observations" value={formData.observations} onChange={handleChange} className="w-full px-4 py-3 text-[14px] rounded-[10px] border border-gray-200 focus:border-primary outline-none min-h-[100px] resize-y" placeholder="Private internal notes (will not be shared externally)..." />
 </div>
 </div>
 </div>
 </div>
 </form>
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 sticky bottom-0 z-20 rounded-b-[20px]">
 <button
 type="button"
 onClick={onClose}
 disabled={isSubmitting}
 className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-gray-500 hover:text-near-black hover:bg-gray-100 transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 form="patient-form"
 disabled={isSubmitting}
 className="px-6 py-2.5 rounded-full text-[13px] font-semibold text-white bg-primary hover:bg-primary-dark transition-colors disabled:opacity-50"
 >
 {isSubmitting ? 'Saving...' : patient ? 'Save Changes' : 'Register Patient'}
 </button>
 </div>
 </div>
 </div>,
 document.body
 );
}
