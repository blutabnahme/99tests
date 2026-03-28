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
    expected_appointment_date: deliveryInfo.expectedDate || null
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
      router.push('/dashboard/recommendations');
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

      {mounted && showCancelModal && createPortal(
        <div 
           className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-near-black/40 backdrop-blur-sm"
           onClick={() => !isDrafting && setShowCancelModal(false)}
        >
           <div 
              className="bg-white rounded-[20px] w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
           >
              <div className="p-6">
                 <h2 className="text-[20px] font-heading font-medium text-near-black mb-2">Leave Recommendation?</h2>
                 <p className="text-[14px] text-gray-500 mb-6 leading-relaxed">
                    You have unsaved changes. Would you like to save this recommendation as a draft or discard it?
                 </p>
                 <div className="flex flex-col items-center gap-3">
                    {canSaveDraft && (
                       <Button 
                          variant="ghost" 
                          onClick={handleSaveDraft}
                          disabled={isDrafting}
                          className="w-full h-11 rounded-full border border-primary text-primary bg-transparent text-[14px] font-medium hover:bg-primary/5"
                       >
                          {isDrafting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Save as Draft'}
                       </Button>
                    )}
                    <Button 
                       variant="ghost" 
                       onClick={() => router.push('/dashboard/recommendations')}
                       disabled={isDrafting}
                       className="w-full h-11 rounded-full border border-gray-300 text-gray-700 bg-transparent text-[14px] font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                    >
                       Discard
                    </Button>
                    <Button 
                       variant="primary" 
                       onClick={() => setShowCancelModal(false)}
                       disabled={isDrafting}
                       className="w-full h-11 rounded-full text-[14px] font-medium shadow-sm transition-all"
                    >
                       Continue Editing
                    </Button>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stepper Header */}
        <div className="py-8 mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-200 z-0"></div>
            
            {STEPS.map((step, idx) => {
              const isCompleted = currentStep > step.id;
              const isActive = currentStep === step.id;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center bg-gray-50 px-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-[14px] transition-colors
                    ${isActive ? 'bg-primary text-white ring-4 ring-primary/20' : 
                      isCompleted ? 'bg-primary text-white' : 'bg-white border-2 border-gray-300 text-gray-400'}`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`mt-2 font-medium text-[13px] ${isActive || isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Active progress line connecting completed steps */}
          <div className="relative mt-[-44px] h-0.5 bg-transparent z-0 pointer-events-none">
             <div 
               className="h-full bg-primary transition-all duration-300"
               style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
             />
          </div>
        </div>

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
            />
          )}
        </div>

      </div>
    </div>
  );
}
