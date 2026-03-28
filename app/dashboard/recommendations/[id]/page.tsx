"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2, Edit2, Trash2, Send, Mail, CheckCircle2, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function RecommendationDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/doctor/recommendations/${params.id}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to fetch recommendation');
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this Draft?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/doctor/recommendations/${params.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      router.push('/dashboard/recommendations');
    } catch(err: any) {
      alert(err.message || 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSend = async () => {
    if (!confirm("Are you sure you want to officially send this Recommendation to the patient?")) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/doctor/recommendations/${params.id}/send`, { method: 'POST' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      // Update local state
      setData((prev: any) => ({ ...prev, status: 'sent' }));
      alert("Sent successfully!");
    } catch(err: any) {
      alert(err.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="max-w-7xl mx-auto py-12 text-red-500 bg-red-50 p-6 rounded-[16px] border border-red-100">{error || 'Recommendation not found'}</div>;

  const getTierLabel = (tier: string) => {
    switch(tier) {
      case 'insured': return 'Privately Insured';
      case 'uninsured': return 'Self-Payer / Statutory';
      case 'zone1': return 'Foreign (Zone 1)';
      default: return tier;
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-body">
      
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
         <div className="flex items-center gap-4">
           <Link href="/dashboard/recommendations" className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-near-black transition-colors shadow-sm shrink-0">
             <ChevronLeft className="w-5 h-5" />
           </Link>
           <div>
              <div className="flex items-center gap-3">
                 <h1 className="font-heading text-[24px] font-medium text-near-black">Recommendation <span className="font-mono text-gray-400 text-[20px]">{data.display_id}</span></h1>
                 <StatusBadge status={data.status} />
              </div>
              <p className="text-[13px] text-gray-500 mt-1">Created on {new Date(data.created_at).toLocaleDateString()}</p>
           </div>
         </div>
         <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            {data.status === 'created' && (
              <>
                 <Button variant="ghost" onClick={handleDelete} disabled={isDeleting} className="rounded-full px-5 h-10 text-[13px] text-red-500 hover:text-red-700 hover:bg-red-50 flex items-center gap-2">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                 </Button>
                 <Link href={`/dashboard/recommendations/new?patient_id=${data.patient_id}`}>
                   <Button variant="secondary" className="rounded-full px-5 h-10 text-[13px] flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Start Over
                   </Button>
                 </Link>
                 <Button variant="primary" onClick={handleSend} disabled={isSending} className="rounded-full px-6 h-10 text-[13px] shadow-sm flex items-center gap-2">
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to Patient
                 </Button>
              </>
            )}
            {data.status === 'sent' && (
              <Button variant="secondary" className="rounded-full px-6 h-10 text-[13px] flex items-center gap-2">
                 <Mail className="w-4 h-4" /> Resend Notification
              </Button>
            )}
            {data.status === 'paid' && (
              <Button variant="primary" disabled className="rounded-full px-6 h-10 text-[13px] flex items-center gap-2 opacity-50">
                 <CheckCircle2 className="w-4 h-4" /> View Order
              </Button>
            )}
         </div>
      </div>

      {/* Status Timeline */}
      {/* Status Timeline */}
      <div className="mb-8 pt-4 pb-8 overflow-x-auto hide-scrollbar px-8 sm:px-12">
        <div className="min-w-[600px] relative flex items-center justify-between">
           
           {/* Gray Future Line */}
           <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
           
           {/* Teal Completed Line */}
           <div 
             className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-500 ease-in-out" 
             style={{
               width: `${(() => {
                 const statusMapping: Record<string, number> = {
                   created: 0, sent: 1, paid: 2, preparing: 3, kit_shipped: 3, 
                   collection_organized: 4, awaiting_collection: 4, returning_to_lab: 5, 
                   at_lab: 5, results_ready: 6, completed: 6
                 };
                 const currentIdx = statusMapping[data.status] ?? 0;
                 return (currentIdx / 6) * 100;
               })()}%`
             }}
           ></div>

             {[
               { id: 'created', label: 'Draft' },
             { id: 'sent', label: 'Sent' },
             { id: 'paid', label: 'Paid' },
             { id: 'shipped', label: 'Shipped' },
             { id: 'collecting', label: 'Collecting' },
             { id: 'at_lab', label: 'At Lab' },
             { id: 'results_ready', label: 'Results' }
           ].map((step, idx) => {
             const statusMapping: Record<string, number> = {
               created: 0, sent: 1, paid: 2, preparing: 3, kit_shipped: 3, 
               collection_organized: 4, awaiting_collection: 4, returning_to_lab: 5, 
               at_lab: 5, results_ready: 6, completed: 6
             };
             const currentIdx = statusMapping[data.status] ?? 0;
             const isCompleted = currentIdx >= idx;
             const isCurrent = currentIdx === idx;
             
             return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors relative z-10 ${isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-white'}`}>
                     <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <span className={`absolute top-8 left-1/2 -translate-x-1/2 text-xs text-center w-24 ${isCurrent ? 'font-bold text-primary' : isCompleted ? 'font-medium text-gray-600' : 'text-gray-400 font-medium'}`}>
                    {step.label}
                  </span>
                </div>
             );
           })}
        </div>
      </div>

      {/* Patient Card */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-[20px] shadow-sm">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-[18px]">
             {data.patient?.first_name?.[0]}{data.patient?.last_name?.[0]}
           </div>
           <div>
              <div className="font-medium text-[18px] text-near-black">{data.patient?.first_name} {data.patient?.last_name}</div>
              <div className="text-[14px] text-gray-500 mt-0.5">
                 DOB: {data.patient?.date_of_birth ? new Date(data.patient.date_of_birth).toLocaleDateString() : 'N/A'} • {data.patient?.email || 'No email provided'}
              </div>
           </div>
         </div>
         <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end gap-2">
            <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-[12px] font-bold text-gray-600 shadow-sm">{getTierLabel(data.pricing_tier)}</span>
            <Link href={`/dashboard/patients/${data.patient_id}`} className="text-[13px] text-primary hover:underline font-medium">
               View Patient →
            </Link>
         </div>
      </div>

      {/* Dynamic Content */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 space-y-10">
        
        {/* Tests Table */}
        <div>
           <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Selected Tests</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px] border-collapse">
               <thead>
                 <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="pb-3 px-4">Test Name (SKU)</th>
                    <th className="pb-3 text-right">UNIT PRICE</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  {data.items?.map((item: any) => (
                    <tr key={item.id} className="text-gray-700 hover:bg-gray-50 transition-colors">
                       <td className="py-3 px-4">
                          <div className="font-semibold text-near-black">{item.test?.name || 'Deleted Test'}</div>
                          <div className="font-mono text-gray-400 text-[11px] mt-0.5">{item.test?.sku}</div>
                       </td>
                       <td className="py-3 text-right font-bold text-near-black">€{Number(item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 items-stretch">
           
           {/* Detailed Calc */}
           <div className="p-6 rounded-[16px] bg-gray-50/50 border border-gray-100 flex flex-col h-full">
              <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Pricing Breakdown</h3>
              <div className="space-y-3 font-mono text-[13px] text-gray-600 flex-1">
                 <div className="flex justify-between">
                   <span>Test costs:</span>
                   <span>€{Number(data.test_costs_total).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Service fee ({data.service_fee_pct || 15}%):</span>
                   <span>€{Number(data.service_fee).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between">
                   <span>Shipping:</span>
                   <span>€{Number(data.shipping_estimate).toFixed(2)}</span>
                 </div>
                 <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-800">
                   <span>Subtotal:</span>
                   <span>€{(Number(data.test_costs_total) + Number(data.service_fee) + Number(data.shipping_estimate)).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-gray-500 text-[12px]">
                   <span>VAT (19%):</span>
                   <span>€{Number(data.vat).toFixed(2)}</span>
                 </div>
                 <div className="border-t border-gray-300 mt-2 pt-3 flex justify-between font-bold text-[18px] text-primary">
                   <span>TOTAL:</span>
                   <span>€{Number(data.total_amount).toFixed(2)}</span>
                 </div>
              </div>
           </div>

           {/* Delivery Details */}
           <div className="flex flex-col gap-6">
              <div className="p-6 rounded-[16px] bg-gray-50/50 border border-gray-100 flex flex-col flex-1">
                 <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Collection Profile</h3>
                 <div className="text-[13px] space-y-3 text-near-black flex-1">
                    <div className="flex justify-between items-center"><span className="text-gray-500">Collection Method:</span> <span className="font-medium">{collectionLabels[data.collection_preference] || 'Not specified'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">Results Delivery:</span> <span className="font-medium">{deliveryLabels[data.results_delivery] || 'Not specified'}</span></div>
                    <div className="flex justify-between items-center"><span className="text-gray-500">Expected Blood Draw:</span> <span className="font-medium">{data.expected_appointment_date ? new Date(data.expected_appointment_date).toLocaleDateString() : 'TBD'}</span></div>
                 </div>
              </div>
              
              {(data.anamnese_notes || data.internal_notes) && (
                <div className="p-5 rounded-[16px] border border-gray-100 bg-orange-50/30">
                   <h3 className="text-[12px] font-bold text-orange-600/60 uppercase tracking-widest mb-3">Notes Attached</h3>
                   {data.anamnese_notes && (
                     <div className="mb-3">
                       <span className="font-semibold text-[13px] text-near-black block">Anamnese Form:</span>
                       <p className="text-[13px] text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{data.anamnese_notes}</p>
                     </div>
                   )}
                   {data.internal_notes && (
                     <div>
                       <span className="font-semibold text-[13px] text-near-black block">Internal Office:</span>
                       <p className="text-[13px] text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{data.internal_notes}</p>
                     </div>
                   )}
                </div>
              )}
           </div>

        </div>

      </div>

    </div>
  );
}
