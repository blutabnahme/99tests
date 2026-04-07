"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Building, User, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminNewCasePage() {
 const router = useRouter();
 
 // Data States
 const [hcs, setHcs] = useState<any[]>([]);
 const [materials, setMaterials] = useState<any[]>([]);
 const [patients, setPatients] = useState<any[]>([]);
 const [initialLoading, setInitialLoading] = useState(true);
 const [loadingPatients, setLoadingPatients] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [errorString, setErrorString] = useState("");

 // Form States
 const [hcId, setHcId] = useState("");
 const [hcSearch, setHcSearch] = useState("");
 const [showHcDropdown, setShowHcDropdown] = useState(false);
 const [patientMode, setPatientMode] = useState<'existing' | 'new'>('existing');
 const [patientId, setPatientId] = useState("");
 const [patientSearch, setPatientSearch] = useState("");
 const [showPatientDropdown, setShowPatientDropdown] = useState(false);
 
 // New Patient Form
 const [newPatient, setNewPatient] = useState({
 first_name: "", last_name: "", email: "", phone: "", date_of_birth: "",
 address_street: "", address_postal: "", address_city: ""
 });

 // Recommendation Details
 const [visitType, setVisitType] = useState('practice');
 const [urgencyLevel, setUrgencyLevel] = useState('normal');
 const [bcSelectionMode, setBcSelectionMode] = useState('clinic_shortlist');
 const [reason, setReason] = useState("");
 const [adminNotes, setAdminNotes] = useState("");
 const [selectedMaterials, setSelectedMaterials] = useState<{id: string, quantity: number}[]>([]);

 // Fetch initial HCs & Materials
 useEffect(() => {
 async function loadInitial() {
 try {
 setInitialLoading(true);
 const res = await fetch('/api/admin/recommendations/create');
 if (res.ok) {
 const data = await res.json();
 setHcs(data.hcs || []);
 setMaterials(data.materials || []);
 }
 } catch (err) {
 console.error(err);
 } finally {
 setInitialLoading(false);
 }
 }
 loadInitial();
 }, []);

 // Fetch Patients when Doctor changes
 useEffect(() => {
 if (!hcId) {
 setPatients([]);
 setPatientId("");
 return;
 }
 async function loadPatients() {
 try {
 setLoadingPatients(true);
 const res = await fetch(`/api/admin/recommendations/create?doctor_id=${hcId}`);
 if (res.ok) {
 const data = await res.json();
 setPatients(data.patients || []);
 setPatientId("");
 }
 } catch(e) {
 console.error(e);
 } finally {
 setLoadingPatients(false);
 }
 }
 loadPatients();
 }, [hcId]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorString("");
 
 // Validation
 if (!hcId) return setErrorString("Please select a Healthcare Company.");
 if (patientMode === 'existing' && !patientId) return setErrorString("Please select a patient.");
 if (patientMode === 'new') {
 if (!newPatient.first_name || !newPatient.last_name) return setErrorString("Patient First and Last names are required.");
 }
 if (!reason.trim()) return setErrorString("Reason for blood collection is required.");

 try {
 setSubmitting(true);
 const payload = {
 doctor_id: hcId,
 patient_id: patientMode === 'existing' ? patientId : 'new',
 new_patient: patientMode === 'new' ? newPatient : undefined,
 visit_type: visitType,
 urgency_level: urgencyLevel,
 bc_selection_mode: bcSelectionMode,
 reason,
 admin_notes: adminNotes,
 materials: selectedMaterials
 };

 const res = await fetch('/api/admin/recommendations/create', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });

 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed to create recommendation');
 
 router.push(`/admin/recommendations/${data.recommendationId}`);
 } catch(err: any) {
 setErrorString(err.message || 'Error communicating with server.');
 setSubmitting(false);
 }
 };

 const toggleMaterial = (id: string) => {
 setSelectedMaterials(prev => {
 const exists = prev.find(m => m.id === id);
 if (exists) return prev.filter(m => m.id !== id);
 return [...prev, { id, quantity: 1 }];
 });
 };

 const updateQuantity = (id: string, delta: number, e: React.MouseEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setSelectedMaterials(prev => prev.map(m => {
 if (m.id === id) {
 const newQ = m.quantity + delta;
 return { ...m, quantity: newQ < 1 ? 1 : newQ };
 }
 return m;
 }));
 };

 if (initialLoading) {
 return (
 <div className="flex flex-col items-center justify-center p-24 text-gray-500 font-body">
 <LoadingSpinner size="lg" />
 <p>Initializing Creation Wizard...</p>
 </div>
 );
 }

 const filteredHCs = hcs.filter(hc => 
 hc.name.toLowerCase().includes(hcSearch.toLowerCase()) || 
 (hc.type || '').toLowerCase().includes(hcSearch.toLowerCase())
 );

 const filteredPatients = patients.filter(p => {
 const searchLow = patientSearch.toLowerCase();
 const name = ((p.first_name || '') + ' ' + (p.last_name || '')).toLowerCase();
 return name.includes(searchLow) || (p.email || '').toLowerCase().includes(searchLow);
 });

 return (
 <div className="max-w-[800px] w-full mx-auto font-body">
 {/* Back Header */}
 <button 
 onClick={() => router.push('/admin/recommendations')}
 className="flex items-center text-[13px] text-gray-500 font-medium hover:text-near-black transition-colors mb-6"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to Recommendations
 </button>

 <div className="mb-8">
 <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight">New Recommendation</h1>
 <p className="text-[13px] sm:text-[15px] text-gray-500 mt-1">Create a recommendation on behalf of a Healthcare Company</p>
 </div>

 {errorString && (
 <div className="p-4 bg-red-50 text-red-700 rounded-xl text-[14px] flex items-center font-medium shadow-sm border border-red-100 mb-6">
 <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
 {errorString}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-6">
 
 {/* 1. Doctor Selection */}
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
 <h2 className="text-[16px] font-semibold text-near-black flex items-center mb-4">
 <Building className="w-4 h-4 text-primary mr-2" />
 Healthcare Company
 </h2>
 <div className="relative">
 <label className="block text-[13px] font-medium text-near-black mb-1.5 shadow-sm">Search Company *</label>
 <input 
 type="text"
 placeholder="Search by company name..."
 value={hcSearch}
 onFocus={() => setShowHcDropdown(true)}
 onBlur={() => setTimeout(() => setShowHcDropdown(false), 200)}
 onChange={(e) => {
 setHcSearch(e.target.value);
 if (hcId) setHcId("");
 }}
 className="w-full h-11 px-4 rounded-full border border-gray-200 bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 {(showHcDropdown && hcSearch.length >= 2) && (
 <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
 {filteredHCs.length > 0 ? (
 filteredHCs.map(hc => (
 <div 
 key={hc.id}
 onClick={() => {
 setHcId(hc.id);
 setHcSearch(`${hc.name} ${hc.type ? `(${hc.type})` : ''}`);
 setShowHcDropdown(false);
 }}
 className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
 >
 <div className="text-[14px] font-medium text-near-black">{hc.name}</div>
 <div className="text-[12px] text-gray-500 capitalize">{hc.type || 'Standard'} {hc.contact_email ? `· ${hc.contact_email.toLowerCase()}` : ''}</div>
 </div>
 ))
 ) : (
 <div className="px-4 py-3 text-[13px] text-gray-500 italic">No companies found matching '{hcSearch}'</div>
 )}
 </div>
 )}
 </div>
 </div>

 {/* 2. Patient Definition */}
 {hcId && (
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
 <h2 className="text-[16px] font-semibold text-near-black flex items-center mb-4">
 <User className="w-4 h-4 text-primary mr-2" />
 Patient
 </h2>
 
 <div className="flex items-center gap-4 mb-5 border-b border-gray-100 pb-5">
 <label className="flex items-center gap-2 text-[14px] cursor-pointer">
 <input 
 type="radio" 
 name="patientMode" 
 checked={patientMode === 'existing'} 
 onChange={() => setPatientMode('existing')}
 className="w-4 h-4 text-primary focus:ring-primary"
 />
 <span className="font-medium text-near-black">Use existing patient</span>
 </label>
 <label className="flex items-center gap-2 text-[14px] cursor-pointer">
 <input 
 type="radio" 
 name="patientMode" 
 checked={patientMode === 'new'} 
 onChange={() => setPatientMode('new')}
 className="w-4 h-4 text-primary focus:ring-primary"
 />
 <span className="font-medium text-near-black">Create new patient</span>
 </label>
 </div>

 {patientMode === 'existing' ? (
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5 flex justify-between items-center">
 Search Associated Patient *
 {loadingPatients && <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
 </label>
 <div className="relative">
 <input 
 type="text"
 placeholder="Search by patient name or email..."
 value={patientSearch}
 onFocus={() => setShowPatientDropdown(true)}
 onBlur={() => setTimeout(() => setShowPatientDropdown(false), 200)}
 onChange={(e) => {
 setPatientSearch(e.target.value);
 if (patientId) setPatientId("");
 }}
 className="w-full h-11 px-4 rounded-full border border-gray-200 bg-white text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 {(showPatientDropdown && patientSearch.length >= 2) && (
 <div className="absolute z-10 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
 {filteredPatients.length > 0 ? (
 filteredPatients.map(p => (
 <div 
 key={p.id}
 onClick={() => {
 setPatientId(p.id);
 setPatientSearch(`${p.first_name} ${p.last_name}`);
 setShowPatientDropdown(false);
 }}
 className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
 >
 <div className="text-[14px] font-medium text-near-black">{p.first_name} {p.last_name}</div>
 <div className="text-[12px] text-gray-500">{p.email || 'No email provided'} {p.date_of_birth ? `· DOB: ${new Date(p.date_of_birth).toLocaleDateString()}` : ''}</div>
 </div>
 ))
 ) : (
 <div className="px-4 py-3 text-[13px] text-gray-500 italic">No existing patients matching '{patientSearch}'</div>
 )}
 </div>
 )}
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">First Name *</label>
 <input 
 type="text" required
 value={newPatient.first_name}
 onChange={e => setNewPatient({...newPatient, first_name: e.target.value})}
 className="w-full h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Last Name *</label>
 <input 
 type="text" required
 value={newPatient.last_name}
 onChange={e => setNewPatient({...newPatient, last_name: e.target.value})}
 className="w-full h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Email</label>
 <input 
 type="email" 
 value={newPatient.email}
 onChange={e => setNewPatient({...newPatient, email: e.target.value})}
 className="w-full h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Phone</label>
 <input 
 type="tel" 
 value={newPatient.phone}
 onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
 className="w-full h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
 />
 </div>
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Date of Birth *</label>
 <input 
 type="date" required
 value={newPatient.date_of_birth}
 onChange={e => setNewPatient({...newPatient, date_of_birth: e.target.value})}
 className="w-full h-11 px-4 rounded-full border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 appearance-auto"
 />
 </div>
 </div>
 )}
 </div>
 )}

 {/* 3. Recommendation Specifics */}
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm space-y-6">
 <h2 className="text-[16px] font-semibold text-near-black flex items-center mb-1">
 <FileText className="w-4 h-4 text-primary mr-2" />
 Recommendation Details
 </h2>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
 {/* Visit Type */}
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-2">Visit Type *</label>
 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[14px] cursor-pointer">
 <input type="radio" value="practice" checked={visitType === 'practice'} onChange={e => setVisitType(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary" />
 <span className="font-medium text-near-black">Practice Visit</span>
 </label>
 <label className="flex items-center gap-2 text-[14px] cursor-pointer">
 <input type="radio" value="home_visit" checked={visitType === 'home_visit'} onChange={e => setVisitType(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary" />
 <span className="font-medium text-near-black">Home Visit</span>
 </label>
 </div>
 </div>
 
 {/* Urgency */}
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-2">Urgency Level *</label>
 <div className="space-y-2">
 {['normal', 'urgent', 'emergency'].map(l => (
 <label key={l} className="flex items-center gap-2 text-[14px] cursor-pointer">
 <input type="radio" value={l} checked={urgencyLevel === l} onChange={e => setUrgencyLevel(e.target.value)} className="w-4 h-4 text-primary focus:ring-primary" />
 <span className="font-medium text-near-black capitalize">{l}</span>
 </label>
 ))}
 </div>
 </div>
 </div>

 {/* Visit Address (Home Visit Only) */}
 {visitType === 'home_visit' && (
 <div className="pt-5 border-t border-gray-100">
 <h3 className="text-[13px] font-semibold text-near-black mb-3">Service Location Data</h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 <div className="sm:col-span-2">
 <label className="block text-[12px] font-medium text-gray-500 mb-1">Street Address</label>
 <input 
 type="text" required
 value={newPatient.address_street} onChange={e => setNewPatient({...newPatient, address_street: e.target.value})}
 className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-primary"
 placeholder="Street & House No."
 />
 </div>
 <div>
 <label className="block text-[12px] font-medium text-gray-500 mb-1">Postal Code</label>
 <input 
 type="text" required
 value={newPatient.address_postal} onChange={e => setNewPatient({...newPatient, address_postal: e.target.value})}
 className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-primary"
 placeholder="Postal code"
 />
 </div>
 <div>
 <label className="block text-[12px] font-medium text-gray-500 mb-1">City</label>
 <input 
 type="text" required
 value={newPatient.address_city} onChange={e => setNewPatient({...newPatient, address_city: e.target.value})}
 className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:border-primary"
 placeholder="City"
 />
 </div>
 </div>
 </div>
 )}

 {/* BC Selection Mode */}
 <div className="pt-4 border-t border-gray-100">
 <label className="block text-[13px] font-medium text-near-black mb-3">Collector Selection Mode *</label>
 <div className="space-y-2">
 {[
 { id: 'clinic_shortlist', title: 'Clinic Shortlist', desc: 'Doctor reviews and shortlists, patient picks from shortlist' },
 { id: 'clinic_approval', title: 'Clinic Approval', desc: "Doctor selects the BC directly, patient doesn't choose" },
 { id: 'patient_decides', title: 'Patient Decides', desc: 'Patient chooses from all applicants' }
 ].map(mode => (
 <label key={mode.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-red-50/30 transition-colors has-[:checked]:border-primary has-[:checked]:bg-red-50/20">
 <input type="radio" value={mode.id} checked={bcSelectionMode === mode.id} onChange={e => setBcSelectionMode(e.target.value)} className="mt-0.5 w-4 h-4 text-primary focus:ring-primary shrink-0" />
 <div>
 <div className="font-semibold text-[13px] text-near-black leading-tight border-b-0">{mode.title}</div>
 <div className="text-[12px] text-gray-500 mt-1">{mode.desc}</div>
 </div>
 </label>
 ))}
 </div>
 </div>

 {/* Reason */}
 <div className="pt-4 border-t border-gray-100">
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Reason for Blood Collection *</label>
 <textarea 
 required rows={3}
 value={reason} onChange={e => setReason(e.target.value)}
 placeholder="Diagnostic testing, routing panels, etc."
 className="w-full p-4 rounded-lg border border-gray-200 text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
 />
 </div>
 </div>

 {/* 4. Materials (Optional) */}
 <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
 <h2 className="text-[16px] font-semibold text-near-black flex items-center mb-4">
 Materials (Optional)
 </h2>
 
 <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50/30">
 {materials.length > 0 ? (
 materials.map(m => {
 const selected = selectedMaterials.find(sm => sm.id === m.id);
 const isChecked = !!selected;
 return (
 <label key={m.id} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-red-50/20 cursor-pointer transition-colors">
 <div className="flex items-center gap-3">
 <input 
 type="checkbox"
 checked={isChecked}
 onChange={() => toggleMaterial(m.id)}
 className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
 />
 <div className="text-[14px] text-near-black font-medium">{m.name}</div>
 {m.type && (
 <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{m.type}</span>
 )}
 </div>
 <div className="flex items-center">
 {isChecked && (
 <div className="flex items-center gap-1 mr-3">
 <button 
 type="button"
 onClick={(e) => updateQuantity(m.id, -1, e)}
 className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[14px]"
 >−</button>
 <div className="w-8 text-center text-[14px] font-medium">{selected.quantity}</div>
 <button 
 type="button"
 onClick={(e) => updateQuantity(m.id, 1, e)}
 className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 text-[14px]"
 >+</button>
 </div>
 )}
 <div className="text-[13px] font-mono text-gray-500">
 {m.unit_price ? `€${Number(m.unit_price).toFixed(2)}` : '€0.00'}
 </div>
 </div>
 </label>
 );
 })
 ) : (
 <div className="p-4 text-[13px] text-gray-500 italic text-center">No materials available</div>
 )}
 </div>
 <div className="text-[13px] text-gray-500 mt-2">
 {selectedMaterials.length} material{selectedMaterials.length !== 1 ? 's' : ''} selected 
 {selectedMaterials.length > 0 && ` (${selectedMaterials.reduce((acc, m) => acc + m.quantity, 0)} items total)`}
 </div>
 </div>

 {/* 5. Notes & Submit */}
 <div className="bg-white p-4 sm:p-6 border border-gray-200 rounded-lg shadow-sm space-y-5">
 <div>
 <label className="block text-[13px] font-medium text-near-black mb-1.5">Admin Notes (Hidden from participants)</label>
 <textarea 
 rows={2}
 value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
 placeholder="Internal platform notes..."
 className="w-full p-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none bg-white focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
 />
 </div>
 
 <div className="flex justify-end pt-2">
 <button 
 type="submit"
 disabled={submitting}
 className="w-full sm:w-auto bg-primary text-white px-8 h-10 rounded-full font-semibold text-[14px] hover:bg-primary-dark transition-colors shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] flex items-center justify-center disabled:opacity-50"
 >
 {submitting ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin mr-2" />
 Generating...
 </>
 ) : "Create Recommendation"}
 </button>
 </div>
 </div>

 </form>
 </div>
 );
}

// Cache invalidation trigger
