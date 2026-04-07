"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Toast } from '@/components/shared/Toast';
import { ChevronLeft, ArrowLeft, Loader2, Edit2, Trash2, Send, Mail, CheckCircle2, Check, Copy, MessageCircle, Link2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

export default function RecommendationDetail({ params }: { params: { id: string } }) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 useEffect(() => {
 const toast = searchParams.get('toast');
 if (toast) {
 setToastMessage(toast);
 window.history.replaceState({}, '', window.location.pathname);
 }
 }, [searchParams]);

 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 
 const [isDeleting, setIsDeleting] = useState(false);
 const [isSending, setIsSending] = useState(false);
 const [copied, setCopied] = useState(false);
 const [deleteModal, setDeleteModal] = useState(false);

 const handleCopy = (link: string) => {
 navigator.clipboard.writeText(link);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

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
    try {
      const res = await fetch(`/api/doctor/recommendations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/dashboard/recommendations?toast=Recommendation deleted');
    } catch (err: any) {
      alert(err.message);
    }
  };

 const handleSend = async () => {
    try {
      const res = await fetch(`/api/doctor/recommendations/${params.id}/send`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      // Update local state
      setData((prev: any) => ({ ...prev, status: 'sent', magic_link: result.magic_link }));
      setToastMessage('Notification resent to patient');
    } catch (err: any) {
      alert(err.message);
    }
  };

 if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
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

 const status = data.status === 'created' ? 'draft' : data.status;
 const canEdit = ['draft', 'sent'].includes(status);
 const canDelete = ['draft', 'sent'].includes(status);
 const canResend = status === 'sent';

 return (
 <div className="max-w-4xl mx-auto space-y-6 pb-20 font-body">
 {toastMessage && (
 <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
 )}
 
 {/* Header and Actions */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
 <div className="flex items-center gap-4">
 <button onClick={() => router.back()} className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors">
  <ArrowLeft className="w-4 h-4" />
 </button>
 <div>
 <div className="flex items-center gap-3">
 <h1 className="font-heading text-[24px] font-medium text-near-black">Recommendation <span className="font-mono text-gray-400 text-[20px]">{data.display_id}</span></h1>
 <StatusBadge status={data.status} />
 </div>
 <p className="text-[13px] text-gray-500 mt-1">Created on {new Date(data.created_at).toLocaleDateString()}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
    {canEdit && (
      <button
        onClick={() => router.push(`/dashboard/recommendations/${params.id}/edit`)}
        className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-gray-200 bg-white text-[#6E7280] px-4 py-2 text-[13px] font-semibold hover:border-gray-300 hover:text-[#1A1D23] transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
    )}

    {canDelete && (
      <button
        onClick={() => setDeleteModal(true)}
        className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-red-100 bg-white text-red-500 px-4 py-2 text-[13px] font-semibold hover:bg-red-50 hover:border-red-200 transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    )}

    {canResend && (
      <button
        onClick={handleSend}
        className="inline-flex items-center gap-1.5 rounded-full bg-[#008085] text-white px-4 py-2 text-[13px] font-semibold hover:bg-[#005C5F] transition-colors"
      >
        <Mail className="w-3.5 h-3.5" />
        Resend Notification
      </button>
    )}

    {!canEdit && !canDelete && !canResend && (
      <span className="text-[13px] text-[#6E7280] italic">No actions available</span>
    )}
  </div>
 </div>

 {/* Status Timeline */}
 {/* Status Timeline */}
 <div className="mb-8 pt-4 pb-8 overflow-x-auto hide-scrollbar px-8 sm:px-12">
 {data.status === 'cancelled' ? (
  <div className="min-w-[600px] relative flex items-center justify-between">
   <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
   {['Draft', 'Sent', 'Paid', 'Shipped', 'Collecting', 'At Lab', 'Results'].map((label, i) => (
    <div key={label} className="relative z-10 flex flex-col items-center">
     <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[11px] font-bold z-10">
      {i + 1}
     </div>
     <span className="absolute top-8 left-1/2 -translate-x-1/2 text-xs text-center w-24 text-gray-400 font-medium">
      {label}
     </span>
    </div>
   ))}
  </div>
 ) : (
 <div className="min-w-[600px] relative flex items-center justify-between">
 
 {/* Gray Future Line */}
 <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
 
 {/* Teal Completed Line */}
 <div 
 className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-colors duration-500 ease-in-out" 
 style={{
 width: `${(() => {
 const isBankTransfer = data.order?.[0]?.payment_method === 'bank_transfer' || data.order?.payment_method === 'bank_transfer';
 const statusMapping: Record<string, number> = {
 created: 0, sent: 1, 
 awaiting_payment: 2,
 paid: isBankTransfer ? 3 : 2, 
 preparing: isBankTransfer ? 4 : 3, kit_shipped: isBankTransfer ? 4 : 3, 
 collection_organized: isBankTransfer ? 5 : 4, awaiting_collection: isBankTransfer ? 5 : 4, 
 returning_to_lab: isBankTransfer ? 6 : 5, at_lab: isBankTransfer ? 6 : 5, 
 results_ready: isBankTransfer ? 7 : 6, completed: isBankTransfer ? 7 : 6
 };
 const currentIdx = statusMapping[data.status] ?? 0;
 return (currentIdx / (isBankTransfer ? 7 : 6)) * 100;
 })()}%`
 }}
 ></div>

 {(() => {
 const isBankTransfer = data.order?.[0]?.payment_method === 'bank_transfer' || data.order?.payment_method === 'bank_transfer';
 const baseSteps = [
 { id: 'created', label: 'Draft' },
 { id: 'sent', label: 'Sent' }
 ];
 if (isBankTransfer || data.status === 'awaiting_payment') {
 baseSteps.push({ id: 'awaiting_payment', label: 'Awaiting Payment' });
 }
 baseSteps.push(
 { id: 'paid', label: 'Paid' },
 { id: 'shipped', label: 'Shipped' },
 { id: 'collecting', label: 'Collecting' },
 { id: 'at_lab', label: 'At Lab' },
 { id: 'results_ready', label: 'Results' }
 );

 const statusMapping: Record<string, number> = {
 created: 0, sent: 1, 
 awaiting_payment: 2,
 paid: baseSteps.findIndex(s => s.id === 'paid'), 
 preparing: baseSteps.findIndex(s => s.id === 'shipped'), kit_shipped: baseSteps.findIndex(s => s.id === 'shipped'), 
 collection_organized: baseSteps.findIndex(s => s.id === 'collecting'), awaiting_collection: baseSteps.findIndex(s => s.id === 'collecting'), 
 returning_to_lab: baseSteps.findIndex(s => s.id === 'at_lab'), at_lab: baseSteps.findIndex(s => s.id === 'at_lab'), 
 results_ready: baseSteps.findIndex(s => s.id === 'results_ready'), completed: baseSteps.findIndex(s => s.id === 'results_ready')
 };

 return baseSteps.map((step, idx) => {
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
 });
 })()}
 </div>
 )}
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

 {/* Patient Link Section */}
 {data.billing_mode !== 'doctor' && data.magic_link && (
 <div className="mb-6 flex items-center gap-3 bg-gray-50 rounded-[12px] px-4 py-3 border border-gray-100 shadow-sm w-full">
 <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
 <span className="text-[13px] text-gray-600 font-mono truncate flex-1 pt-0.5">
 {(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)}/patient/{data.magic_link}
 </span>
 
 <div className="flex items-center gap-1 shrink-0 relative">
 {copied && (
 <div className="absolute right-full mr-2 bg-gray-800 text-white text-[11px] font-bold px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
 Copied!
 </div>
 )}
 <button 
 onClick={() => {
 const url = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/${data.magic_link}`;
 handleCopy(url);
 }} 
 className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors shrink-0"
 title="Copy patient link"
 >
 <Copy className="w-4 h-4" />
 </button>

 <a 
 href={`https://wa.me/?text=${encodeURIComponent(`Your lab test recommendation is ready. View and complete payment here: ${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)}/patient/${data.magic_link}`)}`}
 target="_blank"
 rel="noopener noreferrer"
 className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors shrink-0"
 title="Share via WhatsApp"
 >
 <MessageCircle className="w-4 h-4" />
 </a>

 <a 
 href={`mailto:?subject=${encodeURIComponent("Your Lab Test Recommendation")}&body=${encodeURIComponent(`Your lab test recommendation is ready. View and complete payment here: ${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin)}/patient/${data.magic_link}`)}`}
 className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-primary hover:bg-gray-100 transition-colors shrink-0"
 title="Share via Email"
 >
 <Mail className="w-4 h-4" />
 </a>
 </div>
 </div>
 )}

 {/* Dynamic Content */}
 <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8 space-y-10">
 
 {/* Tests Table */}
 <div className="mb-8">
  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#008085] mb-4">
    Selected Tests
  </p>

  <div className="space-y-2">
    {data.items?.map((item: any) => (
      <div
        key={item.id}
        className="bg-white border border-gray-200 border-l-[3px] border-l-[#008085] rounded-lg px-5 py-4 flex items-center justify-between"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#1A1D23]">{item.test?.name || item.name || 'Deleted Test'}</p>
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-[#E6F7F5] text-[#008085]">
              {item.test_type === 'profile' ? 'Profile' : 'Parameter'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-[#6E7280]">{item.test?.laboratory?.name || '—'}</p>
            {item.test?.sku && (
              <>
                <span className="text-xs text-gray-300">·</span>
                <p className="text-xs font-mono text-gray-400">{item.test.sku}</p>
              </>
            )}
          </div>
        </div>
        <p className="text-sm font-mono font-semibold text-[#1A1D23] ml-4">
          €{Number(item.unit_price || 0).toFixed(2)}
        </p>
      </div>
    ))}
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
 <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4">Collection & Delivery</h3>
 <div className="text-[13px] space-y-3 text-near-black flex-1">
 <div className="flex justify-between items-center"><span className="text-gray-500">Billing:</span> <span className={data.billing_mode === 'doctor' ? 'text-primary font-semibold' : 'font-medium'}>{data.billing_mode === 'doctor' ? 'Doctor pays (monthly invoice)' : 'Patient pays'}</span></div>
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

  <ConfirmModal
    open={deleteModal}
    onClose={() => setDeleteModal(false)}
    title="Delete Recommendation?"
    description="This recommendation will be cancelled and removed from your active list. This action cannot be undone."
    actions={[
      {
        label: 'Delete Recommendation',
        onClick: handleDelete,
        variant: 'danger',
      },
      {
        label: 'Cancel',
        onClick: () => setDeleteModal(false),
        variant: 'outline',
      },
    ]}
  />
 </div>
 );
}
