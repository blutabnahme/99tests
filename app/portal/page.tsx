"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList, ChevronDown, ChevronRight, FlaskConical,
  Package, Truck, CheckCircle2, CreditCard, ExternalLink, RefreshCw, ArrowLeftRight, FileText
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePatient } from '@/lib/patient-context';
import { formatDate } from '@/lib/format-date';

// Utils
function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function humanizeResendReason(reason: string): string {
  if (!reason) return '';
  const map: Record<string, string> = {
    'insufficient_volume': 'Insufficient sample volume',
    'hemolyzed': 'Sample hemolyzed',
    'clotted': 'Sample clotted',
    'contaminated': 'Sample contaminated',
    'damaged_in_transit': 'Damaged during shipping',
    'incorrect_tube': 'Incorrect collection tube used',
    'expired_sample': 'Sample expired',
    'patient_request': 'Requested by patient',
    'lab_error': 'Laboratory processing error',
    'other': 'Other reason',
  };
  return map[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    awaiting_payment: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting Payment' },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Awaiting Payment' },
    paid: { bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
    preparing: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Preparing' },
    kit_shipped: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Kit Shipped' },
    at_lab: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'At Lab' },
    results_ready: { bg: 'bg-green-50', text: 'text-green-700', label: 'Results Ready' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
  };
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

const TIMELINE_STEPS = [
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'kit_shipped', label: 'Shipped', icon: Truck },
  { key: 'at_lab', label: 'At Lab', icon: FlaskConical },
  { key: 'results_ready', label: 'Results', icon: CheckCircle2 },
];

function OrderTimeline({ status }: { status: string }) {
  const statusOrder = ['preparing', 'kit_shipped', 'at_lab', 'results_ready', 'completed'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-1 py-1 px-2">
      {TIMELINE_STEPS.map((step, i) => {
        const isComplete = currentIdx > i || status === 'completed';
        const isCurrent = statusOrder[currentIdx] === step.key;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div className={`flex-1 h-[3px] ${isComplete ? 'bg-[#008085]' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-[#008085] text-white' :
                isCurrent ? 'bg-[#008085]/10 text-[#008085] border border-[#008085]' :
                'bg-gray-100 text-gray-400 border border-gray-200'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-medium ${
                isComplete || isCurrent ? 'text-[#008085]' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Portals Context logic
function ConfirmModal({ isOpen, onClose, onConfirm }: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!isOpen || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}>
      <div className="bg-white rounded-[16px] w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="mb-6 mt-2 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#008085]/10 text-[#008085] flex items-center justify-center mb-4">
            <Package className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-medium text-lg text-near-black mb-2">Confirm Drop-off</h2>
          <p className="text-[14px] text-gray-500">Please confirm you've dropped off or handed over your sample package.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-full border border-[#008085] text-[#008085] hover:bg-[#008085]/5 text-[14px] font-medium transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[14px] font-medium transition-colors">Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function GoLogistikModal({ isOpen, onClose, onSubmit }: any) {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('Morning (8-12)');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!date) return;
    setShowSuccess(true);
    setTimeout(() => {
      onSubmit(date, slot);
      setShowSuccess(false);
      onClose();
    }, 2500);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}>
      <div className="bg-white rounded-[16px] w-full max-w-sm p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        {showSuccess ? (
           <div className="py-6 flex flex-col items-center text-center">
             <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
             <h2 className="font-heading font-medium text-lg text-near-black mb-2">Pickup scheduled!</h2>
             <p className="text-[14px] text-gray-500">A courier will collect your sample on {formatDate(date)} during the {slot} window.</p>
           </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 flex space-x-3 items-center">
              <h2 className="font-heading font-medium text-lg text-near-black">Schedule Sample Pickup</h2>
            </div>
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Pickup Date</label>
                <input required type="date" min={minDate} value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none bg-white transition-colors" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">Time Slot</label>
                <div className="space-y-2 flex flex-col">
                  {['Morning (8-12)', 'Afternoon (12-17)', 'Evening (17-20)'].map(s => (
                    <label key={s} className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border cursor-pointer transition-colors ${slot === s ? 'border-[#008085] bg-[#008085]/5' : 'border-gray-200'}`}>
                      <input type="radio" name="slot" value={s} checked={slot === s} onChange={() => setSlot(s)} className="text-[#008085] focus:ring-[#008085]" />
                      <span className="text-[14px] text-near-black font-medium">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-full border border-[#008085] text-[#008085] hover:bg-[#008085]/5 text-[14px] font-medium transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[14px] font-medium transition-colors">Schedule Pickup</button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

const getDoctorDisplay = (fullname?: string) => {
  if (!fullname) return 'Your doctor';
  const parts = fullname.trim().split(' ');
  const lastName = parts[parts.length - 1];
  return `Dr. med. ${lastName}`;
};

export default function PortalHomePage() {
  const { patient } = usePatient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // Modal State
  const [confirmModalData, setConfirmModalData] = useState<{orderId: string, shipmentId: string} | null>(null);
  const [gologistikModalData, setGologistikModalData] = useState<{orderId: string, shipmentId: string} | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/portal/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchOrders();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const handleConfirmSend = async () => {
    if (!confirmModalData) return;
    try {
      const res = await fetch(`/api/portal/orders/${confirmModalData.orderId}/shipments/${confirmModalData.shipmentId}/confirm-sent`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => {
          if (o.id === confirmModalData.orderId) {
            return {
              ...o,
              shipments: o.shipments.map((s: any) => s.id === confirmModalData.shipmentId ? { ...s, status: 'patient_sent' } : s)
            };
          }
          return o;
        }));
      }
    } catch (e) {}
    setConfirmModalData(null);
  };

  const handleScheduleGoLogistik = (date: string, slot: string) => {
    if (!gologistikModalData) return;
    console.log('GoLogistik pickup request:', { orderId: gologistikModalData.orderId, shipmentId: gologistikModalData.shipmentId, date, slot });
    
    setOrders(prev => prev.map(o => {
      if (o.id === gologistikModalData.orderId) {
        return {
          ...o,
          shipments: o.shipments.map((s: any) => s.id === gologistikModalData.shipmentId ? { ...s, status: 'scheduled', gologistik_pickup_date: date, gologistik_pickup_slot: slot } : s)
        };
      }
      return o;
    }));
  };

  const activeOrders = orders.filter((o: any) => o.status !== 'cancelled');
  const cancelledOrders = orders.filter((o: any) => o.status === 'cancelled');

  const getContextMessage = (order: any, effectiveStatus: string) => {
    const hasActiveResend = (order?.resends || []).some((r: any) => r.status !== 'completed');
    if (hasActiveResend) return { text: "A replacement kit is being arranged", color: "text-amber-600" };
    
    if (effectiveStatus === 'results_ready' || effectiveStatus === 'completed') return { text: "Your results are ready", color: "text-green-600" };
  
    const shipments = order?.shipments || [];
    const originalShipments = shipments.filter((s: any) => !s.resend_id);
  
    if (originalShipments.length > 0) {
      const anyOutboundPendingLabel = originalShipments.some((s:any) => s.outbound_status === 'pending' || s.outbound_status === 'label_created');
      const anyOutboundShipped = originalShipments.some((s:any) => s.outbound_status === 'shipped');
      const allOutboundDelivered = originalShipments.every((s:any) => s.outbound_status === 'delivered');
      
      const anyReturnPendingLabel = originalShipments.some((s:any) => s.status === 'pending' || s.status === 'label_created' || s.status === 'awaiting_schedule' || s.status === 'scheduled');
      const anyReturnInTransit = originalShipments.some((s:any) => s.status === 'patient_sent' || s.status === 'in_transit' || s.status === 'collected');
      const allReturnDelivered = originalShipments.every((s:any) => s.status === 'delivered');
  
      if (allReturnDelivered) return { text: "Your sample is at the lab", color: "text-[#008085]" };
      if (anyReturnInTransit) return { text: "Your sample is on its way to the lab", color: "text-[#008085]" };
      if (allOutboundDelivered && anyReturnPendingLabel) return { text: "Please send your sample back", color: "text-[#008085]" };
      if (anyOutboundShipped) return { text: "Your kit is on the way", color: "text-[#008085]" };
      if (anyOutboundPendingLabel) return { text: "Your kit is being prepared", color: "text-gray-400" };
    }
    
    if (effectiveStatus === 'kit_shipped') return { text: "Your kit is on the way", color: "text-[#008085]" };
    if (effectiveStatus === 'preparing') return { text: "Your kit is being prepared", color: "text-gray-400" };
  
    return null;
  };

  const renderShipmentCard = (s: any, isResend = false) => {
    const outboundStatusText: any = {
      pending: 'Being prepared',
      label_created: 'Label created, shipping soon',
      shipped: 'On its way to you',
      delivered: 'Delivered ✓'
    };
  
    const stdReturnText: any = {
      pending: 'Return label being prepared',
      label_created: 'Ready to send — return label in your kit',
      patient_sent: 'You\'ve sent your sample',
      in_transit: 'On its way to the lab',
      delivered: 'Received by lab ✓'
    };
  
    const goloReturnText: any = {
      awaiting_schedule: 'Schedule a pickup for your sample',
      scheduled: `Pickup scheduled for ${s.gologistik_pickup_date ? formatDate(s.gologistik_pickup_date) : ''} (${s.gologistik_pickup_slot})`,
      collected: 'Sample collected ✓',
      in_transit: 'On its way to the lab',
      delivered: 'Received by lab ✓'
    };

    const getStatusDotParams = (ExactStatus: string) => {
      const deliveredArray = ['delivered', 'collected'];
      const activeArray = ['shipped', 'in_transit', 'patient_sent', 'scheduled'];
      if (deliveredArray.includes(ExactStatus)) return 'bg-emerald-500';
      if (activeArray.includes(ExactStatus)) return 'bg-[#008085]';
      return 'bg-gray-300';
    };

    return (
      <React.Fragment key={s.id}>
        {/* Outbound */}
        {s.outbound_status && (
          <div className="bg-white rounded-[12px] border border-gray-200/60 shadow-sm px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="font-heading font-medium text-[15px] text-near-black">Kit Delivery</span>
              </div>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">DHL</span>
            </div>
            <div className="space-y-1.5 mt-1.5">
              <div className="flex items-center gap-2.5 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDotParams(s.outbound_status)}`} />
                <span className="text-[14px] text-gray-700">{outboundStatusText[s.outbound_status] || s.outbound_status}</span>
              </div>
              {s.outbound_tracking_number && (
                <div className="flex items-center gap-2 text-[13px] pt-0.5">
                  <span className="text-gray-500">Tracking:</span>
                  <span className="font-mono text-gray-600">{s.outbound_tracking_number}</span>
                  <a href={`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${s.outbound_tracking_number}`} target="_blank" className="text-[13px] font-medium text-[#008085] hover:text-[#005C5F] inline-flex items-center gap-1 ml-2">Track Package <ExternalLink className="w-3 h-3"/></a>
                </div>
              )}
              {s.laboratory?.name && (
                <div className="text-[12px] text-gray-400 mt-3">{s.laboratory.name}{s.laboratory?.address_city ? `, ${s.laboratory.address_city}` : ''}</div>
              )}
            </div>
          </div>
        )}
  
        {/* Return */}
        <div className="bg-white rounded-[12px] border border-gray-200/60 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-gray-400" />
              <span className="font-heading font-medium text-[15px] text-near-black">Sample Return</span>
            </div>
            {s.shipping_method === 'standard' ? (
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">DHL</span>
            ) : (
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-[#008085]">GoLogistik</span>
            )}
          </div>
          <div className="space-y-1.5 mt-1.5">
            <div className="flex items-center gap-2.5 mt-2">
               <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getStatusDotParams(s.status)}`} />
               <span className="text-[14px] text-gray-700">{s.shipping_method === 'standard' ? stdReturnText[s.status] : goloReturnText[s.status]}</span>
            </div>
            
            {s.shipping_method === 'standard' && s.tracking_number && (
              <div className="flex items-center gap-2 text-[13px] pt-0.5">
                <span className="text-gray-500">Tracking:</span>
                <span className="font-mono text-gray-600">{s.tracking_number}</span>
                <a href={`https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${s.tracking_number}`} target="_blank" className="text-[13px] font-medium text-[#008085] hover:text-[#005C5F] inline-flex items-center gap-1 ml-2">Track Package <ExternalLink className="w-3 h-3"/></a>
              </div>
            )}
  
            {s.shipping_method === 'gologistik' && s.gologistik_hwb && (
              <div className="text-[13px] text-gray-500 pt-0.5">HWB: {s.gologistik_hwb}</div>
            )}
  
            {s.shipping_method === 'standard' && s.status === 'label_created' && (
              <div className="pt-2">
                <button onClick={() => setConfirmModalData({ orderId: s.order_id, shipmentId: s.id })} className="px-5 py-2 rounded-full border border-[#008085] text-[#008085] hover:bg-[#008085]/5 text-[14px] font-medium transition-colors flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>I've Sent My Sample</button>
              </div>
            )}
  
            {s.shipping_method === 'gologistik' && s.status === 'awaiting_schedule' && (
               <div className="pt-2">
                 <button onClick={() => setGologistikModalData({ orderId: s.order_id, shipmentId: s.id })} className="px-5 py-2 rounded-full bg-[#008085] text-white hover:bg-[#005C5F] text-[14px] font-medium transition-colors flex items-center gap-2"><Package className="w-4 h-4"/>Schedule Pickup</button>
               </div>
            )}
          </div>
        </div>
      </React.Fragment>
    );
  };

  const renderOrder = (order: any) => {
    const rec = order.recommendation;
    const testCount = rec?.items?.length || 0;
    const doctor = order.doctor;
    const isExpanded = expandedId === order.id;
    const isCancelled = order.status === 'cancelled';
    const needsPayment = order.status === 'sent' && rec?.billing_mode !== 'doctor';
    
    // Calculate context explicitly for header mapping
    const contextMsg = getContextMessage(order, order.status);
    const shipments = order.shipments || [];
    const originalShipments = shipments.filter((s: any) => !s.resend_id);
    const patientResults = (order.results || []).filter((r: any) =>
      r.status === 'released' && ['doctor_and_patient', 'patient_only'].includes(r.visibility)
    );

    return (
      <div
        key={order.id}
        className={`bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden transition-all duration-200`}
      >
        {/* Summary row */}
        <div
          className={`px-6 py-4 flex items-center gap-4 ${!isCancelled ? 'cursor-pointer hover:bg-gray-50/50' : ''} transition-colors`}
          onClick={() => !isCancelled && setExpandedId(isExpanded ? null : order.id)}
        >
          {/* Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            needsPayment ? 'bg-amber-50' : 'bg-[#008085]/10'
          }`}>
            {needsPayment ? (
              <CreditCard className="w-5 h-5 text-amber-600" />
            ) : (
              <FlaskConical className="w-5 h-5 text-[#008085]" />
            )}
          </div>

          {/* Left: ID + Doctor */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-[13px] text-[#008085] font-semibold">{order.display_id}</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="text-[13px] text-gray-500 truncate mt-0.5">
              {getDoctorDisplay(doctor?.full_name)}
              {doctor?.practice_name && <span className="text-gray-300"> · </span>}
              {doctor?.practice_name && <span className="text-gray-400">{doctor.practice_name}</span>}
            </div>
            {contextMsg && (
              <div className={`text-[11px] font-medium mt-0.5 ${contextMsg.color}`}>{contextMsg.text}</div>
            )}
          </div>

          {/* Right: Tests + Price + Date stacked */}
          <div className="text-right shrink-0 hidden sm:flex items-center gap-4">
            <div>
              {needsPayment ? (
                <a
                  href={`/patient/${(rec?.magic_link || '').split('/').pop()}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#008085] text-white text-[13px] font-semibold hover:bg-[#005C5F] transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Pay Now
                </a>
              ) : (
                <>
                  <div className="font-mono font-semibold text-near-black text-[15px]">
                    {formatCurrency(Number(order.total))}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {testCount} test{testCount !== 1 ? 's' : ''} · {formatDate(order.created_at)}
                  </div>
                </>
              )}
            </div>
            
            {/* Expand chevron on right */}
            {!isCancelled && (
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </div>

          {/* Mobile: price below */}
          <div className="sm:hidden text-right shrink-0 flex items-center gap-3">
            {needsPayment ? (
              <a
                href={`/patient/${(rec?.magic_link || '').split('/').pop()}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#008085] text-white text-[12px] font-semibold"
              >
                Pay
              </a>
            ) : (
              <div className="font-mono font-semibold text-near-black text-[14px]">
                {formatCurrency(Number(order.total))}
              </div>
            )}
            {!isCancelled && (
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && !isCancelled && (
          <div className="border-t border-gray-100">
            {/* Order timeline */}
            <div className="px-6 py-3 bg-gray-50/30">
              <OrderTimeline status={patientResults.length > 0 ? 'results_ready' : order.status} />
              
              {/* Shipment Tracking Layer */}
              {originalShipments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {originalShipments.map((s: any) => renderShipmentCard(s, false))}
                </div>
              )}
            </div>

            {/* Resends Mapping Layer */}
            {order.resends && order.resends.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 space-y-4">
                 {order.resends.map((rs: any) => {
                   const resendShipments = shipments.filter((s:any) => s.resend_id === rs.id);
                   const formattedTests = Array.isArray(rs.failed_tests) 
                      ? rs.failed_tests.map((t:any) => t.name || t.test_name).join(', ') 
                      : 'selected tests';
                   return (
                     <div key={rs.id} className="bg-amber-50 border border-amber-200 rounded-[12px] p-4">
                       <div className="flex items-center gap-2 mb-2">
                         <RefreshCw className="w-4 h-4 text-amber-600" />
                         <span className="font-heading font-medium text-near-black">Replacement Kit</span>
                         <span className="ml-auto inline-flex text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{rs.status}</span>
                       </div>
                       <p className="text-[14px] text-amber-800">
                         A replacement kit is being sent for:{' '}
                         <span className="font-medium">
                           {formattedTests}
                         </span>
                       </p>
                       {rs.reason && (
                         <div className="text-[13px] text-amber-700/70 mb-3 mt-1">
                           Reason: {humanizeResendReason(rs.reason)}
                         </div>
                       )}
                       {resendShipments.length > 0 && (
                         <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                           {resendShipments.map((s:any) => renderShipmentCard(s, true))}
                         </div>
                       )}
                     </div>
                   );
                 })}
              </div>
            )}

            {patientResults.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider">Results</div>
                  <a
                    href="/portal/results"
                    className="text-[12px] font-medium text-[#008085] hover:text-[#005C5F]"
                  >
                    View All →
                  </a>
                </div>

                {/* Progress */}
                {rec?.items && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#008085] rounded-full transition-all"
                        style={{
                          width: `${(() => {
                            const coveredTestNames = new Set<string>();
                            patientResults.forEach((r: any) => {
                              (r.tests_covered || []).forEach((t: any) => {
                                const name = (t.test_name || t.name || '').toLowerCase();
                                if (name) coveredTestNames.add(name);
                              });
                            });
                            const coveredCount = (rec?.items || []).filter((item: any) => {
                              const name = (item.test?.name || item.name || '').toLowerCase();
                              return coveredTestNames.has(name);
                            }).length;
                            return (coveredCount / (rec.items?.length || 1)) * 100;
                          })()}%`
                        }}
                      />
                    </div>
                    <span className="text-[12px] text-gray-400">
                      {(() => {
                        const coveredTestNames = new Set<string>();
                        patientResults.forEach((r: any) => {
                          (r.tests_covered || []).forEach((t: any) => {
                            const name = (t.test_name || t.name || '').toLowerCase();
                            if (name) coveredTestNames.add(name);
                          });
                        });
                        const coveredCount = (rec?.items || []).filter((item: any) => {
                          const name = (item.test?.name || item.name || '').toLowerCase();
                          return coveredTestNames.has(name);
                        }).length;
                        return `${coveredCount}/${rec.items?.length || 0}`;
                      })()}
                    </span>
                  </div>
                )}

                {/* Latest result */}
                <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-[10px]">
                  <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-near-black">
                      Latest: {patientResults[0]?.tests_covered?.map((t: any) => t.test_name || t.name).join(', ') || 'Tests'} — {formatDate(patientResults[0]?.created_at)}
                    </div>
                  </div>
                  <a
                    href="/portal/results"
                    className="text-[13px] font-medium text-[#008085] hover:text-[#005C5F] shrink-0"
                  >
                    View →
                  </a>
                </div>
              </div>
            )}

            {/* Tests list */}
            {rec?.items && (
              <div className="px-6 py-3 border-t border-gray-100 bg-white">
                <div className="text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-2">Tests ordered</div>
                <div className="space-y-1.5">
                  {(rec.items || []).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#008085] shrink-0" />
                        <span className="text-gray-700">{item.test?.name}</span>
                        {item.test?.type === 'profile' && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Profile</span>
                        )}
                      </div>
                      <span className="font-mono text-gray-500 text-[12px]">{formatCurrency(Number(item.unit_price))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order cost breakdown */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
                <div>
                  <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-0.5">Tests</div>
                  <div className="font-mono text-gray-700">{formatCurrency(Number(order.test_costs_total))}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-0.5">Service Fee</div>
                  <div className="font-mono text-gray-700">{formatCurrency(Number(order.service_fee_amount))}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-0.5">Shipping</div>
                  <div className="font-mono text-gray-700">{formatCurrency(Number(order.shipping_cost))}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-[11px] uppercase tracking-wider mb-0.5">Total</div>
                  <div className="font-mono font-semibold text-[#008085]">{formatCurrency(Number(order.total))}</div>
                </div>
              </div>

              {/* Legacy Tracking hook left inside payment for context alignment when outbounds fail */}
              {!originalShipments.length && order.dhl_tracking_outbound && !order.dhl_tracking_outbound.startsWith('MOCK') && (
                <div className="mt-3 p-2.5 bg-white rounded-[10px] border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider">Tracking</div>
                    <div className="font-mono text-[13px] text-gray-700">{order.dhl_tracking_outbound}</div>
                  </div>
                  <a
                    href={`https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${order.dhl_tracking_outbound}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#008085] text-[12px] font-medium hover:underline flex items-center gap-1"
                  >
                    Track <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Payment info */}
              <div className="mt-2 text-[12px] text-gray-400">
                {order.payment_method === 'doctor_invoice'
                  ? 'Billed to your doctor'
                  : `Paid via ${order.payment_method || 'N/A'}`
                }
              </div>
            </div>

            {/* Appointment info */}
            {rec?.expected_appointment_date && (
              <div className="px-6 py-3 border-t border-gray-100 text-[13px] text-gray-500">
                Expected appointment: <span className="font-medium text-gray-700">{formatDate(rec.expected_appointment_date)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <ConfirmModal isOpen={!!confirmModalData} onClose={() => setConfirmModalData(null)} onConfirm={handleConfirmSend} />
      <GoLogistikModal isOpen={!!gologistikModalData} onClose={() => setGologistikModalData(null)} onSubmit={handleScheduleGoLogistik} />

      <div>
        <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight mb-1" style={{ textTransform: 'none' }}>
          Welcome back, {patient?.first_name || 'there'}
        </h1>
        <p className="text-gray-500 text-[14px] mb-8">Your lab tests and orders.</p>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
            <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-[14px]">No test orders yet.</p>
            <p className="text-gray-400 text-[13px] mt-1">When your doctor recommends lab tests, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map(renderOrder)}

            {cancelledOrders.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowCancelled(!showCancelled)}
                  className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors mb-3"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showCancelled ? 'rotate-90' : ''}`} />
                  {cancelledOrders.length} cancelled order{cancelledOrders.length > 1 ? 's' : ''}
                </button>
                {showCancelled && (
                  <div className="space-y-3 opacity-60">
                    {cancelledOrders.map(renderOrder)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
