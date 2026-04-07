'use client';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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

export default function EditRecommendationWizard({ params }: { params: { id: string } }) {
 const router = useRouter();
 const recommendationId = params.id;

 const [currentStep, setCurrentStep] = useState(1);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

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
 const [showCancelModal, setShowCancelModal] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [saveError, setSaveError] = useState<string | null>(null);
 const [mounted, setMounted] = useState(false);
 
 useEffect(() => setMounted(true), []);

 // Load existing recommendation data
 useEffect(() => {
 async function loadRecommendation() {
 try {
 const res = await fetch(`/api/doctor/recommendations/${recommendationId}`);
 if (!res.ok) throw new Error('Failed to load recommendation');
 const data = await res.json();
 const rec = data.recommendation || data;

 // Pre-populate patient
 if (rec.patient) {
 setPatient(rec.patient);
 }

 // Pre-populate pricing tier
 if (rec.pricing_tier) {
 setPricingTier(rec.pricing_tier);
 }

 // Pre-populate cart from recommendation items
 if (rec.items && rec.items.length > 0) {
 const cartItems = rec.items.map((item: any) => {
 const test = item.test || {};
 return {
 test_id: item.test_id || test.id,
 id: test.id,
 name: test.name || item.name || '',
 sku: test.sku || '',
 unit_price: Number(item.unit_price) || 0,
 quantity: item.quantity || 1,
 type: test.type || 'parameter',
 laboratory_name: test.laboratory?.name || '',
 sample_shipping: test.sample_shipping || 'standard',
 category: test.category || '',
 };
 });
 setCart(cartItems);
 }

 // Pre-populate delivery info
 setDeliveryInfo({
 method: rec.collection_preference || '',
 results: rec.results_delivery || 'doctor_and_patient',
 expectedDate: rec.expected_appointment_date || '',
 anamnese: rec.anamnese_notes || '',
 internal: rec.internal_notes || ''
 });

 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 }
 loadRecommendation();
 }, [recommendationId]);

 const buildPayload = () => ({
 patient_id: patient?.id,
 items: cart.map((i: any) => ({ test_id: i.test_id, quantity: i.quantity })),
 pricing_tier: pricingTier,
 collection_preference: deliveryInfo.method,
 results_delivery: deliveryInfo.results,
 anamnese_notes: deliveryInfo.anamnese,
 internal_notes: deliveryInfo.internal,
 expected_appointment_date: deliveryInfo.expectedDate || null
 });

 const handleSaveDraft = async () => {
 setIsSaving(true);
 setSaveError(null);
 try {
 const res = await fetch(`/api/doctor/recommendations/${recommendationId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(buildPayload())
 });
 if (!res.ok) throw new Error('Failed to save');
 router.push('/dashboard/recommendations?toast=Draft saved successfully');
 } catch (err: any) {
 setSaveError(err.message || 'Failed to save');
 setIsSaving(false);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 setShowCancelModal(false);
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <LoadingSpinner size="lg" />
 </div>
 );
 }

 if (error) {
 return (
 <div className="min-h-screen bg-gray-50 flex items-center justify-center">
 <p className="text-red-500">{error}</p>
 </div>
 );
 }

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
 onClose={() => !isSaving && setShowCancelModal(false)}
 title="Discard Changes?"
 description="You have unsaved changes to this recommendation. Would you like to save or discard them?"
 actions={[
 {
 label: isSaving ? 'Saving...' : 'Save Changes',
 onClick: handleSaveDraft,
 variant: 'primary' as const
 },
 { label: 'Discard Changes', onClick: () => router.push('/dashboard/recommendations'), variant: 'outline' as const },
 { label: 'Continue Editing', onClick: () => setShowCancelModal(false), variant: 'outline' as const },
 ]}
 />

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 
 {saveError && (
 <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-[12px] text-[14px] text-red-600">
 {saveError}
 </div>
 )}

 <Stepper 
 steps={STEPS} 
 currentStep={currentStep} 
 bgClass="bg-gray-50" 
 onStepClick={(step) => {
 setCurrentStep(step);
 window.scrollTo({ top: 0, behavior: 'smooth' });
 }} 
 />

 <div className="mt-12">
 {currentStep === 1 && (
 <WizardStep1 
 patient={patient} 
 setPatient={setPatient} 
 setPricingTier={setPricingTier}
 onNext={() => setCurrentStep(2)} 
 urlPatientId={null} 
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
 setDeliveryInfo={setDeliveryInfo}
 />
 )}
 {currentStep === 3 && (
 <WizardStep3 
 deliveryInfo={deliveryInfo}
 setDeliveryInfo={setDeliveryInfo}
 onNext={() => setCurrentStep(4)}
 onBack={() => setCurrentStep(2)}
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
 editMode={true}
 recommendationId={recommendationId}
 />
 )}
 </div>
 </div>
 </div>
 );
}
