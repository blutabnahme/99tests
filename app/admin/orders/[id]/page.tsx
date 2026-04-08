"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle,
  Package, FileText, FileCode, Receipt, Truck,
  Download, RefreshCw, User, Users, Stethoscope, CreditCard, MapPin,
  ChevronDown, ChevronRight, Image as ImageIcon, Check, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TubeColorDot } from '@/components/admin/TubeColorDot';

import { formatDate } from '@/lib/format-date';

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = { doctor_invoice: 'Doctor Invoice', bank_transfer: 'Bank Transfer', bank: 'Bank Transfer', card: 'Credit Card', credit_card: 'Credit Card', sepa: 'SEPA', mock: 'Mock' };
  return map[method] || method || '-';
}

const PIPELINE_STEPS = [
  { key: 'materials', label: 'Materials', icon: Package, description: 'Kit contents calculated' },
  { key: 'anamnese_pdf', label: 'Anamnese PDF', icon: FileText, description: 'Lab order forms generated' },
  { key: 'ldt_file', label: 'LDT File', icon: FileCode, description: 'Lab transfer file generated' },
  { key: 'pad_pvs', label: 'PVS/PAD', icon: Receipt, description: 'Billing snapshot captured' },
  { key: 'dhl_label', label: 'DHL Label', icon: Truck, description: 'Shipping label created' },
];

const RESEND_REASONS = [
  { value: 'hemolyzed_sample', label: 'Hemolyzed sample' },
  { value: 'insufficient_volume', label: 'Insufficient volume' },
  { value: 'damaged_in_transit', label: 'Damaged in transit' },
  { value: 'lost_in_transit', label: 'Lost in transit' },
  { value: 'lab_processing_error', label: 'Lab processing error' },
  { value: 'expired_sample', label: 'Expired sample' },
  { value: 'contaminated_sample', label: 'Contaminated sample' },
  { value: 'wrong_material', label: 'Wrong material collected' },
  { value: 'patient_error', label: 'Patient error' },
  { value: 'other', label: 'Other' },
];

function StepStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'skipped': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default: return <Clock className="w-5 h-5 text-gray-300" />;
  }
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [rerunningPipeline, setRerunningPipeline] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'preparation' | 'files' | 'timeline'>('overview');
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendReason, setResendReason] = useState('');
  const [resendNotes, setResendNotes] = useState('');
  const [submittingResend, setSubmittingResend] = useState(false);
  const [resends, setResends] = useState<any[]>([]);

  const toggleStep = (key: string) => {
    setExpandedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchResends = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/resend`);
      const data = await res.json();
      setResends(data.data || []);
    } catch (err) {
      console.error('Failed to fetch resends:', err);
    }
  };

  useEffect(() => { 
    fetchOrder(); 
    fetchResends(); 
  }, [params.id]);

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    setShowConfirmModal(false);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/confirm-payment`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to confirm payment');
      }
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleRerunPipeline = async () => {
    if (!confirm('Re-run the preparation pipeline for this order? This will recalculate materials and regenerate all files.')) return;
    setRerunningPipeline(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/rerun-pipeline`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Pipeline failed');
      }
      await fetchOrder();
    } catch (err: any) {
      alert('Pipeline error: ' + err.message);
    } finally {
      setRerunningPipeline(false);
    }
  };

  const handleSubmitResend = async () => {
    if (!resendReason) return;
    setSubmittingResend(true);
    setShowResendModal(false);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: resendReason,
          notes: resendNotes,
          materials: order.materials || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create resend');
      await fetchOrder();
      await fetchResends();
      setResendReason('');
      setResendNotes('');
    } catch (err: any) {
      alert('Resend error: ' + err.message);
    } finally {
      setSubmittingResend(false);
    }
  };

  const handleMarkShipped = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'kit_shipped' }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error || !order) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/orders" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>
      <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">{error || 'Order not found'}</div>
    </div>
  );

  const prepStatus = order.preparation_status || {};
  
  const ORDER_STAGES = [
    { key: 'created', label: 'Recommended' },
    { key: 'awaiting_payment', label: 'Awaiting Payment' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'at_lab', label: 'At Lab' },
    { key: 'completed', label: 'Results' },
  ];

  const statusToStageIndex: Record<string, number> = {
    'created': 0,
    'awaiting_payment': 1,
    'preparing': 2,
    'kit_shipped': 3,
    'collection_organized': 4,
    'awaiting_collection': 4,
    'returning_to_lab': 4,
    'at_lab': 4,
    'results_ready': 5,
    'completed': 5,
    'cancelled': -1,
  };
  const activeStageIndex = statusToStageIndex[order.status?.toLowerCase()] ?? 0;

  const materialsByLab = new Map<string, any[]>();
  (order.calculated_materials || []).forEach((m: any) => {
    const labName = m.laboratory?.name || 'Unknown Lab';
    if (!materialsByLab.has(labName)) materialsByLab.set(labName, []);
    materialsByLab.get(labName)!.push(m);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-[13px] text-gray-400 hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-medium text-[24px] text-near-black">Order {order.display_id || order.id?.substring(0, 8)}</h1>
            <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary`}>
              {order.status?.replace(/_/g, ' ')}
            </span>
            {order.resend_count > 0 && (
              <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {order.resend_count} resend{order.resend_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-400 mt-1">
            Created {formatDate(order.created_at)}
            {order.recommendation?.display_id && (
              <> · Recommendation <Link href={`/admin/recommendations/${order.recommendation_id}`} className="text-primary hover:underline">{order.recommendation?.display_id || order.display_id}</Link></>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {order.status === 'preparing' && (
            <button
              onClick={handleMarkShipped}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Mark as Shipped
            </button>
          )}
          {['kit_shipped', 'collection_organized', 'awaiting_collection', 'returning_to_lab', 'at_lab', 'completed', 'results_ready'].includes(order.status) && (
            <button
              onClick={() => setShowResendModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium text-amber-600 border border-amber-200 rounded-full hover:bg-amber-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Request Resend
            </button>
          )}
          {order.status === 'awaiting_payment' && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={confirmingPayment}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {confirmingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirm Payment
            </button>
          )}
          <button
            onClick={handleRerunPipeline}
            disabled={rerunningPipeline}
            className="text-[13px] text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors disabled:opacity-50 border border-gray-200 rounded-full px-4 py-2 hover:border-primary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rerunningPipeline ? 'animate-spin' : ''}`} />
            Re-run Pipeline
          </button>
        </div>
      </div>

      {/* 2. Status Timeline */}
      <div className="mb-8 pt-4 pb-12 overflow-x-auto hide-scrollbar px-8 sm:px-12">
        <div className="min-w-[600px] relative flex items-center justify-between">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 z-0"></div>
          {/* Active progress line */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary z-0 transition-all duration-500"
            style={{
              width: activeStageIndex > 0
                ? `${(activeStageIndex / (ORDER_STAGES.length - 1)) * 100}%`
                : '0%'
            }}
          ></div>
          {/* Stage circles */}
          {ORDER_STAGES.map((stage, i) => {
            const isCompleted = i <= activeStageIndex;
            const isCurrent = i === activeStageIndex;
            return (
              <div key={stage.key} className="relative z-10 flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors relative z-10 ${
                  isCompleted ? 'bg-primary text-white' : 'bg-gray-200 text-white'
                }`}>
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
                <span className={`absolute top-8 left-1/2 -translate-x-1/2 text-xs text-center w-28 ${
                  isCurrent ? 'font-bold text-primary' : isCompleted ? 'font-medium text-gray-600' : 'text-gray-400 font-medium'
                }`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Stakeholder Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Patient Card */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-[16px] font-heading font-medium text-primary">
                {(order.patient?.first_name?.[0] || '').toUpperCase()}{(order.patient?.last_name?.[0] || '').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Patient</span>
              </div>
              <div className="text-[16px] font-medium text-near-black mt-0.5">
                {order.patient?.first_name} {order.patient?.last_name}
              </div>
              <div className="text-[13px] text-gray-500 mt-2 space-y-0.5">
                {order.patient?.email && <div>{order.patient.email}</div>}
                {order.patient?.phone && <div>{order.patient.phone}</div>}
                {order.patient?.date_of_birth && <div>DOB: {formatDate(order.patient.date_of_birth)}</div>}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-400">Payment</div>
              <div className="text-[13px] font-medium text-near-black mt-0.5">{formatPaymentMethod(order.payment_method)}</div>
            </div>
            <div className="text-right">
              <div className="text-[20px] font-heading font-medium text-primary">€{Number(order.total || 0).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Doctor Card */}
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <span className="text-[16px] font-heading font-medium text-gray-500">
                {(order.doctor?.first_name?.[0] || '').toUpperCase()}{(order.doctor?.last_name?.[0] || '').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Doctor</span>
              </div>
              <div className="text-[16px] font-medium text-near-black mt-0.5">
                {order.doctor?.full_name || 'Unknown Doctor'}
              </div>
              <div className="text-[13px] text-gray-500 mt-2 space-y-0.5">
                {order.doctor?.practice_name && <div>{order.doctor.practice_name}</div>}
                {order.doctor?.email && <div>{order.doctor.email}</div>}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-[12px] text-gray-400">Status</div>
              <div className="text-[13px] font-medium text-near-black mt-0.5 capitalize">{order.status?.replace(/_/g, ' ')}</div>
            </div>
            {order.payment_confirmed_at && (
              <div className="text-right">
                <div className="text-[12px] text-gray-400">Confirmed</div>
                <div className="text-[13px] text-gray-500">{formatDate(order.payment_confirmed_at)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabbed Content */}
      {/* Tab bar — standalone, no card */}
      <div className="flex border-b border-gray-200 mb-6">
        {[{ key: 'overview', label: 'Overview' }, { key: 'preparation', label: 'Preparation' }, { key: 'files', label: 'Files' }, { key: 'timeline', label: 'Timeline' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-near-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — in its own card */}
      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Ordered Tests</h3>
                <div className="space-y-0">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex items-start justify-between py-3 border-b border-gray-50 last:border-b-0">
                      <div>
                        <div className="text-[14px] font-medium text-near-black">{item.test?.name || item.name || '-'}</div>
                        <div className="text-[12px] text-gray-400 mt-0.5">
                          {item.test?.sku || ''} 
                          {item.test?.laboratory?.name && (
                            <span className="inline-flex items-center ml-1.5 px-2 py-0.5 rounded-full bg-primary/5 text-primary text-[11px] font-medium">
                              {item.test.laboratory.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[14px] font-mono text-near-black">€{Number(item.unit_price || 0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Pricing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Test costs</span>
                    <span className="font-mono text-near-black">€{Number(order.test_costs_total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Service fee ({order.service_fee_pct || 10}%)</span>
                    <span className="font-mono text-near-black">€{Number(order.service_fee_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-mono text-near-black">€{Number(order.shipping_cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-mono text-near-black">€{Number(order.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[13px] mt-1">
                      <span className="text-gray-500">VAT ({order.vat_rate || 19}%)</span>
                      <span className="font-mono text-near-black">€{Number(order.vat_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[14px] font-medium text-near-black">Total</span>
                      <span className="text-[18px] font-heading font-medium text-primary">€{Number(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preparation' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Pipeline */}
              <div className="lg:col-span-1">
                <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Pipeline</h3>
                <div className="space-y-2">
                  {PIPELINE_STEPS.map(step => {
                    const s = prepStatus[step.key];
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="rounded-[12px] border border-gray-200 overflow-hidden bg-white hover:border-primary hover:bg-primary/5 transition-colors">
                        <div onClick={() => toggleStep(step.key)} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                            <StepIcon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-medium text-near-black">{step.label}</span>
                              <StepStatusIcon status={s?.status || 'pending'} />
                            </div>
                            <p className="text-[12px] text-gray-400 truncate flex items-center gap-2">
                              <span>
                                {s?.status === 'completed' && s.completed_at ? `Completed ${formatDate(s.completed_at)}` 
                                : s?.status === 'failed' ? `Failed: ${s.error || 'Unknown error'}` 
                                : s?.status === 'skipped' ? `Skipped: ${s.note || ''}` 
                                : step.description}
                              </span>
                              {step.key === 'materials' && s?.material_count != null && <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">{s.material_count} material(s)</span>}
                              {step.key === 'anamnese_pdf' && s?.file_count != null && <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">{s.file_count} PDF(s)</span>}
                              {step.key === 'dhl_label' && s?.mock && <span className="text-[11px] text-amber-500 font-medium border-l border-gray-200 pl-2">Mock tracking</span>}
                            </p>
                          </div>
                          <div className="flex-shrink-0 ml-2">
                            {expandedSteps[step.key] ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                          </div>
                        </div>
                        {expandedSteps[step.key] && s && (
                          <div className="px-4 pb-3 border-t border-gray-200">
                            <div className="bg-gray-50 rounded-[8px] p-3 mt-2 font-mono text-[12px] text-gray-600 space-y-1.5">
                              {s.status && <div className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">status</span><span className={s.status === 'completed' ? 'text-green-600' : s.status === 'failed' ? 'text-red-500' : 'text-gray-500'}>{s.status}</span></div>}
                              {s.attempted_at && <div className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">attempted</span><span>{new Date(s.attempted_at).toLocaleString('de-DE')}</span></div>}
                              {s.completed_at && <div className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">completed</span><span>{new Date(s.completed_at).toLocaleString('de-DE')}</span></div>}
                              {s.error && <div className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">error</span><span className="text-red-500 text-right">{s.error}</span></div>}
                              {Object.entries(s).filter(([k]) => !['status', 'attempted_at', 'completed_at', 'error'].includes(k)).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-2">
                                  <span className="text-gray-400 flex-shrink-0">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-right break-all max-w-[70%]">{Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Packing List */}
              <div className="lg:col-span-1">
                {materialsByLab.size > 0 && (
                  <div>
                    <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Packing List</h3>
                    <div className="space-y-6">
                    {Array.from(materialsByLab.entries()).map(([labName, mats]) => (
                      <div key={labName}>
                        <h4 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{labName}</h4>
                        <div className="space-y-2">
                          {mats.map((m: any) => (
                            <div key={m.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-gray-50 border border-gray-100">
                              {m.material?.tube_color && <TubeColorDot color={m.material.tube_color} />}
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-medium text-near-black">{m.material?.name || 'Unknown Material'} <span className="text-[12px] text-gray-500 font-mono ml-2">({m.material?.code})</span></div>
                                {m.source_tests && Array.isArray(m.source_tests) && <div className="text-[11px] text-gray-400 mt-0.5 truncate">Tests: {m.source_tests.map((t: any) => t.test_name).join(', ')}</div>}
                              </div>
                              <div className="text-right shrink-0">
                                {m.measurement_type === 'volume' ? (
                                  <div>
                                    <div className="text-[14px] font-mono font-medium text-near-black">{m.calculated_tube_count != null ? `${m.calculated_tube_count} tube${m.calculated_tube_count !== 1 ? 's' : ''}` : '-'}</div>
                                    <div className="text-[11px] text-gray-400">{m.total_required_volume != null ? `${m.total_required_volume} ${m.volume_unit || 'ml'}` : ''} {m.tube_capacity != null ? ` / ${m.tube_capacity} ${m.volume_unit || 'ml'} cap.` : ''}</div>
                                  </div>
                                ) : (
                                  <div className="text-[14px] font-mono font-medium text-near-black">{m.total_quantity != null ? `×${m.total_quantity}` : '-'}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3">
              {/* Header with Download All */}
              {(order.anamnese_pdf_urls?.length > 0 || order.ldt_file_url || order.tif_file_url) && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-gray-400">
                    {[
                      order.anamnese_pdf_urls?.length || 0,
                      order.ldt_file_url ? 1 : 0,
                      order.tif_file_url ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)} file(s) generated
                  </span>
                  <button
                    onClick={() => {
                      // Open each file URL in sequence
                      const urls = [
                        ...(order.anamnese_pdf_urls || []).map((p: any) => p.url).filter(Boolean),
                        order.ldt_file_url,
                        order.tif_file_url,
                      ].filter(Boolean);
                      urls.forEach((url: string) => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.click();
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-primary border border-primary/30 rounded-full hover:bg-primary/5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download All
                  </button>
                </div>
              )}

              <h3 className="font-heading font-medium text-[15px] text-near-black mb-3">Generated Files</h3>

              {order.anamnese_pdf_urls?.map((pdf: any, i: number) => (
                <a
                  key={i}
                  href={pdf.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-near-black">Anamnese PDF</div>
                    <div className="text-[12px] text-gray-400 truncate">
                      {pdf.lab_name || 'Lab document'}
                      {prepStatus?.anamnese_pdf?.completed_at && (
                        <span className="ml-2">· Generated {new Date(prepStatus.anamnese_pdf.completed_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
              ))}

              {order.ldt_file_url && (
                <a
                  href={order.ldt_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileCode className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-near-black">LDT File</div>
                    <div className="text-[12px] text-gray-400 truncate">
                      Lab data transfer (ISO-8859-15)
                      {prepStatus?.ldt_file?.completed_at && (
                        <span className="ml-2">· Generated {new Date(prepStatus.ldt_file.completed_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
              )}

              {order.tif_file_url && (
                <a
                  href={order.tif_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-near-black">TIF Companion</div>
                    <div className="text-[12px] text-gray-400 truncate">
                      Lab companion document (1-bit TIFF, 300 DPI)
                      {prepStatus?.ldt_file?.completed_at && (
                        <span className="ml-2">· Generated {new Date(prepStatus.ldt_file.completed_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 shrink-0" />
                </a>
              )}

              {!order.anamnese_pdf_urls?.length && !order.ldt_file_url && !order.tif_file_url && (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No files generated yet</p>
                  <p className="text-[12px] text-gray-300 mt-1">Run the preparation pipeline to generate files</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-0">
              <h3 className="font-heading font-medium text-[15px] text-near-black mb-4">Activity</h3>
              {[
                order.created_at && { time: order.created_at, label: 'Order created', icon: 'create' },
                order.payment_confirmed_at && { time: order.payment_confirmed_at, label: 'Payment confirmed', icon: 'payment' },
                prepStatus?.materials?.completed_at && { time: prepStatus.materials.completed_at, label: 'Materials calculated', detail: `${prepStatus.materials.material_count || 0} material(s)`, icon: 'step' },
                prepStatus?.anamnese_pdf?.completed_at && { time: prepStatus.anamnese_pdf.completed_at, label: 'Anamnese PDF generated', detail: `${prepStatus.anamnese_pdf.file_count || 0} file(s)`, icon: 'step' },
                prepStatus?.ldt_file?.completed_at && { time: prepStatus.ldt_file.completed_at, label: 'LDT file generated', icon: 'step' },
                prepStatus?.pad_pvs?.completed_at && { time: prepStatus.pad_pvs.completed_at, label: 'PVS/PAD snapshot captured', icon: 'step' },
                prepStatus?.dhl_label?.completed_at && { time: prepStatus.dhl_label.completed_at, label: 'DHL label created', icon: 'step' },
                prepStatus?.dhl_label?.status === 'failed' && prepStatus.dhl_label.attempted_at && { time: prepStatus.dhl_label.attempted_at, label: 'DHL label failed', detail: prepStatus.dhl_label.error, icon: 'error' },
                ...resends.map((r: any) => ({
                  time: r.created_at,
                  label: `Resend requested`,
                  detail: `${RESEND_REASONS.find(rr => rr.value === r.reason)?.label || r.reason}${r.notes ? ` — ${r.notes}` : ''}`,
                  icon: 'resend' as const,
                })),
                ...resends.filter((r: any) => r.shipped_at).map((r: any) => ({
                  time: r.shipped_at,
                  label: 'Resend shipped',
                  detail: `Tracking: ${r.new_dhl_tracking || 'N/A'}`,
                  icon: 'step' as const,
                })),
                ...resends.filter((r: any) => r.received_at).map((r: any) => ({
                  time: r.received_at,
                  label: 'Resend received at lab',
                  icon: 'step' as const,
                })),
              ]
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
                .map((event: any, i: number, arr: any[]) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                        event.icon === 'error' ? 'bg-red-400' :
                        event.icon === 'payment' ? 'bg-green-400' :
                        event.icon === 'create' ? 'bg-primary' :
                        event.icon === 'resend' ? 'bg-amber-400' :
                        'bg-gray-300'
                      }`} />
                      {i < arr.length - 1 && <div className="w-[2px] flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-6">
                      <div className="text-[13px] font-medium text-near-black">{event.label}</div>
                      {event.detail && <div className="text-[12px] text-gray-400 mt-0.5">{event.detail}</div>}
                      <div className="text-[11px] text-gray-300 mt-1">
                        {new Date(event.time).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              }

              {!order.created_at && (
                <div className="py-8 text-center">
                  <Clock className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No activity recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Payment Modal */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-medium text-[18px] text-near-black">Confirm Payment</h3>
            <p className="text-[14px] text-gray-500 mt-2">
              Are you sure you want to confirm the bank transfer payment for order <span className="font-medium text-near-black">{order.display_id}</span>?
            </p>
            <p className="text-[13px] text-gray-400 mt-1">
              This will trigger the preparation pipeline and generate all order files.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirmModal(false)} className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300">
                Cancel
              </button>
              <button onClick={handleConfirmPayment} disabled={confirmingPayment} className="px-5 py-2.5 text-[13px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1.5">
                {confirmingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Resend Modal */}
      {showResendModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowResendModal(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-lg w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-medium text-[18px] text-near-black">Request Resend</h3>
              <button onClick={() => setShowResendModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-[13px] text-gray-500 mb-4">
              A new collection kit will be prepared and shipped to the patient for order <span className="font-medium text-near-black">{order.display_id}</span>.
            </p>

            {/* Reason select */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Reason *</label>
              <select
                value={resendReason}
                onChange={e => setResendReason(e.target.value)}
                className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] outline-none transition-colors appearance-none bg-white"
                style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' }}
              >
                <option value="">Select reason...</option>
                {RESEND_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
              <textarea
                value={resendNotes}
                onChange={e => setResendNotes(e.target.value)}
                placeholder="Additional details about the issue..."
                rows={3}
                className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[14px] outline-none transition-colors resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResendModal(false)}
                className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResend}
                disabled={!resendReason || submittingResend}
                className="px-5 py-2.5 text-[13px] font-medium bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingResend ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Confirm Resend
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
