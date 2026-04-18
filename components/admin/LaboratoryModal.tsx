"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, ChevronRight, Loader2, Search, UserPlus, Trash2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LaboratoryModalProps {
 lab?: any;
 onClose: () => void;
 onSuccess: () => void;
}

export default function LaboratoryModal({ lab, onClose, onSuccess }: LaboratoryModalProps) {
 const isEditing = !!lab;
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 
 const [mounted, setMounted] = useState(false);
 useEffect(() => {
 setMounted(true);
 }, []);

 const [formData, setFormData] = useState({
 name: '',
 official_name: '',
 practice_name: '',
 slug: '',
 address_street: '',
 address_zip: '',
 address_city: '',
 address_country: 'D',
 contact_email: '',
 contact_phone: '',
 aisid: '',
 customer_number: ''
 });

 const [ldtEnabled, setLdtEnabled] = useState(false);
 const [ldtConfig, setLdtConfig] = useState({
 einsender_id: '',
 customer_number: '',
 charset: '4',
 version: 'LDT4.20',
 profile_category_label: '',
 filename_prefix: ''
 });

 const [padEnabled, setPadEnabled] = useState(false);
 const [padConfigStr, setPadConfigStr] = useState('{}');
 const [showLdt, setShowLdt] = useState(false);
 const [showPad, setShowPad] = useState(false);

 // Private lab
 const [isPrivate, setIsPrivate] = useState(false);
 const [linkedDoctors, setLinkedDoctors] = useState<any[]>([]);
 const [doctorSearch, setDoctorSearch] = useState('');
 const [doctorResults, setDoctorResults] = useState<any[]>([]);
 const [searchingDoctors, setSearchingDoctors] = useState(false);
 const [addingDoctor, setAddingDoctor] = useState(false);

 useEffect(() => {
 if (lab) {
 setFormData({
 name: lab.name || '',
 official_name: lab.official_name || '',
 practice_name: lab.practice_name || '',
 slug: lab.slug || '',
 address_street: lab.address_street || '',
 address_zip: lab.address_zip || '',
 address_city: lab.address_city || '',
 address_country: lab.address_country || 'D',
 contact_email: lab.contact_email || '',
 contact_phone: lab.contact_phone || '',
 aisid: lab.aisid || '',
 customer_number: lab.customer_number || ''
 });
 if (lab.ldt_config) {
 setLdtEnabled(lab.ldt_config.enabled === true);
 setLdtConfig({
 einsender_id: lab.ldt_config.einsender_id || '',
 customer_number: lab.ldt_config.customer_number || lab.customer_number || '',
 charset: lab.ldt_config.charset || '4',
 version: lab.ldt_config.version || 'LDT4.20',
 profile_category_label: lab.ldt_config.profile_category_label || '',
 filename_prefix: lab.ldt_config.filename_prefix || ''
 });
 }
 if (lab.pad_config) {
 setPadEnabled(lab.pad_config.enabled === true);
 const { enabled, ...rest } = lab.pad_config;
 setPadConfigStr(Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : '{}');
 }
 }
 }, [lab]);

 // Load is_private state
 useEffect(() => {
   if (lab) {
     setIsPrivate(lab.is_private === true);
   }
 }, [lab]);

 // Fetch linked doctors for private lab
 useEffect(() => {
   if (lab && isPrivate) {
     fetch(`/api/admin/laboratories/${lab.id}/doctors`)
       .then(r => r.json())
       .then(data => { if (Array.isArray(data)) setLinkedDoctors(data); })
       .catch(() => {});
   }
 }, [lab, isPrivate]);

 // Doctor search
 useEffect(() => {
   if (!doctorSearch || doctorSearch.length < 2) {
     setDoctorResults([]);
     return;
   }
   const timer = setTimeout(async () => {
     setSearchingDoctors(true);
     try {
       const res = await fetch(`/api/admin/users?type=doctors&search=${encodeURIComponent(doctorSearch)}&limit=5`);
       if (res.ok) {
         const data = await res.json();
         const doctors = Array.isArray(data) ? data : data.data || [];
         // Filter out already-linked doctors
         const linkedIds = new Set(linkedDoctors.map((ld: any) => ld.doctor_id));
         setDoctorResults(doctors.filter((d: any) => !linkedIds.has(d.id)));
       }
     } catch {}
     setSearchingDoctors(false);
   }, 300);
   return () => clearTimeout(timer);
 }, [doctorSearch, linkedDoctors]);

 const handleAddDoctor = async (doctorId: string) => {
   if (!lab) return;
   setAddingDoctor(true);
   try {
     const res = await fetch(`/api/admin/laboratories/${lab.id}/doctors`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ doctor_id: doctorId })
     });
     if (res.ok) {
       const newEntry = await res.json();
       setLinkedDoctors(prev => [newEntry, ...prev]);
       setDoctorSearch('');
       setDoctorResults([]);
     }
   } catch {}
   setAddingDoctor(false);
 };

 const handleRemoveDoctor = async (doctorId: string) => {
   if (!lab) return;
   try {
     await fetch(`/api/admin/laboratories/${lab.id}/doctors?doctor_id=${doctorId}`, { method: 'DELETE' });
     setLinkedDoctors(prev => prev.filter((d: any) => d.doctor_id !== doctorId));
   } catch {}
 };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
 };

 const handleLdtChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 setLdtConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');

 let parsedPad = {};
 try {
 if (padConfigStr.trim()) parsedPad = JSON.parse(padConfigStr);
 } catch(err) {
 setError("Invalid PAD Config JSON");
 setLoading(false);
 return;
 }

 const payload = {
 ...formData,
 is_private: isPrivate,
 ldt_config: { ...ldtConfig, enabled: ldtEnabled },
 pad_config: { ...parsedPad, enabled: padEnabled }
 };

 try {
 const url = isEditing ? `/api/admin/laboratories/${lab.id}` : `/api/admin/laboratories`;
 const method = isEditing ? 'PUT' : 'POST';
 
 const res = await fetch(url, {
 method,
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 
 if (!res.ok) {
 const data = await res.json();
 throw new Error(data.error || 'Failed to save laboratory');
 }
 
 onSuccess();
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 if (!mounted) return null;

 return createPortal(
 <div 
 className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
 style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
 onClick={onClose}
 >
 <div 
 className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4"
 onClick={(e) => e.stopPropagation()}
 >
 
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
 <h2 className="font-heading font-medium text-[20px] text-near-black">
 {isEditing ? 'Edit Laboratory' : 'Add Laboratory'}
 </h2>
 <button 
 onClick={onClose}
 className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Body */}
 <div className="p-6 overflow-y-auto flex-1 font-body">
 {error && (
 <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
 {error}
 </div>
 )}
 
 <form id="lab-form" onSubmit={handleSubmit} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Name *</label>
 <input required name="name" value={formData.name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" placeholder="e.g. MVZ Labor München" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Official Name</label>
 <input name="official_name" value={formData.official_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Practice Name</label>
 <input name="practice_name" value={formData.practice_name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Slug</label>
 <input name="slug" value={formData.slug} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" placeholder="Auto-generated if empty" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Street</label>
 <input name="address_street" value={formData.address_street} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="grid grid-cols-3 gap-2">
 <div className="space-y-1.5 col-span-1">
 <label className="text-[13px] font-medium text-gray-700">ZIP</label>
 <input name="address_zip" value={formData.address_zip} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5 col-span-2">
 <label className="text-[13px] font-medium text-gray-700">City</label>
 <input name="address_city" value={formData.address_city} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Country Code</label>
 <input name="address_country" value={formData.address_country} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Contact Email</label>
 <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Contact Phone</label>
 <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">AISID</label>
 <input name="aisid" value={formData.aisid} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Customer Number</label>
 <input name="customer_number" value={formData.customer_number} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 </div>

 {/* Private Laboratory */}
 <div className="border border-gray-200 rounded-[12px] overflow-hidden">
 <div className="p-4 bg-gray-50/50 space-y-4">
 <label className="flex items-center gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={isPrivate}
 onChange={(e) => setIsPrivate(e.target.checked)}
 className="w-5 h-5 rounded border-gray-300 text-[#008085] focus:ring-[#008085]"
 />
 <div className="flex items-center gap-2">
 <Lock className="w-4 h-4 text-gray-500" />
 <div>
 <span className="text-[14px] font-medium text-near-black">Private Laboratory</span>
 <p className="text-[12px] text-gray-500">Only assigned doctors can see this lab's tests in their catalog</p>
 </div>
 </div>
 </label>

 {isPrivate && isEditing && (
 <div className="pt-3 border-t border-gray-200 space-y-3">
 {/* Doctor Search */}
 <div className="relative">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type="text"
 autoComplete="off"
 placeholder="Search doctors by name or email..."
 value={doctorSearch}
 onChange={(e) => setDoctorSearch(e.target.value)}
 className="w-full h-10 pl-10 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors placeholder:text-gray-400"
 />
 <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${searchingDoctors ? 'opacity-100' : 'opacity-0'}`}>
 <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
 </div>
 </div>

 {/* Search Results Dropdown */}
 {doctorResults.length > 0 && (
 <div className="bg-white border border-gray-200 rounded-[12px] shadow-sm overflow-hidden">
 {doctorResults.map((doc: any) => (
 <button
 key={doc.id}
 type="button"
 onClick={() => handleAddDoctor(doc.id)}
 disabled={addingDoctor}
 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
 >
 <UserPlus className="w-4 h-4 text-[#008085] shrink-0" />
 <div className="flex-1 min-w-0">
 <div className="text-[14px] font-medium text-near-black truncate">{doc.full_name || 'Unnamed'}</div>
 <div className="text-[12px] text-gray-500 truncate">{doc.email}{doc.practice_name ? ` · ${doc.practice_name}` : ''}</div>
 </div>
 </button>
 ))}
 </div>
 )}

 {/* Linked Doctors List */}
 <div className="space-y-1">
 <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">
 Authorized Doctors ({linkedDoctors.length})
 </label>
 {linkedDoctors.length === 0 ? (
 <p className="text-[13px] text-gray-400 py-2">No doctors assigned yet. Search above to add.</p>
 ) : (
 <div className="space-y-1">
 {linkedDoctors.map((entry: any) => (
 <div key={entry.id} className="flex items-center gap-3 px-3 py-2 rounded-[8px] bg-white border border-gray-100">
 <div className="flex-1 min-w-0">
 <div className="text-[13px] font-medium text-near-black truncate">{entry.doctor?.full_name || 'Unknown'}</div>
 <div className="text-[11px] text-gray-500 truncate">{entry.doctor?.email}{entry.doctor?.practice_name ? ` · ${entry.doctor.practice_name}` : ''}</div>
 </div>
 <button
 type="button"
 onClick={() => handleRemoveDoctor(entry.doctor_id)}
 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors shrink-0"
 title="Remove access"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* LDT Config */}
 <div className="border border-gray-200 rounded-[12px] overflow-hidden">
 <button type="button" onClick={() => setShowLdt(!showLdt)} className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left">
 <div className="flex items-center gap-3">
 <span className="font-medium text-[14px] text-near-black">LDT Configuration</span>
 {ldtEnabled && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Enabled</span>}
 </div>
 {showLdt ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
 </button>
 {showLdt && (
 <div className="p-4 border-t border-gray-200 space-y-4">
 <label className="flex items-center gap-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={ldtEnabled}
 onChange={(e) => setLdtEnabled(e.target.checked)}
 className="w-5 h-5 rounded border-gray-300 text-[#008085] focus:ring-[#008085]"
 />
 <div>
 <span className="text-[14px] font-medium text-near-black">Enable LDT Export</span>
 <p className="text-[12px] text-gray-500">This laboratory will appear in LDT export options</p>
 </div>
 </label>
 {ldtEnabled && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Einsender ID</label>
 <input name="einsender_id" value={ldtConfig.einsender_id} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Customer Number (FK 8312)</label>
 <input name="customer_number" value={ldtConfig.customer_number} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" placeholder="e.g. 25997" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Charset</label>
 <select name="charset" value={ldtConfig.charset} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white appearance-none pr-10 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-no-repeat bg-[position:right_12px_center]">
 <option value="1">1 (ISO-8859-1)</option>
 <option value="2">2 (CP850)</option>
 <option value="4">4 (ISO-8859-15)</option>
 <option value="X">X (UTF-8)</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Version</label>
 <input name="version" value={ldtConfig.version} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Profile Category Label</label>
 <input name="profile_category_label" value={ldtConfig.profile_category_label} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 <div className="space-y-1.5">
 <label className="text-[13px] font-medium text-gray-700">Filename Prefix</label>
 <input name="filename_prefix" value={ldtConfig.filename_prefix} onChange={handleLdtChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400" />
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {/* PAD Config */}
 <div className="border border-gray-200 rounded-[12px] overflow-hidden">
 <button type="button" onClick={() => setShowPad(!showPad)} className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100/50 transition-colors text-left">
 <div className="flex items-center gap-3">
 <span className="font-medium text-[14px] text-near-black">PAD Configuration</span>
 {padEnabled && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Enabled</span>}
 </div>
 {showPad ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
 </button>
 {showPad && (
 <div className="p-4 border-t border-gray-200">
 <label className="flex items-center gap-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
 <input
 type="checkbox"
 checked={padEnabled}
 onChange={(e) => setPadEnabled(e.target.checked)}
 className="w-5 h-5 rounded border-gray-300 text-[#008085] focus:ring-[#008085]"
 />
 <div>
 <span className="text-[14px] font-medium text-near-black">Enable PAD Export</span>
 <p className="text-[12px] text-gray-500">This laboratory will appear in PAD XML export options</p>
 </div>
 </label>
 </div>
 )}
 </div>

 </form>
 </div>

 {/* Footer */}
 <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3">
 <Button variant="secondary" onClick={onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
 Cancel
 </Button>
 <Button variant="primary" type="submit" form="lab-form" className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Laboratory'}
 </Button>
 </div>

 </div>
 </div>,
 document.body
 );
}
