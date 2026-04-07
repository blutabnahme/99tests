"use client";

import { User, Home, Building, Clock, ChevronRight, ChevronLeft, CreditCard, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const COLLECTION_METHODS = [
 { id: 'self', label: 'Patient organizes collection themselves', icon: User, note: 'Patient will receive documents to take to their own phlebotomist.' },
 { id: 'home_visit', label: 'Home visit via 99Tests', icon: Home, note: 'Blood collection at patient\'s address via Hematch network.' },
 { id: 'practice', label: 'Collection at a nearby practice', icon: Building, note: 'Patient visits a practice for blood draw.' },
 { id: 'undecided', label: 'Not yet decided', icon: Clock, note: 'Patient will decide later via the app.' }
];

const RESULTS_DELIVERY = [
 { id: 'doctor_and_patient', label: 'Send to doctor AND patient (Recommended)' },
 { id: 'doctor_only', label: 'Send to doctor only' },
 { id: 'patient_only', label: 'Send to patient only' }
];

export default function WizardStep3({ deliveryInfo, setDeliveryInfo, onNext, onBack, billingMode, setBillingMode, doctorBillingFeePct }: any) {
 
 const updateField = (field: string, value: any) => {
 setDeliveryInfo((prev: any) => ({ ...prev, [field]: value }));
 };

 const isFormValid = deliveryInfo.method && deliveryInfo.results;

 return (
 <div className="w-full max-w-4xl mx-auto font-body space-y-6">
 <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8">
 <h2 className="font-heading text-[24px] font-medium text-near-black mb-8">Collection & Delivery Options</h2>
 
 {/* Billing Mode */}
 <section className="mb-10">
 <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-4">Billing *</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <button
 onClick={() => setBillingMode('patient')}
 className={`flex items-start gap-4 p-5 rounded-[16px] border-2 text-left transition-colors duration-200
 ${billingMode === 'patient' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
 >
 <div className={`mt-0.5 p-2 rounded-full shrink-0 ${billingMode === 'patient' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
 <CreditCard className="w-5 h-5" />
 </div>
 <div>
 <div className={`font-semibold text-[15px] ${billingMode === 'patient' ? 'text-primary' : 'text-near-black'}`}>Patient pays</div>
 <div className="text-[13px] text-gray-500 mt-1 leading-snug">Patient receives a payment link and pays before the test kit is shipped.</div>
 </div>
 </button>
 <button
 onClick={() => setBillingMode('doctor')}
 className={`flex items-start gap-4 p-5 rounded-[16px] border-2 text-left transition-colors duration-200
 ${billingMode === 'doctor' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
 >
 <div className={`mt-0.5 p-2 rounded-full shrink-0 ${billingMode === 'doctor' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
 <Receipt className="w-5 h-5" />
 </div>
 <div>
 <div className={`font-semibold text-[15px] ${billingMode === 'doctor' ? 'text-primary' : 'text-near-black'}`}>Doctor pays (monthly invoice)</div>
 <div className="text-[13px] text-gray-500 mt-1 leading-snug">
 Billed to your practice at month-end. Patient takes no payment action.
 {doctorBillingFeePct != null && (
 <span className="block mt-1 font-medium text-primary">Service fee: {doctorBillingFeePct}%</span>
 )}
 </div>
 </div>
 </button>
 </div>
 </section>

 {/* Collection Method */}
 <section className="mb-10">
 <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-4">Blood Collection Method *</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {COLLECTION_METHODS.map(m => {
 const Icon = m.icon;
 const isActive = deliveryInfo.method === m.id;
 return (
 <button
 key={m.id}
 onClick={() => updateField('method', m.id)}
 className={`flex items-start gap-4 p-5 rounded-[16px] border-2 text-left transition-colors duration-200
 ${isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
 >
 <div className={`mt-0.5 p-2 rounded-full shrink-0 ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
 <Icon className="w-5 h-5" />
 </div>
 <div>
 <div className={`font-semibold text-[15px] ${isActive ? 'text-primary' : 'text-near-black'}`}>{m.label}</div>
 <div className="text-[13px] text-gray-500 mt-1 leading-snug">{m.note}</div>
 </div>
 </button>
 );
 })}
 </div>
 </section>

 {/* Results Delivery */}
 <section className="mb-10">
 <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-4">Results Delivery *</h3>
 <div className="flex flex-col gap-3">
 {RESULTS_DELIVERY.map(r => (
 <label key={r.id} className={`flex items-center gap-3 p-4 rounded-[12px] border cursor-pointer transition-colors ${deliveryInfo.results === r.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}>
 <input 
 type="radio" 
 name="results" 
 value={r.id}
 checked={deliveryInfo.results === r.id}
 onChange={() => updateField('results', r.id)}
 className="w-4 h-4 text-primary focus:ring-primary accent-primary"
 />
 <span className={`font-medium text-[14px] ${deliveryInfo.results === r.id ? 'text-primary' : 'text-near-black'}`}>{r.label}</span>
 </label>
 ))}
 </div>
 </section>

 {/* Expected Appointment Date */}
 <section className="mb-10">
 <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-4">Expected Appointment Date</h3>
 <p className="text-[13px] text-gray-500 mb-3">When is the expected blood draw? Must be at least 7 days from today to allow kit preparation and shipping.</p>
 <input 
 type="date" 
 min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
 value={deliveryInfo.expectedDate || ''}
 onChange={(e) => updateField('expectedDate', e.target.value)}
 className="w-full md:w-1/2 h-12 px-4 border border-gray-200 rounded-[12px] text-[14px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
 />
 </section>

 {/* Text Areas */}
 <section className="mb-6">
 <div>
 <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-4">Internal Notes</h3>
 <textarea 
 value={deliveryInfo.internal}
 onChange={(e) => updateField('internal', e.target.value)}
 placeholder="Internal notes (only visible to you and 99Tests admin, not shared with patient or lab)..."
 className="w-full h-32 p-4 border border-gray-200 rounded-[12px] text-[14px] resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-gray-400 bg-gray-50"
 />
 </div>
 </section>

 </div>

 <div className="flex gap-3 mt-6">
 <button 
 onClick={() => { onBack(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
 className="flex-1 rounded-full border-[1.5px] border-gray-200 text-[#6E7280] py-3 px-7 text-[15px] font-semibold hover:border-gray-300 hover:text-[#1A1D23] transition-colors"
 >
 ← Back
 </button>
 <button 
 onClick={() => { onNext(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
 disabled={!isFormValid} 
 className="flex-1 rounded-full bg-[#008085] text-white py-3 px-7 text-[15px] font-semibold shadow-[0_4px_16px_rgba(0,128,133,0.25)] hover:bg-[#005C5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Review Details
 </button>
 </div>

 </div>
 );
}
