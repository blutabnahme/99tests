"use client";

import { useState } from 'react';
import { Edit2, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WizardStep4({ 
  patient, 
  pricingTier, 
  cart, 
  pricingPreview, 
  deliveryInfo, 
  onBack, 
  onEditPatient, 
  onEditTests, 
  router 
}: any) {

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildPayload = () => ({
    patient_id: patient.id,
    items: cart.map((i: any) => ({ test_id: i.test_id, quantity: i.quantity })),
    pricing_tier: pricingTier,
    collection_preference: deliveryInfo.method,
    results_delivery: deliveryInfo.results,
    anamnese_notes: deliveryInfo.anamnese,
    internal_notes: deliveryInfo.internal,
    expected_appointment_date: deliveryInfo.expectedDate || null
  });

  const getTierLabel = (tier: string) => {
    switch(tier) {
      case 'insured': return 'Privately Insured';
      case 'uninsured': return 'Self-Payer / Statutory';
      case 'zone1': return 'Foreign (Zone 1)';
      default: return 'Standard Tier';
    }
  };

  const collectionLabels: Record<string, string> = {
    'self': 'Patient organizes collection',
    'home_visit': 'Home visit via 99Tests',
    'practice': 'Collection at a nearby practice',
    'undecided': 'Not yet decided',
  };

  const deliveryLabels: Record<string, string> = {
    'doctor_and_patient': 'Doctor and Patient',
    'doctor_only': 'Doctor only',
    'patient_only': 'Patient only',
  };

  const handleSaveDraft = async () => {
    setIsDrafting(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to list
      router.push('/dashboard/recommendations');
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
      setIsDrafting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create mapping
      const res = await fetch('/api/doctor/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload())
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. Trigger send
      const sendRes = await fetch(`/api/doctor/recommendations/${data.id}/send`, {
        method: 'POST'
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData.error);

      // Redirect to detail page
      router.push(`/dashboard/recommendations/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit recommendation');
      setIsSubmitting(false);
    }
  };

  if (!pricingPreview) return null; // Safety net

  return (
    <div className="w-full max-w-4xl mx-auto font-body space-y-6">
      
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-[12px] text-[14px]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8">
        <h2 className="font-heading text-[24px] font-medium text-near-black mb-8">Review Recommendation</h2>

        {/* 1. Patient Summary */}
        <div className="mb-8 p-6 rounded-[16px] border border-gray-100 relative group">
           <button onClick={onEditPatient} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-full" title="Edit Patient">
              <Edit2 className="w-4 h-4" />
           </button>
           <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Patient Summary</h3>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-[18px]">
                {patient.first_name[0]}{patient.last_name[0]}
              </div>
              <div>
                 <div className="font-semibold text-[18px] text-near-black">{patient.first_name} {patient.last_name}</div>
                 <div className="text-[14px] text-gray-500 mt-0.5">DOB: {new Date(patient.date_of_birth).toLocaleDateString()} • {patient.email || 'No email'}</div>
                 <div className="mt-2 flex gap-2">
                   <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-gray-100 text-gray-600">
                     {patient.insured_status === 'privat_versichert' ? 'Privat' : 'Selbstzahler/Gesetzlich'}
                   </span>
                   <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-bold bg-teal-50 text-teal-600 border border-teal-100">
                     Pricing: {getTierLabel(pricingTier)}
                   </span>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Test List */}
        <div className="mb-8 p-6 rounded-[16px] border border-gray-100 relative">
           <button onClick={onEditTests} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-full" title="Edit Tests">
              <Edit2 className="w-4 h-4" />
           </button>
           <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Tests</h3>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px]">
               <thead>
                 <tr className="border-b border-gray-200 text-gray-500">
                    <th className="pb-3 font-medium">Test Name</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">SKU</th>
                    <th className="pb-3 text-right font-medium">Unit Price</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {cart.map((item: any) => (
                    <tr key={item.test_id} className="text-gray-700">
                       <td className="py-3 font-medium text-near-black">{item.name}</td>
                       <td className="py-3 font-mono text-[11px] text-gray-400 hidden sm:table-cell">{item.sku}</td>
                       <td className="py-3 text-right font-bold">€{item.unit_price.toFixed(2)}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* 3. Pricing & Delivery Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
           
           {/* Pricing Full Breakdown */}
           <div className="p-6 rounded-[16px] bg-gray-50 border border-gray-100">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Pricing Breakdown</h3>
              <div className="space-y-3 font-mono text-[13px] text-gray-600">
                 <div className="flex justify-between">
                   <span>Test costs ({cart.length} items):</span>
                   <span>€{pricingPreview.test_costs_total.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Service fee ({pricingPreview.service_fee_pct}%):</span>
                   <span>€{pricingPreview.service_fee.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Shipping ({pricingPreview.shipping_tier_applied}):</span>
                   <span>€{pricingPreview.shipping_estimate.toFixed(2)}</span>
                 </div>
                 <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-800">
                   <span>Subtotal:</span>
                   <span>€{(pricingPreview.test_costs_total + pricingPreview.service_fee + pricingPreview.shipping_estimate).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-gray-500 text-[12px]">
                   <span>VAT 19% (on {pricingPreview.service_fee_pct}% + ship):</span>
                   <span>€{pricingPreview.vat.toFixed(2)}</span>
                 </div>
                 <div className="border-t border-gray-300 mt-2 pt-3 flex justify-between font-bold text-[18px] text-primary">
                   <span>TOTAL:</span>
                   <span>€{pricingPreview.total.toFixed(2)}</span>
                 </div>
              </div>
           </div>

           {/* Generic Delivery & Notes */}
           <div className="space-y-6">
              <div className="p-6 rounded-[16px] border border-gray-100">
                 <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Collection & Delivery</h3>
                 <div className="text-[13px] space-y-2 text-gray-700">
                    <div><span className="font-semibold">Method:</span> <span className="capitalize">{collectionLabels[deliveryInfo.method] || 'Not specified'}</span></div>
                    <div><span className="font-semibold">Results:</span> <span className="capitalize">{deliveryLabels[deliveryInfo.results] || 'Not specified'}</span></div>
                    <div><span className="font-semibold">Expected:</span> {deliveryInfo.expectedDate ? new Date(deliveryInfo.expectedDate).toLocaleDateString() : 'Not specified'}</div>
                 </div>
              </div>
              
              {deliveryInfo.internal && (
                <div className="p-6 rounded-[16px] border border-gray-100">
                   <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Notes Attached</h3>
                   <div>
                     <span className="font-semibold text-[13px] text-gray-700 block">Internal:</span>
                     <p className="text-[13px] text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{deliveryInfo.internal}</p>
                   </div>
                </div>
              )}
           </div>

        </div>

      </div>

      <div className="flex justify-between items-center mt-4">
         <Button variant="secondary" onClick={onBack} disabled={isSubmitting || isDrafting} className="rounded-full px-8 h-12 text-[15px] font-semibold bg-white border border-gray-200 shadow-sm hover:bg-gray-50">
           Back
         </Button>
         <div className="flex gap-4">
            <Button 
               variant="ghost" 
               onClick={handleSaveDraft} 
               disabled={isSubmitting || isDrafting} 
               className="rounded-full px-6 h-12 text-[15px] font-semibold border border-gray-300 text-gray-600 hover:bg-white bg-white shadow-sm"
            >
               {isDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
            </Button>
            <Button 
               variant="primary" 
               onClick={handleSubmit} 
               disabled={isSubmitting || isDrafting} 
               className="rounded-full px-8 h-12 text-[15px] font-semibold flex items-center gap-2 shadow-md"
            >
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Submit Recommendation</>}
            </Button>
         </div>
      </div>

    </div>
  );
}
