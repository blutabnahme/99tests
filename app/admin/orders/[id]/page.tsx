"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle,
  Package, FileText, FileCode, Receipt, Truck, FlaskConical,
  Download, Upload, RefreshCw, User, Users, Stethoscope, CreditCard, MapPin, Building2,
  ChevronDown, ChevronRight, ChevronLeft, ArrowRight, Image as ImageIcon, Check, RotateCcw, ClipboardList, X
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

const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'pending': { label: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'label_created': { label: 'Label Created', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'awaiting_schedule': { label: 'Awaiting Schedule', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  'scheduled': { label: 'Scheduled', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'patient_sent': { label: 'Sent by Patient', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'collected': { label: 'Collected', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'in_transit': { label: 'In Transit', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'delivered': { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-100' },
  'cancelled': { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
  'failed': { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const SHIPMENT_STATUS_STEPS_STANDARD = ['pending', 'label_created', 'patient_sent', 'in_transit', 'delivered'];
const SHIPMENT_STATUS_STEPS_GOLOGISTIK = ['awaiting_schedule', 'scheduled', 'collected', 'in_transit', 'delivered'];

const OUTBOUND_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'pending': { label: 'Pending', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'label_created': { label: 'Label Created', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'shipped': { label: 'Shipped', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'in_transit': { label: 'In Transit', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'delivered': { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-100' },
};

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
  const [showRerunModal, setShowRerunModal] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'preparation' | 'shipments' | 'files' | 'results' | 'timeline'>('overview');
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendReason, setResendReason] = useState('');
  const [resendNotes, setResendNotes] = useState('');
  const [submittingResend, setSubmittingResend] = useState(false);
  const [resends, setResends] = useState<any[]>([]);
  const [resendTests, setResendTests] = useState<any[]>([]);
  const [resendStep, setResendStep] = useState<1 | 2>(1);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [closingDrawer, setClosingDrawer] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [showUploadResultModal, setShowUploadResultModal] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [uploadStep, setUploadStep] = useState(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLabId, setUploadLabId] = useState('');
  const [uploadSelectedTests, setUploadSelectedTests] = useState<any[]>([]);
  const [uploadVisibility, setUploadVisibility] = useState('doctor_and_patient');
  const [uploadAdminNotes, setUploadAdminNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const availableLabs = [...new Map(
    [
      // From recommendation items (test → lab)
      ...(order?.items || [])
        .filter((item: any) => item.test?.laboratory?.id)
        .map((item: any) => [item.test.laboratory.id, { id: item.test.laboratory.id, name: item.test.laboratory.name || 'Unknown' }]),
      // Fallback: from shipments (if items don't have lab data)
      ...(shipments || [])
        .filter((s: any) => s.laboratory_id && s.laboratory)
        .map((s: any) => [s.laboratory_id, { id: s.laboratory_id, name: s.laboratory?.name || 'Unknown' }]),
    ]
  ).values()];

  const fetchResults = async () => {
    if (!params?.id) return;
    setResultsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/results`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {}
    finally { setResultsLoading(false); }
  };

  const getResultsCoverage = (): number => {
    const allCoveredTestIds = new Set<string>();
    results.forEach((r: any) => {
      (r.tests_covered || []).forEach((t: any) => {
        if (t.test_id) allCoveredTestIds.add(t.test_id);
      });
    });
    return allCoveredTestIds.size;
  };

  const toggleStep = (key: string) => {
    setExpandedSteps(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const closeActivityDrawer = () => {
    setClosingDrawer(true);
    setTimeout(() => {
      setShowActivityDrawer(false);
      setClosingDrawer(false);
    }, 200);
  };

  function deriveMaterialsFromTests(selectedTests: any[], allMaterials: any[]): any[] {
    const materialMap = new Map<string, { material_name: string; material_code: string; tube_count: number; tests: string[] }>();
    
    for (const test of selectedTests) {
      // Search in source_tests jsonb array within each calculated material
      const mat = allMaterials.find((m: any) => {
        const sourceTests = Array.isArray(m.source_tests) ? m.source_tests : [];
        return sourceTests.some((st: any) => 
          st.test_name?.toLowerCase() === test.test_name?.toLowerCase() ||
          st.test_id === test.id
        );
      });
      
      // Get material name from the joined material object
      const matName = mat?.material?.name || mat?.material_name || test.material_name || 'Unknown';
      const matCode = mat?.material?.code || mat?.material_code || test.material_code || '';
      
      if (!materialMap.has(matName)) {
        materialMap.set(matName, {
          material_name: matName,
          material_code: matCode,
          tube_count: 1,
          tests: [],
        });
      }
      materialMap.get(matName)!.tests.push(test.test_name);
    }
    
    return Array.from(materialMap.values());
  }

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

  const fetchShipments = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipments`);
      const data = await res.json();
      setShipments(data.data || []);
    } catch (err) {
      console.error('Failed to fetch shipments:', err);
    }
  };

  const handleUpdateShipmentStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: shipmentId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update shipment');
      await fetchShipments();
      await fetchOrder();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdateOutboundStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/shipments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          shipment_id: shipmentId, 
          outbound_status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update shipment');
      await fetchShipments();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  useEffect(() => { 
    fetchOrder(); 
    fetchResends(); 
    fetchShipments();
  }, [params.id]);

  useEffect(() => {
    if (activeTab === 'results' && order?.id) {
      fetchResults();
    }
  }, [activeTab, order?.id]);

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
    setShowRerunModal(false);
    setRerunning(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/rerun-pipeline`, { method: 'POST' });
      if (!res.ok) throw new Error('Pipeline failed');
      await fetchOrder();
      await fetchResends();
      await fetchShipments();
    } catch (err: any) {
      alert('Pipeline error: ' + err.message);
    } finally {
      setRerunning(false);
    }
  };

  const handleSubmitResend = async () => {
    if (!resendReason) return;
    const selectedTests = resendTests.filter((t: any) => t.selected);
    if (selectedTests.length === 0) {
      alert('Please select at least one test to redo.');
      return;
    }
    // Auto-derive materials from selected tests
    const derivedMaterials = deriveMaterialsFromTests(selectedTests, order.calculated_materials || []);
    
    setSubmittingResend(true);
    setShowResendModal(false);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: resendReason,
          notes: resendNotes,
          failed_tests: selectedTests.map((t: any) => ({
            test_id: t.id,
            test_name: t.test_name,
            test_sku: t.test_sku,
          })),
          materials: derivedMaterials.map((m: any) => ({
            material_name: m.material_name,
            material_code: m.material_code,
            tube_count: m.tube_count,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create resend');
      await fetchOrder();
      await fetchResends();
      await fetchShipments();
      setResendReason('');
      setResendNotes('');
      setResendTests([]);
      setActiveTab('shipments');
    } catch (err: any) {
      alert('Resend error: ' + err.message);
    } finally {
      setSubmittingResend(false);
    }
  };

  const handleUpdateResendStatus = async (resendId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}/resend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend_id: resendId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update resend');
      await fetchResends();
      await fetchOrder();
    } catch (err: any) {
      alert('Error: ' + err.message);
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
          <button
            onClick={() => setShowActivityDrawer(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-gray-500 rounded-full hover:text-near-black hover:bg-gray-100 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Activity
            {/* Event count badge */}
            {(() => {
              const hasAlert = resends.some((r: any) => r.status === 'created' || r.status === 'shipped') || prepStatus?.dhl_label?.status === 'failed';
              const count = [
                order.created_at,
                order.payment_confirmed_at,
                prepStatus?.materials?.completed_at,
                prepStatus?.anamnese_pdf?.completed_at,
                prepStatus?.ldt_file?.completed_at,
                prepStatus?.pad_pvs?.completed_at,
                prepStatus?.dhl_label?.completed_at || prepStatus?.dhl_label?.attempted_at,
                ...resends.map((r: any) => r.created_at),
                ...resends.filter((r: any) => r.shipped_at).map((r: any) => r.shipped_at),
                ...resends.filter((r: any) => r.received_at).map((r: any) => r.received_at),
              ].filter(Boolean).length;
              return (
                <span className={`ml-0.5 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold rounded-full ${
                  hasAlert ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              );
            })()}
          </button>
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
              onClick={() => {
                setResendStep(1);
                setResendReason('');
                setResendNotes('');
                // Populate tests from order items
                const tests = (order.items || []).map((item: any) => ({
                  id: item.id || item.test_id,
                  test_name: item.test?.name || item.name || '',
                  test_sku: item.test?.sku || item.sku || '',
                  lab_name: item.test?.laboratory?.name || '',
                  material_name: '',
                  material_code: '',
                  selected: true,
                }));
                // Try to enrich with material info from calculated_materials
                const mats = order.calculated_materials || [];
                for (const test of tests) {
                  const mat = mats.find((m: any) => 
                    (m.test_names || '').toLowerCase().includes(test.test_name.toLowerCase())
                  );
                  if (mat) {
                    test.material_name = mat.material_name || '';
                    test.material_code = mat.material_code || '';
                  }
                }
                setResendTests(tests);
                setShowResendModal(true);
              }}
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
            onClick={() => setShowRerunModal(true)}
            disabled={rerunning}
            className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-medium text-gray-500 border border-gray-200 rounded-full hover:text-near-black hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rerunning ? 'animate-spin' : ''}`} />
            {rerunning ? 'Running...' : 'Re-run Pipeline'}
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
        {(() => {
          const tabs = [
            { key: 'overview', label: 'Overview' },
            { key: 'preparation', label: 'Preparation' },
            { key: 'shipments', label: 'Shipments' },
            { key: 'files', label: 'Files' },
            { key: 'results', label: 'Results' },
            { key: 'timeline', label: 'Timeline' },
          ];
          return tabs.map(tab => (
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
              {tab.key === 'shipments' && resends.filter((r: any) => r.status === 'created' || r.status === 'shipped').length > 0 && (
                <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-amber-100 text-amber-600 rounded-full px-1">
                  {resends.filter((r: any) => r.status === 'created' || r.status === 'shipped').length}
                </span>
              )}
              {tab.key === 'results' && results.filter((r: any) => r.status === 'doctor_reviewing').length > 0 && (
                <span className="min-w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold bg-amber-100 text-amber-600 rounded-full px-1">
                  {results.filter((r: any) => r.status === 'doctor_reviewing').length}
                </span>
              )}
            </button>
          ));
        })()}
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

          {activeTab === 'shipments' && (
            <div className="space-y-4">
              {shipments.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-[14px]">
                  No shipments created yet. Run the pipeline to generate shipments.
                </div>
              ) : (
                [...shipments].sort((a, b) => {
                  if (!a.resend_id && b.resend_id) return -1;
                  if (a.resend_id && !b.resend_id) return 1;
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }).map((shipment: any) => {
                  const returnStatusConfig = SHIPMENT_STATUS_CONFIG[shipment.status] || SHIPMENT_STATUS_CONFIG['pending'];
                  const outboundStatusConfig = OUTBOUND_STATUS_CONFIG[shipment.outbound_status || 'pending'];
                  const tests = Array.isArray(shipment.tests) ? shipment.tests : [];
                  const materials = Array.isArray(shipment.materials) ? shipment.materials : [];
                  const returnSteps = shipment.shipping_method === 'gologistik' 
                    ? SHIPMENT_STATUS_STEPS_GOLOGISTIK 
                    : SHIPMENT_STATUS_STEPS_STANDARD;
                  const returnStepIdx = returnSteps.indexOf(shipment.status);
                  const outboundSteps = ['pending', 'label_created', 'shipped', 'delivered'];
                  const outboundStepIdx = outboundSteps.indexOf(shipment.outbound_status || 'pending');
                  
                  return (
                    <div key={shipment.id} className={`rounded-[16px] border overflow-hidden ${
                      shipment.resend_id ? 'border-amber-200' : 'border-gray-200'
                    }`}>
                      {/* Lab header */}
                      <div className="px-5 py-4 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <div className="text-[14px] font-medium text-near-black">
                              {shipment.laboratory?.name || 'Unknown Lab'}
                            </div>
                            {shipment.laboratory?.address_city && (
                              <div className="text-[12px] text-gray-400">{shipment.laboratory.address_city}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {shipment.resend_id && (
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                              Resend #{resends.findIndex((r: any) => r.id === shipment.resend_id) + 1 || '?'}
                            </span>
                          )}
                          <span className={`text-[11px] font-medium uppercase px-2 py-0.5 rounded-full ${
                            shipment.shipping_method === 'gologistik' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {shipment.shipping_method === 'gologistik' ? 'GoLogistik' : 'Standard'}
                          </span>
                        </div>
                      </div>

                      {shipment.resend_id && (() => {
                        const resend = resends.find((r: any) => r.id === shipment.resend_id);
                        if (!resend) return null;
                        const reasonLabel = RESEND_REASONS.find((rr: any) => rr.value === resend.reason)?.label || resend.reason;
                        const failedTests = Array.isArray(resend.failed_tests) ? resend.failed_tests : [];
                        return (
                          <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100 flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <RotateCcw className="w-3 h-3 text-amber-500" />
                              <span className="text-[12px] font-medium text-amber-700">{reasonLabel}</span>
                            </div>
                            {resend.notes && (
                              <span className="text-[11px] text-amber-600">— {resend.notes}</span>
                            )}
                            <div className="flex gap-1 flex-wrap ml-auto">
                              {failedTests.map((ft: any, fi: number) => (
                                <span key={fi} className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                                  {ft.test_name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Two-leg layout */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                        
                        {/* LEG 1: Kit to Patient (Outbound) */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-[13px] font-medium text-near-black">Kit to Patient</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${outboundStatusConfig.bgColor} ${outboundStatusConfig.color}`}>
                              {outboundStatusConfig.label}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-gray-400 mb-3">via DHL</div>

                          {/* Outbound progress bar */}
                          <div className="flex items-center gap-0.5 mb-3">
                            {outboundSteps.map((step, si) => (
                              <div key={step} className={`flex-1 h-1 rounded-full ${
                                si <= outboundStepIdx ? 'bg-blue-500' : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>

                          {/* Outbound tracking */}
                          {shipment.outbound_tracking_number && (
                            <div className="mb-3">
                              <div className="text-[11px] text-gray-400 mb-0.5">Tracking</div>
                              <div className="font-mono text-[12px] text-near-black">{shipment.outbound_tracking_number}</div>
                            </div>
                          )}
                          {shipment.outbound_shipped_at && (
                            <div className="text-[11px] text-gray-400">Shipped: {formatDate(shipment.outbound_shipped_at)}</div>
                          )}
                          {shipment.outbound_delivered_at && (
                            <div className="text-[11px] text-gray-400">Delivered: {formatDate(shipment.outbound_delivered_at)}</div>
                          )}

                          {/* Outbound actions */}
                          {shipment.outbound_status !== 'delivered' && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {(shipment.outbound_status === 'pending' || !shipment.outbound_status) && (
                                <button
                                  onClick={() => handleUpdateOutboundStatus(shipment.id, 'label_created')}
                                  className="px-3.5 py-1.5 text-[11px] font-medium bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  Generate DHL Label
                                </button>
                              )}
                              {shipment.outbound_status === 'label_created' && (
                                <button
                                  onClick={() => handleUpdateOutboundStatus(shipment.id, 'shipped')}
                                  className="px-3.5 py-1.5 text-[11px] font-medium bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors flex items-center gap-1"
                                >
                                  <Truck className="w-3 h-3" />
                                  Mark Shipped
                                </button>
                              )}
                              {shipment.outbound_status === 'shipped' && (
                                <button
                                  onClick={() => handleUpdateOutboundStatus(shipment.id, 'delivered')}
                                  className="px-3.5 py-1.5 text-[11px] font-medium bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark Delivered
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* LEG 2: Sample to Lab (Return) */}
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[13px] font-medium text-near-black">Sample to Lab</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${returnStatusConfig.bgColor} ${returnStatusConfig.color}`}>
                              {returnStatusConfig.label}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-gray-400 mb-3">
                            via {shipment.shipping_method === 'gologistik' ? 'GoLogistik Courier' : 'DHL Return Label'}
                          </div>

                          {/* Return progress bar */}
                          <div className="flex items-center gap-0.5 mb-3">
                            {returnSteps.map((step, si) => (
                              <div key={step} className={`flex-1 h-1 rounded-full ${
                                si <= returnStepIdx ? 'bg-primary' : 'bg-gray-200'
                              }`} />
                            ))}
                          </div>

                          {/* Return tracking */}
                          {(shipment.tracking_number || shipment.gologistik_hwb) && (
                            <div className="mb-3">
                              <div className="text-[11px] text-gray-400 mb-0.5">Tracking</div>
                              <div className="font-mono text-[12px] text-near-black">{shipment.gologistik_hwb || shipment.tracking_number}</div>
                            </div>
                          )}
                          {shipment.shipping_method === 'gologistik' && shipment.gologistik_pickup_date && (
                            <div className="mb-2">
                              <div className="text-[11px] text-gray-400 mb-0.5">Pickup</div>
                              <div className="text-[12px] text-near-black">
                                {formatDate(shipment.gologistik_pickup_date)}
                                {shipment.gologistik_pickup_timeslot && `, ${shipment.gologistik_pickup_timeslot}`}
                              </div>
                            </div>
                          )}
                          {shipment.shipped_at && (
                            <div className="text-[11px] text-gray-400">Sent: {formatDate(shipment.shipped_at)}</div>
                          )}
                          {shipment.delivered_at && (
                            <div className="text-[11px] text-gray-400">Received at lab: {formatDate(shipment.delivered_at)}</div>
                          )}

                          {/* Return actions */}
                          {!['delivered', 'cancelled'].includes(shipment.status) && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              {shipment.shipping_method === 'standard' && (
                                <>
                                  {shipment.status === 'pending' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'label_created')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center gap-1"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Generate Return Label
                                    </button>
                                  )}
                                  {shipment.status === 'label_created' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'patient_sent')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center gap-1"
                                    >
                                      <Package className="w-3 h-3" />
                                      Patient Sent Sample
                                    </button>
                                  )}
                                  {shipment.status === 'patient_sent' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'in_transit')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors flex items-center gap-1"
                                    >
                                      <Truck className="w-3 h-3" />
                                      In Transit
                                    </button>
                                  )}
                                  {shipment.status === 'in_transit' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'delivered')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Received at Lab
                                    </button>
                                  )}
                                </>
                              )}
                              {shipment.shipping_method === 'gologistik' && (
                                <>
                                  {shipment.status === 'awaiting_schedule' && (
                                    <span className="text-[11px] text-amber-600 font-medium">
                                      Waiting for patient to schedule pickup
                                    </span>
                                  )}
                                  {shipment.status === 'scheduled' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'collected')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors flex items-center gap-1"
                                    >
                                      <Package className="w-3 h-3" />
                                      Mark Collected
                                    </button>
                                  )}
                                  {shipment.status === 'collected' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'in_transit')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors flex items-center gap-1"
                                    >
                                      <Truck className="w-3 h-3" />
                                      In Transit
                                    </button>
                                  )}
                                  {shipment.status === 'in_transit' && (
                                    <button
                                      onClick={() => handleUpdateShipmentStatus(shipment.id, 'delivered')}
                                      className="px-3.5 py-1.5 text-[11px] font-medium bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Received at Lab
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tests & Materials footer */}
                      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Tests ({tests.length})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {tests.map((t: any, ti: number) => (
                                <span key={ti} className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-near-black">
                                  {t.test_name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Materials ({materials.length})</div>
                            <div className="flex flex-wrap gap-1.5">
                              {materials.map((m: any, mi: number) => (
                                <span key={mi} className="text-[11px] px-2 py-0.5 bg-white border border-gray-200 rounded-full text-near-black">
                                  {m.material_name} × {m.tube_count}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
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
                      order.pad_pvs_data ? 1 : 0,
                    ].reduce((a: number, b: number) => a + b, 0)} file(s) available
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

              {/* PAD XML — generate on-demand */}
              {order.pad_pvs_data && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/admin/exports/pad', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_ids: [order.id] }),
                      });
                      if (!res.ok) throw new Error('Failed to generate PAD XML');
                      
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `PAD_${order.display_id}.xml`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err: any) {
                      alert('PAD export error: ' + err.message);
                    }
                  }}
                  className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-near-black">PAD XML</div>
                    <div className="text-[12px] text-gray-400 truncate">
                      GOÄ billing export (ADL v2.12)
                      {prepStatus?.pad_pvs?.completed_at && (
                        <span className="ml-2">· Data captured {formatDate(prepStatus.pad_pvs.completed_at)}</span>
                      )}
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              )}

              {!order.anamnese_pdf_urls?.length && !order.ldt_file_url && !order.tif_file_url && !order.pad_pvs_data && (
                <div className="py-8 text-center">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No files generated yet</p>
                  <p className="text-[12px] text-gray-300 mt-1">Run the preparation pipeline to generate files</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-medium text-[15px] text-near-black">Lab Results</h3>
                  {order.items && (
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      {getResultsCoverage()} of {order.items.length} test{order.items.length !== 1 ? 's' : ''} have results
                    </p>
                  )}
                </div>
                <button
                  onClick={() => { setUploadStep(1); setUploadFile(null); setUploadLabId(''); setUploadSelectedTests([]); setUploadVisibility(order.recommendation?.results_delivery || 'doctor_and_patient'); setUploadAdminNotes(''); setShowUploadResultModal(true); }}
                  className="px-4 py-2 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[13px] font-medium transition-colors flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Results
                </button>
              </div>

              {/* Results Coverage Overview */}
              {order.items && order.items.length > 0 && (
                <div className="bg-gray-50 rounded-[12px] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#008085] rounded-full transition-all"
                        style={{ width: `${(getResultsCoverage() / (order.items?.length || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-medium text-gray-600 shrink-0">
                      {getResultsCoverage()}/{order.items.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item: any) => {
                      const testId = item.test_id || item.id;
                      const testName = item.test?.name || item.name || 'Unknown';
                      const hasCoverage = results.some((r: any) =>
                        (r.tests_covered || []).some((t: any) => t.test_id === testId)
                      );
                      return (
                        <span
                          key={testId}
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

              {/* Results List */}
              {resultsLoading ? (
                <div className="py-8 flex justify-center"><LoadingSpinner size="lg" /></div>
              ) : results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result: any) => (
                    <div key={result.id} className="flex items-center gap-3 p-4 rounded-[12px] border border-gray-200 hover:border-primary/30 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-medium text-near-black truncate">{result.file_name}</span>
                          <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            result.status === 'released' ? 'bg-green-50 text-green-700' :
                            result.status === 'doctor_reviewing' ? 'bg-amber-50 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {result.status === 'released' ? 'Released' :
                             result.status === 'doctor_reviewing' ? 'Doctor Review' :
                             'Uploaded'}
                          </span>
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            result.visibility === 'doctor_and_patient' ? 'bg-blue-50 text-blue-600' :
                            result.visibility === 'doctor_only' ? 'bg-purple-50 text-purple-600' :
                            'bg-teal-50 text-teal-600'
                          }`}>
                            {result.visibility === 'doctor_and_patient' ? 'Doctor & Patient' :
                             result.visibility === 'doctor_only' ? 'Doctor Only' :
                             'Patient Only'}
                          </span>
                        </div>
                        <div className="text-[12px] text-gray-400 mt-0.5 truncate">
                          {result.laboratory?.name || 'Unknown lab'}
                          {result.tests_covered?.length > 0 && (
                            <span> · Tests: {result.tests_covered.map((t: any) => t.test_name || t.name).join(', ')}</span>
                          )}
                          <span> · {formatDate(result.created_at)}</span>
                          {result.file_size_bytes && (
                            <span> · {(result.file_size_bytes / 1024).toFixed(0)} KB</span>
                          )}
                        </div>
                        {result.admin_notes && (
                          <div className="text-[12px] text-gray-400 mt-0.5 italic">Note: {result.admin_notes}</div>
                        )}
                        {result.doctor_notes && (
                          <div className="text-[12px] text-blue-500 mt-0.5">Doctor: {result.doctor_notes}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/orders/${order.id}/results/${result.id}/download`);
                              if (!res.ok) throw new Error('Failed');
                              const data = await res.json();
                              window.open(data.url, '_blank');
                            } catch (err: any) {
                              alert('Download error: ' + err.message);
                            }
                          }}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Delete this result file?')) return;
                            try {
                              const res = await fetch(`/api/admin/orders/${order.id}/results/${result.id}`, { method: 'DELETE' });
                              if (!res.ok) throw new Error('Failed');
                              setResults(prev => prev.filter(r => r.id !== result.id));
                            } catch (err: any) {
                              alert('Delete error: ' + err.message);
                            }
                          }}
                          className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Delete"
                        >
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center border border-dashed border-gray-200 rounded-[12px]">
                  <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-[14px] text-gray-400">No results uploaded yet</p>
                  <p className="text-[12px] text-gray-300 mt-1">Upload lab result PDFs to share with the doctor and patient</p>
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
                .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
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
          <div className="bg-white rounded-[16px] shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-medium text-[18px] text-near-black">Request Resend</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Order {order.display_id}</p>
              </div>
              <button onClick={() => setShowResendModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  resendStep === 1 ? 'bg-primary text-white' : 'bg-primary/15 text-primary'
                }`}>
                  {resendStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
                </div>
                <span className={`text-[13px] font-medium ${resendStep === 1 ? 'text-near-black' : 'text-gray-400'}`}>Reason</span>
              </div>
              <div className="w-8 h-[2px] bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  resendStep === 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  2
                </div>
                <span className={`text-[13px] font-medium ${resendStep === 2 ? 'text-near-black' : 'text-gray-400'}`}>Tests</span>
              </div>
            </div>

            {/* Step content */}
            <div className="px-6 py-4">
              {resendStep === 1 && (
                <div className="space-y-4">
                  <p className="text-[13px] text-gray-500">
                    A new collection kit will be prepared and shipped to the patient.
                  </p>

                  {/* Reason */}
                  <div>
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
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Notes (optional)</label>
                    <textarea
                      value={resendNotes}
                      onChange={e => setResendNotes(e.target.value)}
                      placeholder="Additional details about the issue..."
                      rows={3}
                      className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[14px] outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {resendStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-gray-500">
                      Select which tests need to be redone.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = resendTests.every((t: any) => t.selected);
                        setResendTests(resendTests.map((t: any) => ({ ...t, selected: !allSelected })));
                      }}
                      className="text-[12px] text-primary hover:text-primary-dark font-medium"
                    >
                      {resendTests.every((t: any) => t.selected) ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  {/* Test selection */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {resendTests.map((test: any, i: number) => (
                      <label
                        key={i}
                        className={`flex items-center gap-3 cursor-pointer p-3 rounded-[12px] border transition-colors ${
                          test.selected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={test.selected}
                          onChange={() => {
                            const updated = [...resendTests];
                            updated[i] = { ...updated[i], selected: !updated[i].selected };
                            setResendTests(updated);
                          }}
                          className="w-4 h-4 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-near-black">{test.test_name}</div>
                          <div className="text-[11px] text-gray-400">
                            {test.test_sku && `${test.test_sku}`}
                            {test.lab_name && ` · ${test.lab_name}`}
                            {test.material_name && ` · ${test.material_name}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Selection count */}
                  <div className="text-[12px] text-gray-400">
                    {resendTests.filter((t: any) => t.selected).length} of {resendTests.length} test(s) selected
                  </div>

                  {/* Auto-calculated materials preview */}
                  {resendTests.some((t: any) => t.selected) && (
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <div className="text-[12px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                        Required Materials
                      </div>
                      <div className="space-y-1.5">
                        {deriveMaterialsFromTests(
                          resendTests.filter((t: any) => t.selected),
                          order.calculated_materials || []
                        ).map((mat: any, mi: number) => (
                          <div key={mi} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-[8px] text-[12px]">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-400" />
                              <span className="text-near-black font-medium">{mat.material_name}</span>
                              {mat.material_code && <span className="text-gray-400">({mat.material_code})</span>}
                            </div>
                            <span className="text-gray-500">{mat.tube_count} tube(s)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with navigation */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              {resendStep === 1 ? (
                <>
                  <button
                    onClick={() => setShowResendModal(false)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setResendStep(2)}
                    disabled={!resendReason}
                    className="px-5 py-2.5 text-[13px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setResendStep(1)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300 flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                  <button
                    onClick={handleSubmitResend}
                    disabled={submittingResend || resendTests.filter((t: any) => t.selected).length === 0}
                    className="px-5 py-2.5 text-[13px] font-medium bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingResend ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    Confirm Resend
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Upload Result Modal */}
      {showUploadResultModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowUploadResultModal(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-lg w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-medium text-[18px] text-near-black">Upload Results</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Order {order.display_id}</p>
              </div>
              <button onClick={() => setShowUploadResultModal(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 pt-4 pb-2 flex items-center gap-3">
              {[
                { num: 1, label: 'File & Lab' },
                { num: 2, label: 'Tests' },
                { num: 3, label: 'Delivery' },
              ].map((s, i) => (
                <React.Fragment key={s.num}>
                  {i > 0 && <div className="w-8 h-[2px] bg-gray-200" />}
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      uploadStep === s.num ? 'bg-[#008085] text-white' :
                      uploadStep > s.num ? 'bg-[#008085]/15 text-[#008085]' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {uploadStep > s.num ? '✓' : s.num}
                    </div>
                    <span className={`text-[12px] font-medium ${
                      uploadStep === s.num ? 'text-near-black' : 'text-gray-400'
                    }`}>{s.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">

              {/* STEP 1: File & Lab */}
              {uploadStep === 1 && (
                <div className="space-y-5">
                  {/* File Drop Zone */}
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Result File (PDF)</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const dropped = e.dataTransfer.files[0];
                        if (dropped?.type === 'application/pdf') setUploadFile(dropped);
                      }}
                      className={`border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-colors ${
                        dragOver ? 'border-[#008085] bg-[#008085]/5' :
                        uploadFile ? 'border-emerald-300 bg-emerald-50' :
                        'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => document.getElementById('result-file-input')?.click()}
                    >
                      {uploadFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-500" />
                          <span className="text-[14px] text-near-black font-medium">{uploadFile.name}</span>
                          <span className="text-[12px] text-gray-400">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                          <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="ml-2">
                            <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-[14px] text-gray-500">Drop PDF here or click to browse</p>
                          <p className="text-[12px] text-gray-400 mt-1">Maximum 10MB</p>
                        </>
                      )}
                    </div>
                    <input
                      id="result-file-input"
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setUploadFile(f);
                      }}
                    />
                  </div>

                  {/* Lab Selector */}
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Laboratory</label>
                    {availableLabs.length === 0 ? (
                      <p className="text-[13px] text-gray-400">No laboratories found for this order.</p>
                    ) : availableLabs.length === 1 ? (
                      <div className="px-4 py-3 rounded-[12px] bg-gray-50 border border-gray-200 text-[14px] text-near-black">
                        {availableLabs[0].name}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {availableLabs.map((lab: any) => (
                          <label
                            key={lab.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-[12px] cursor-pointer transition-colors ${
                              uploadLabId === lab.id ? 'bg-[#008085]/5 border border-[#008085]/20' : 'hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="upload-lab"
                              value={lab.id}
                              checked={uploadLabId === lab.id}
                              onChange={() => { setUploadLabId(lab.id); setUploadSelectedTests([]); }}
                              className="hidden"
                            />
                            <span className="text-[14px] text-near-black">{lab.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Test Selection */}
              {uploadStep === 2 && (
                <div className="space-y-4">
                  <p className="text-[13px] text-gray-500">Select which tests this result file covers.</p>

                  {/* Select All / None */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const uncovered = (order.items || []).filter((item: any) => {
                          const testId = item.test?.id || item.test_id || item.id;
                          return !results.some((r: any) => (r.tests_covered || []).some((t: any) => t.test_id === testId));
                        });
                        setUploadSelectedTests(uncovered);
                      }}
                      className="text-[12px] text-[#008085] font-medium hover:underline"
                    >
                      Select all available
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setUploadSelectedTests([])}
                      className="text-[12px] text-gray-400 font-medium hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    {(order.items || []).map((item: any) => {
                      const testId = item.test?.id || item.test_id || item.id;
                      const testName = item.test?.name || item.name || 'Unknown test';
                      const alreadyCovered = results.some((r: any) =>
                        (r.tests_covered || []).some((t: any) => t.test_id === testId)
                      );
                      const isSelected = uploadSelectedTests.some((t: any) => (t.test?.id || t.test_id || t.id) === testId);

                      return (
                        <label
                          key={testId}
                          className={`flex items-center gap-3 px-4 py-3 rounded-[12px] cursor-pointer transition-colors ${
                            alreadyCovered ? 'bg-gray-50 opacity-60 cursor-not-allowed' :
                            isSelected ? 'bg-[#008085]/5 border border-[#008085]/20' :
                            'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={alreadyCovered}
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUploadSelectedTests(prev => [...prev, item]);
                              } else {
                                setUploadSelectedTests(prev => prev.filter(t => (t.test?.id || t.test_id || t.id) !== testId));
                              }
                            }}
                            className="rounded text-[#008085] focus:ring-[#008085]"
                          />
                          <span className={`text-[14px] ${alreadyCovered ? 'text-gray-400 line-through' : 'text-near-black'}`}>
                            {testName}
                          </span>
                          {alreadyCovered && (
                            <span className="text-[11px] text-emerald-500 ml-auto flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Has results
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <div className="text-[12px] text-gray-400 mt-2">
                    {uploadSelectedTests.length} test{uploadSelectedTests.length !== 1 ? 's' : ''} selected
                  </div>
                </div>
              )}

              {/* STEP 3: Delivery & Notes */}
              {uploadStep === 3 && (
                <div className="space-y-5">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-[12px] p-4">
                    <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Summary</div>
                    <div className="text-[13px] text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span>{uploadFile?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-3.5 h-3.5 text-gray-400" />
                        <span>{uploadSelectedTests.length} test{uploadSelectedTests.length !== 1 ? 's' : ''}: {uploadSelectedTests.map((t: any) => t.test?.name || t.name || 'Unknown').join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Results Delivery</label>
                    <div className="space-y-1.5">
                      {[
                        { value: 'doctor_and_patient', label: 'Doctor and Patient', desc: 'Both receive results immediately' },
                        { value: 'doctor_only', label: 'Doctor only', desc: 'Patient will not see these results' },
                        { value: 'patient_only', label: 'Patient only', desc: 'Doctor will not be notified' },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 px-4 py-3 rounded-[12px] cursor-pointer transition-colors ${
                            uploadVisibility === opt.value ? 'bg-[#008085]/5 border border-[#008085]/20' : 'hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="upload-visibility"
                            value={opt.value}
                            checked={uploadVisibility === opt.value}
                            onChange={() => setUploadVisibility(opt.value)}
                            className="hidden"
                          />
                          <div>
                            <span className="text-[14px] font-medium text-near-black">{opt.label}</span>
                            <span className="text-[12px] text-gray-400 block">{opt.desc}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2 block">Admin Notes (optional)</label>
                    <textarea
                      value={uploadAdminNotes}
                      onChange={(e) => setUploadAdminNotes(e.target.value)}
                      placeholder="Internal notes about this result..."
                      rows={2}
                      className="w-full rounded-[12px] border border-gray-200 px-4 py-2.5 text-[14px] resize-none focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Navigation */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              {uploadStep === 1 ? (
                <>
                  <div />
                  <button
                    onClick={() => {
                      if (!uploadFile) { alert('Please select a PDF file.'); return; }
                      if (availableLabs.length === 1) setUploadLabId(availableLabs[0].id);
                      if (availableLabs.length > 1 && !uploadLabId) { alert('Please select a laboratory.'); return; }
                      setUploadStep(2);
                    }}
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors"
                  >
                    Next: Select Tests →
                  </button>
                </>
              ) : uploadStep === 2 ? (
                <>
                  <button
                    onClick={() => setUploadStep(1)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (uploadSelectedTests.length === 0) { alert('Please select at least one test.'); return; }
                      setUploadStep(3);
                    }}
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors"
                  >
                    Next: Delivery →
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setUploadStep(2)}
                    className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={async () => {
                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', uploadFile!);
                        formData.append('laboratory_id', uploadLabId);
                        formData.append('tests_covered', JSON.stringify(uploadSelectedTests.map((t: any) => ({
                          test_id: t.test?.id || t.test_id || t.id,
                          test_name: t.test?.name || t.name || 'Unknown'
                        }))));
                        formData.append('visibility', uploadVisibility);
                        formData.append('auto_release', 'true');
                        formData.append('admin_notes', uploadAdminNotes);

                        const res = await fetch(`/api/admin/orders/${order.id}/results`, {
                          method: 'POST',
                          body: formData,
                        });

                        if (!res.ok) {
                          const data = await res.json();
                          throw new Error(data.error || 'Upload failed');
                        }

                        const data = await res.json();
                        setResults(prev => [data.result, ...prev]);
                        setShowUploadResultModal(false);
                      } catch (err: any) {
                        alert('Upload error: ' + err.message);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    disabled={uploading}
                    className="px-5 py-2.5 text-[13px] font-medium text-white bg-[#008085] hover:bg-[#005C5F] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload Result
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Re-run Pipeline Modal */}
      {showRerunModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={() => setShowRerunModal(false)}>
          <div className="bg-white rounded-[16px] shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-heading font-medium text-[18px] text-near-black">Re-run Pipeline</h3>
            <p className="text-[14px] text-gray-500 mt-2">
              This will recalculate materials and regenerate all files for order <span className="font-medium text-near-black">{order.display_id}</span>.
            </p>
            <p className="text-[13px] text-gray-400 mt-1">
              Existing files will be overwritten.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRerunModal(false)} className="px-5 py-2.5 text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors rounded-full border border-gray-200 hover:border-gray-300">
                Cancel
              </button>
              <button onClick={handleRerunPipeline} className="px-5 py-2.5 text-[13px] font-medium bg-primary text-white rounded-full hover:bg-primary-dark transition-colors flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Re-run Pipeline
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Activity Drawer */}
      {showActivityDrawer && createPortal(
        <div className={`fixed inset-0 z-[9999] ${closingDrawer ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={closeActivityDrawer}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30" />
          
          {/* Drawer panel */}
          <div 
            className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col ${closingDrawer ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-heading font-medium text-[16px] text-near-black">Activity</h3>
                <p className="text-[12px] text-gray-400 mt-0.5">Order {order.display_id}</p>
              </div>
              <button 
                onClick={closeActivityDrawer} 
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            {/* Drawer content — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-0">
                {[
                  order.created_at && { time: order.created_at, label: 'Order created', detail: `Order ${order.display_id}`, icon: 'create' },
                  order.payment_confirmed_at && { time: order.payment_confirmed_at, label: 'Payment confirmed', detail: formatPaymentMethod(order.payment_method), icon: 'payment' },
                  prepStatus?.materials?.completed_at && { time: prepStatus.materials.completed_at, label: 'Materials calculated', detail: `${prepStatus.materials.material_count || 0} material(s)`, icon: 'step' },
                  prepStatus?.anamnese_pdf?.completed_at && { time: prepStatus.anamnese_pdf.completed_at, label: 'Anamnese PDF generated', detail: `${prepStatus.anamnese_pdf.file_count || 0} file(s)`, icon: 'step' },
                  prepStatus?.ldt_file?.completed_at && { time: prepStatus.ldt_file.completed_at, label: 'LDT file generated', icon: 'step' },
                  prepStatus?.pad_pvs?.completed_at && { time: prepStatus.pad_pvs.completed_at, label: 'PVS/PAD snapshot captured', icon: 'step' },
                  prepStatus?.dhl_label?.completed_at && { time: prepStatus.dhl_label.completed_at, label: 'DHL label created', detail: prepStatus.dhl_label.mock ? 'Mock tracking' : '', icon: 'step' },
                  prepStatus?.dhl_label?.status === 'failed' && prepStatus.dhl_label.attempted_at && { time: prepStatus.dhl_label.attempted_at, label: 'DHL label failed', detail: prepStatus.dhl_label.error, icon: 'error' },
                  ...resends.map((r: any) => ({
                    time: r.created_at,
                    label: 'Resend requested',
                    detail: `${RESEND_REASONS.find((rr: any) => rr.value === r.reason)?.label || r.reason}${r.notes ? ` — ${r.notes}` : ''}`,
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
                  .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .map((event: any, i: number, arr: any[]) => (
                    <div key={i} className="flex gap-4">
                      {/* Timeline line + dot */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 shrink-0 ${
                          event.icon === 'error' ? 'bg-red-400' :
                          event.icon === 'payment' ? 'bg-green-400' :
                          event.icon === 'create' ? 'bg-primary' :
                          event.icon === 'resend' ? 'bg-amber-400' :
                          'bg-gray-300'
                        }`} />
                        {i < arr.length - 1 && <div className="w-[2px] flex-1 bg-gray-100 my-1" />}
                      </div>
                      {/* Content */}
                      <div className="pb-5 flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-near-black">{event.label}</div>
                        {event.detail && (
                          <div className="text-[12px] text-gray-400 mt-0.5 break-words">{event.detail}</div>
                        )}
                        <div className="text-[11px] text-gray-300 mt-1 font-mono">
                          {formatDate(event.time)}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* Drawer footer */}
            <div className="px-6 py-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => { closeActivityDrawer(); setActiveTab('timeline'); }}
                className="text-[13px] text-primary hover:text-primary-dark font-medium transition-colors"
              >
                View full timeline →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
