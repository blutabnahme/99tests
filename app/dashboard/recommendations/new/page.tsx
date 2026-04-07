"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import WizardStep1 from '@/components/dashboard/wizard/WizardStep1';
import WizardStep2 from '@/components/dashboard/wizard/WizardStep2';
import WizardStep3 from '@/components/dashboard/wizard/WizardStep3';
import WizardStep4 from '@/components/dashboard/wizard/WizardStep4';
import { Stepper } from '@/components/shared/Stepper';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const STEPS = [
 { id: 1, label: 'Patient' },
 { id: 2, label: 'Tests' },
 { id: 3, label: 'Collection & Delivery' },
 { id: 4, label: 'Review & Submit' }
];

export default function NewRecommendationWizard() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const urlPatientId = searchParams.get('patient_id');

 const [currentStep, setCurrentStep] = useState(1);
 
 useEffect(() => {
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }, [currentStep]);

 const [patient, setPatient] = useState<any>(null);
 const [pricingTier, setPricingTier] = useState('');
 const [cart, setCart] = useState<any[]>([]);
 
 const [deliveryInfo, setDeliveryInfo] = useState({
 method: '',
 results: 'doctor_and_patient',
 expectedDate: '',
 anamnese: '',
 internal: ''
 });
 
 const [pricingPreview, setPricingPreview] = useState<any>(null);

 const [billingMode, setBillingMode] = useState<'patient' | 'doctor'>('patient');
 const [doctorBillingFeePct, setDoctorBillingFeePct] = useState<number | null>(null);

 useEffect(() => {
 async function fetchBillingFee() {
 try {
 const res = await fetch('/api/doctor/billing-fee');
 if (res.ok) {
 const data = await res.json();
 setDoctorBillingFeePct(data.fee_pct);
 }
 } catch (e) {}
 }
 fetchBillingFee();
 }, []);

 const [showCancelModal, setShowCancelModal] = useState(false);
 const [isDrafting, setIsDrafting] = useState(false);
 const [mounted, setMounted] = useState(false);
 
 useEffect(() => setMounted(true), []);

 const canSaveDraft = !!patient;

 const buildPayload = () => ({
 patient_id: patient?.id,
 items: cart.map((i: any) => ({ test_id: i.test_id, quantity: i.quantity })),
 pricing_tier: pricingTier,
 collection_preference: deliveryInfo.method,
 results_delivery: deliveryInfo.results,
 anamnese_notes: deliveryInfo.anamnese,
 internal_notes: deliveryInfo.internal,
 expected_appointment_date: deliveryInfo.expectedDate || null,
 billing_mode: billingMode
 });

 const handleSaveDraft = async () => {
 setIsDrafting(true);
 try {
 const res = await fetch('/api/doctor/recommendations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(buildPayload())
 });
 if (!res.ok) throw new Error('Failed to save draft');
 router.push('/dashboard/recommendations?toast=Draft saved successfully');
 } catch (err: any) {
 console.error(err);
 setIsDrafting(false);
 }
 };

 return (
 <div className="min-h-screen bg-gray-50 pb-20 relative">
 <header className="p-4 md:px-8 md:py-4 flex justify-center items-center bg-white border-b border-gray-100 z-[99] shadow-sm relative sticky top-0">
 <img src="/logo.svg" alt="99Tests" className="h-6 w-auto" />
 <div className="absolute right-4 md:right-8">
 <button 
 onClick={() => setShowCancelModal(true)} 
 className="text-[14px] font-semibold text-gray-400 hover:text-near-black transition-colors underline underline-offset-4 outline-none"
 >
 Cancel
 </button>
 </div>
 </header>

 <ConfirmModal
 open={mounted && showCancelModal}
 onClose={() => !isDrafting && setShowCancelModal(false)}
 title="Leave Recommendation?"
 description="You have unsaved changes. Would you like to save this recommendation as a draft or discard it?"
 actions={[
 ...(canSaveDraft ? [{
 label: isDrafting ? 'Saving...' : 'Save as Draft',
 onClick: handleSaveDraft,
 variant: 'outline' as const
 }] : []),
 { label: 'Discard', onClick: () => router.push('/dashboard/recommendations'), variant: 'outline' as const },
 { label: 'Continue Editing', onClick: () => setShowCancelModal(false), variant: 'primary' as const },
 ]}
 />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 
 {/* Stepper Header */}
 <Stepper 
 steps={STEPS} 
 currentStep={currentStep} 
 bgClass="bg-gray-50" 
 onStepClick={(step) => {
 setCurrentStep(step);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }} 
 />

 {/* Step Content */}
 <div className="mt-12">
 {currentStep === 1 && (
 <WizardStep1 
 patient={patient} 
 setPatient={setPatient} 
 setPricingTier={setPricingTier}
 onNext={() => setCurrentStep(2)} 
 urlPatientId={urlPatientId} 
 />
 )}
 {currentStep === 2 && (
 <WizardStep2 
 patient={patient}
 pricingTier={pricingTier}
 cart={cart}
 setCart={setCart}
 pricingPreview={pricingPreview}
 setPricingPreview={setPricingPreview}
 onNext={() => setCurrentStep(3)}
 onBack={() => setCurrentStep(1)}
 setDeliveryInfo={setDeliveryInfo} // Pass this to allow templates to pre-fill anamnese notes
 billingMode={billingMode}
 doctorBillingFeePct={doctorBillingFeePct}
 />
 )}
 {currentStep === 3 && (
 <WizardStep3 
 deliveryInfo={deliveryInfo}
 setDeliveryInfo={setDeliveryInfo}
 onNext={() => setCurrentStep(4)}
 onBack={() => setCurrentStep(2)}
 billingMode={billingMode}
 setBillingMode={setBillingMode}
 doctorBillingFeePct={doctorBillingFeePct}
 />
 )}
 {currentStep === 4 && (
 <WizardStep4 
 patient={patient}
 pricingTier={pricingTier}
 cart={cart}
 pricingPreview={pricingPreview}
 deliveryInfo={deliveryInfo}
 onBack={() => setCurrentStep(3)}
 onEditPatient={() => setCurrentStep(1)}
 onEditTests={() => setCurrentStep(2)}
 router={router}
 billingMode={billingMode}
 doctorBillingFeePct={doctorBillingFeePct}
 />
 )}
 </div>

 </div>
 </div>
 );
}
