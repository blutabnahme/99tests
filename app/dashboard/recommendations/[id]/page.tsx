"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Toast } from '@/components/shared/Toast';
import { ChevronLeft, ArrowLeft, Loader2, Edit2, Trash2, Send, Mail, CheckCircle2, Check, Copy, MessageCircle, Link2, Pencil, Download, FileText, Package, Truck, ArrowRight, ExternalLink, Share2, ChevronDown, FlaskConical, Building2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { formatDate } from '@/lib/format-date';

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

 const [orderResults, setOrderResults] = useState<any[]>([]);
 const [resultsLoading, setResultsLoading] = useState(false);
 const [activeTab, setActiveTab] = useState<'overview' | 'shipping' | 'results'>('overview');
 const [showShareMenu, setShowShareMenu] = useState(false);
 
 const [isDeleting, setIsDeleting] = useState(false);
 const [isSending, setIsSending] = useState(false);
 const [copied, setCopied] = useState(false);
 const [deleteModal, setDeleteModal] = useState(false);

 useEffect(() => {
   const handleClickOutside = () => setShowShareMenu(false);
   if (showShareMenu) {
     document.addEventListener('click', handleClickOutside);
     return () => document.removeEventListener('click', handleClickOutside);
   }
 }, [showShareMenu]);

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

 useEffect(() => {
   const orderId = data?.order?.id || data?.order?.[0]?.id;
   if (!orderId) return;

   const fetchResults = async () => {
     setResultsLoading(true);
     try {
       const res = await fetch('/api/doctor/results');
       if (res.ok) {
         const json = await res.json();
         // Filter to only results for this order
         const filtered = (json.results || []).filter((r: any) => r.order_id === orderId);
         setOrderResults(filtered);
       }
     } catch {}
     finally { setResultsLoading(false); }
   };
   fetchResults();
 }, [data]);

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
<div className="max-w-5xl mx-auto space-y-6 pb-20 font-body">
  {toastMessage && (
    <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
  )}

  {/* Back link */}
  <button onClick={() => router.back()} className="text-[13px] text-gray-400 hover:text-primary flex items-center gap-1 mb-2">
    <ChevronLeft className="w-3.5 h-3.5" />
    Back to Recommendations
  </button>

  {/* Title Row */}
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-[26px] font-medium text-near-black">
          Recommendation <span className="font-mono text-gray-400 text-[22px]">{data.display_id}</span>
        </h1>
        <StatusBadge status={data.status} />
      </div>
      <p className="text-[13px] text-gray-500 mt-1">
        Created {formatDate(data.created_at)}
        {data.order?.display_id && <span> · Order {data.order.display_id}</span>}
      </p>
    </div>

    {/* Action Buttons */}
    <div className="flex items-center gap-2 shrink-0">
      {/* Share Button (replaces magic link bar) */}
      {data.magic_link && data.billing_mode !== 'doctor' && (
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white text-gray-600 px-4 py-2 text-[13px] font-medium hover:border-gray-300 hover:text-near-black transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share with Patient
            <ChevronDown className={`w-3 h-3 transition-transform ${showShareMenu ? 'rotate-180' : ''}`} />
          </button>

          {showShareMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] border border-gray-200 shadow-lg p-1.5 z-50 min-w-[200px]">
              <button
                onClick={() => {
                  const url = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/${data.magic_link}`;
                  handleCopy(url);
                  setShowShareMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Your lab test recommendation is ready: ${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/${data.magic_link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowShareMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href={`mailto:${data.patient?.email || ''}?subject=${encodeURIComponent("Your Lab Test Recommendation")}&body=${encodeURIComponent(`Your lab test recommendation is ready: ${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/patient/${data.magic_link}`)}`}
                onClick={() => setShowShareMenu(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-50 rounded-[8px] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            </div>
          )}
        </div>
      )}

      {canResend && (
        <button
          onClick={handleSend}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#008085] text-white px-4 py-2 text-[13px] font-medium hover:bg-[#005C5F] transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          Resend
        </button>
      )}

      {canEdit && (
        <button
          onClick={() => router.push(`/dashboard/recommendations/${params.id}/edit`)}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white text-gray-600 px-4 py-2 text-[13px] font-medium hover:border-gray-300 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      )}

      {canDelete && (
        <button
          onClick={() => setDeleteModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white text-red-500 px-4 py-2 text-[13px] font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      )}
    </div>
  </div>

  {/* Status Timeline */}
  <div className="pt-4 pb-12 overflow-x-auto hide-scrollbar px-8 sm:px-12">
 {data.status === 'cancelled' ? (
  <div className="min-w-[600px] relative flex items-center justify-between">
   <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
   {['Draft', 'Sent', 'Paid', 'Shipped', 'At Lab', 'Results'].map((label, i) => (
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
 { id: 'at_lab', label: 'At Lab' },
 { id: 'results_ready', label: 'Results' }
 );

 const statusMapping: Record<string, number> = {
 created: 0, sent: 1, 
 awaiting_payment: 2,
 paid: baseSteps.findIndex(s => s.id === 'paid'), 
 preparing: baseSteps.findIndex(s => s.id === 'shipped'), kit_shipped: baseSteps.findIndex(s => s.id === 'shipped'), 
 collection_organized: baseSteps.findIndex(s => s.id === 'shipped'), awaiting_collection: baseSteps.findIndex(s => s.id === 'shipped'), 
 returning_to_lab: baseSteps.findIndex(s => s.id === 'at_lab'), at_lab: baseSteps.findIndex(s => s.id === 'at_lab'), 
 results_ready: baseSteps.findIndex(s => s.id === 'results_ready'), completed: baseSteps.findIndex(s => s.id === 'results_ready')
 };
 const currentIdx = statusMapping[data.status] ?? 0;
 return (currentIdx / (baseSteps.length - 1)) * 100;
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
 { id: 'at_lab', label: 'At Lab' },
 { id: 'results_ready', label: 'Results' }
 );

 const statusMapping: Record<string, number> = {
 created: 0, sent: 1, 
 awaiting_payment: 2,
 paid: baseSteps.findIndex(s => s.id === 'paid'), 
 preparing: baseSteps.findIndex(s => s.id === 'shipped'), kit_shipped: baseSteps.findIndex(s => s.id === 'shipped'), 
 collection_organized: baseSteps.findIndex(s => s.id === 'shipped'), awaiting_collection: baseSteps.findIndex(s => s.id === 'shipped'), 
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

  {/* Stakeholder Cards */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Patient Card */}
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
          <span className="text-[16px] font-heading font-medium">
            {(data.patient?.first_name?.[0] || '').toUpperCase()}{(data.patient?.last_name?.[0] || '').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Patient</div>
          <div className="text-[16px] font-heading font-medium text-near-black mt-0.5">
            {data.patient?.first_name} {data.patient?.last_name}
          </div>
          <div className="text-[13px] text-gray-500 mt-1 space-y-0.5">
            <div>{data.patient?.email || 'No email'}</div>
            {data.patient?.phone && <div>{data.patient.phone}</div>}
            <div>DOB: {data.patient?.date_of_birth ? formatDate(data.patient.date_of_birth) : 'N/A'}</div>
          </div>
        </div>
        <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
          {getTierLabel(data.pricing_tier)}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <div className="text-[12px] text-gray-400">Payment</div>
          <div className="text-[13px] font-medium text-near-black">
            {data.billing_mode === 'doctor' ? 'Doctor Invoice' : 'Patient Pays'}
          </div>
        </div>
        <div className="text-[20px] font-heading font-medium text-primary">
          €{Number(data.total_amount || 0).toFixed(2)}
        </div>
      </div>
    </div>

    {/* Collection & Delivery Card */}
    <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Collection & Delivery</div>
      <div className="text-[13px] space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Collection</span>
          <span className="font-medium text-near-black">{collectionLabels[data.collection_preference] || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Results Delivery</span>
          <span className="font-medium text-near-black">{deliveryLabels[data.results_delivery] || 'Not specified'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Expected Blood Draw</span>
          <span className="font-medium text-near-black">{data.expected_appointment_date ? formatDate(data.expected_appointment_date) : 'TBD'}</span>
        </div>
      </div>
      {data.order?.status && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-gray-400">Order Status</div>
            <StatusBadge status={data.order.status} />
          </div>
          <Link href={`/dashboard/patients/${data.patient_id}`} className="text-[13px] text-primary hover:underline font-medium">
            View Patient →
          </Link>
        </div>
      )}
    </div>
  </div>

  {/* Tab Bar */}
  <div className="flex border-b border-gray-200 mb-6">
    {[
      { key: 'overview', label: 'Overview' },
      { key: 'shipping', label: 'Shipping' },
      { key: 'results', label: 'Results' },
    ].map(tab => (
      <button
        key={tab.key}
        onClick={() => setActiveTab(tab.key as any)}
        className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
          activeTab === tab.key
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500 hover:text-near-black'
        }`}
      >
        {tab.label}
        {tab.key === 'results' && orderResults.length > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-emerald-100 text-emerald-600 rounded-full px-1">
            {orderResults.length}
          </span>
        )}
      </button>
    ))}
  </div>

  {/* Tab Content */}
  <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
    <div className="p-6">

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Selected Tests */}
          <div>
            <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Selected Tests</h3>
            <div className="space-y-2">
              {data.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-b-0">
                  <div>
                    <div className="text-[14px] font-medium text-near-black flex items-center gap-2">
                      {item.test?.name || item.name || 'Deleted Test'}
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#008085]/10 text-[#008085]">
                        {item.test_type === 'profile' ? 'Profile' : 'Parameter'}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-400 mt-0.5">
                      {item.test?.laboratory?.name || '—'}
                      {item.test?.sku && <span> · <span className="font-mono">{item.test.sku}</span></span>}
                    </div>
                  </div>
                  <span className="font-mono text-[14px] font-medium text-near-black">
                    €{Number(item.unit_price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Pricing</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Test costs</span>
                <span className="font-mono text-near-black">€{Number(data.test_costs_total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Service fee ({data.service_fee_pct || 15}%)</span>
                <span className="font-mono text-near-black">€{Number(data.service_fee || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-500">Shipping</span>
                <span className="font-mono text-near-black">€{Number(data.shipping_estimate || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 mt-2">
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-mono text-near-black">€{(Number(data.test_costs_total || 0) + Number(data.service_fee || 0) + Number(data.shipping_estimate || 0)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[13px] mt-1">
                  <span className="text-gray-500">VAT (19%)</span>
                  <span className="font-mono text-near-black">€{Number(data.vat || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-medium text-near-black">Total</span>
                  <span className="text-[18px] font-heading font-medium text-primary">€{Number(data.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(data.anamnese_notes || data.internal_notes) && (
            <div className="pt-4 border-t border-gray-100">
              <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Notes</h3>
              {data.anamnese_notes && (
                <div className="mb-3">
                  <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-1">Anamnese</div>
                  <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-[8px] p-3">{data.anamnese_notes}</p>
                </div>
              )}
              {data.internal_notes && (
                <div>
                  <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-1">Internal</div>
                  <p className="text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-[8px] p-3">{data.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shipping' && (
        <div className="space-y-4">
          <div className="mb-4">
            <h3 className="font-heading font-medium text-[15px] text-near-black">Shipment Tracking</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">Track kit delivery and sample return for this order</p>
          </div>

          {(() => {
            const shipments = data?.order?.shipments || [];
            const originalShipments = shipments.filter((s: any) => !s.resend_id);
            const resendShipments = shipments.filter((s: any) => s.resend_id);

            if (shipments.length === 0) {
              return (
                <div className="py-10 text-center">
                  <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No shipments yet</p>
                  <p className="text-[12px] text-gray-300 mt-1">Shipments will appear once the order is prepared and shipped</p>
                </div>
              );
            }

            const renderShipmentBlock = (shipment: any, isResend = false) => (
              <div key={shipment.id} className={`rounded-[12px] border overflow-hidden ${isResend ? 'border-amber-200' : 'border-gray-200'}`}>
                {/* Lab Header */}
                <div className={`px-5 py-3 flex items-center gap-3 ${isResend ? 'bg-amber-50/50' : 'bg-gray-50/50'}`}>
                  <Building2 className={`w-4 h-4 ${isResend ? 'text-amber-500' : 'text-gray-400'}`} />
                  <span className="text-[14px] font-medium text-near-black">
                    {shipment.laboratory?.name || 'Unknown Lab'}
                  </span>
                  {shipment.laboratory?.address_city && (
                    <span className="text-[12px] text-gray-400">{shipment.laboratory.address_city}</span>
                  )}
                  {isResend && (
                    <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 ml-auto">
                      Replacement
                    </span>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outbound: Kit to Patient */}
                  <div className="bg-gray-50 rounded-[12px] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[13px] font-heading font-medium text-near-black">Kit Delivery</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-auto">DHL</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        shipment.outbound_status === 'delivered' ? 'bg-emerald-500' :
                        shipment.outbound_status === 'shipped' ? 'bg-[#008085]' :
                        'bg-gray-300'
                      }`} />
                      <span className="text-[14px] text-gray-700">
                        {shipment.outbound_status === 'pending' ? 'Being prepared' :
                         shipment.outbound_status === 'label_created' ? 'Label created, shipping soon' :
                         shipment.outbound_status === 'shipped' ? 'On its way to patient' :
                         shipment.outbound_status === 'delivered' ? 'Delivered ✓' :
                         shipment.outbound_status || 'Pending'}
                      </span>
                    </div>
                    {shipment.outbound_tracking_number && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400">Tracking:</span>
                        <span className="font-mono text-gray-600">{shipment.outbound_tracking_number}</span>
                        <a href={`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${shipment.outbound_tracking_number}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#008085] font-medium flex items-center gap-1 ml-auto">
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {shipment.created_at && (
                      <div className="text-[11px] text-gray-400 mt-2">Created {formatDate(shipment.created_at)}</div>
                    )}
                  </div>

                  {/* Return: Sample to Lab */}
                  <div className="bg-gray-50 rounded-[12px] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowLeft className="w-3.5 h-3.5 text-[#008085]" />
                      <span className="text-[13px] font-heading font-medium text-near-black">Sample Return</span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ml-auto">
                        {shipment.shipping_method === 'gologistik' ? 'GoLogistik' : 'DHL'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        shipment.status === 'delivered' ? 'bg-emerald-500' :
                        ['in_transit', 'patient_sent', 'collected', 'scheduled'].includes(shipment.status) ? 'bg-[#008085]' :
                        'bg-gray-300'
                      }`} />
                      <span className="text-[14px] text-gray-700">
                        {shipment.status === 'pending' ? 'Return label being prepared' :
                         shipment.status === 'label_created' ? 'Ready to send — return label in kit' :
                         shipment.status === 'patient_sent' ? 'Patient sent sample' :
                         shipment.status === 'in_transit' ? 'On its way to lab' :
                         shipment.status === 'delivered' ? 'Received by lab ✓' :
                         shipment.status === 'awaiting_schedule' ? 'Awaiting pickup schedule' :
                         shipment.status === 'scheduled' ? `Pickup scheduled${shipment.gologistik_pickup_date ? ` — ${formatDate(shipment.gologistik_pickup_date)}` : ''}` :
                         shipment.status === 'collected' ? 'Sample collected' :
                         shipment.status || 'Pending'}
                      </span>
                    </div>
                    {shipment.tracking_number && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-[12px]">
                        <span className="text-gray-400">Tracking:</span>
                        <span className="font-mono text-gray-600">{shipment.tracking_number}</span>
                        <a href={`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${shipment.tracking_number}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[#008085] font-medium flex items-center gap-1 ml-auto">
                          Track <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {shipment.gologistik_hwb && (
                      <div className="text-[12px] text-gray-500 mt-2">HWB: {shipment.gologistik_hwb}</div>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <>
                {/* Original Shipments */}
                {originalShipments.map((s: any) => renderShipmentBlock(s, false))}

                {/* Resend Shipments */}
                {resendShipments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] font-medium text-amber-600 uppercase tracking-wider">Replacement Shipments</span>
                    </div>
                    {resendShipments.map((s: any) => renderShipmentBlock(s, true))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-heading font-medium text-[15px] text-near-black">Lab Results</h3>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {orderResults.length > 0
                  ? `${orderResults.length} result${orderResults.length !== 1 ? 's' : ''} uploaded`
                  : 'Results will appear here once uploaded by the admin'}
              </p>
            </div>
          </div>

          {orderResults.length > 0 && data.items && (
            <div className="bg-gray-50 rounded-[12px] p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#008085] rounded-full transition-all"
                    style={{
                      width: `${(() => {
                        const coveredNames = new Set<string>();
                        orderResults.forEach((r: any) => {
                          (r.tests_covered || []).forEach((t: any) => {
                            const name = (t.test_name || t.name || '').toLowerCase();
                            if (name) coveredNames.add(name);
                          });
                        });
                        const total = data.items?.length || 1;
                        const covered = (data.items || []).filter((item: any) =>
                          coveredNames.has((item.test?.name || item.name || '').toLowerCase())
                        ).length;
                        return (covered / total) * 100;
                      })()}%`
                    }}
                  />
                </div>
                <span className="text-[13px] font-medium text-gray-600 shrink-0">
                  {(() => {
                    const coveredNames = new Set<string>();
                    orderResults.forEach((r: any) => {
                      (r.tests_covered || []).forEach((t: any) => {
                        const name = (t.test_name || t.name || '').toLowerCase();
                        if (name) coveredNames.add(name);
                      });
                    });
                    const total = data.items?.length || 0;
                    const covered = (data.items || []).filter((item: any) =>
                      coveredNames.has((item.test?.name || item.name || '').toLowerCase())
                    ).length;
                    return `${covered}/${total}`;
                  })()}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(data.items || []).map((item: any) => {
                  const testName = item.test?.name || item.name || 'Unknown';
                  const coveredNames = new Set<string>();
                  orderResults.forEach((r: any) => {
                    (r.tests_covered || []).forEach((t: any) => {
                      const name = (t.test_name || t.name || '').toLowerCase();
                      if (name) coveredNames.add(name);
                    });
                  });
                  const hasCoverage = coveredNames.has(testName.toLowerCase());
                  return (
                    <span
                      key={item.id}
                      className={`text-[12px] px-2.5 py-1 rounded-full ${
                        hasCoverage
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                    >
                      {hasCoverage && <span className="mr-1">✓</span>}
                      {testName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {resultsLoading ? (
            <div className="py-8 flex justify-center"><LoadingSpinner size="lg" /></div>
          ) : orderResults.length > 0 ? (
            <div className="space-y-3">
              {orderResults.map((result: any) => (
                <div key={result.id} className="flex items-center gap-4 p-4 bg-white rounded-[12px] border border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-near-black">
                        {(result.tests_covered || []).map((t: any) => t.test_name || t.name).join(', ') || result.file_name}
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        result.status === 'released' ? 'bg-green-50 text-green-700' :
                        result.status === 'doctor_reviewing' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {result.status === 'released' ? 'Released' :
                         result.status === 'doctor_reviewing' ? 'Pending Review' :
                         'Uploaded'}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-400 mt-0.5">
                      {result.laboratory?.name || ''} · {formatDate(result.created_at)}
                    </div>
                    {result.doctor_notes && (
                      <div className="text-[12px] text-blue-500 mt-1">Your note: {result.doctor_notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                    {/* Add Notes */}
                    <button
                      onClick={() => {
                        const notes = prompt('Add notes for the patient:', result.doctor_notes || '');
                        if (notes !== null) {
                          fetch(`/api/doctor/results/${result.id}/notes`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notes }),
                          }).then(() => {
                            setOrderResults(prev => prev.map(r =>
                              r.id === result.id ? { ...r, doctor_notes: notes } : r
                            ));
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 text-[12px] font-medium transition-colors"
                    >
                      {result.doctor_notes ? 'Edit Note' : 'Add Note'}
                    </button>

                    {/* Download */}
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/doctor/results/${result.id}/download`);
                          if (res.ok) {
                            const json = await res.json();
                            window.open(json.url, '_blank');
                          }
                        } catch (err: any) {
                          alert('Download error: ' + err.message);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[12px] font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3 h-3" />
                      View PDF
                    </button>

                    {/* Release (only for doctor_reviewing) */}
                    {result.status === 'doctor_reviewing' && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/doctor/results/${result.id}/release`, { method: 'PATCH' });
                            if (res.ok) {
                              setOrderResults(prev => prev.map(r =>
                                r.id === result.id ? { ...r, status: 'released', released_at: new Date().toISOString() } : r
                              ));
                            }
                          } catch {}
                        }}
                        className="px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 text-[12px] font-medium transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Release
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <FlaskConical className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[14px] text-gray-400">No results uploaded yet</p>
              <p className="text-[12px] text-gray-300 mt-1">Results will appear here once uploaded by the admin</p>
            </div>
          )}
        </div>
      )}

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
