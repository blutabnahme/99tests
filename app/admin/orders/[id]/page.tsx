"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, CheckCircle2, Clock, AlertCircle, XCircle,
  Package, FileText, FileCode, Receipt, Truck,
  Download, RefreshCw, User, Stethoscope, CreditCard, MapPin,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TubeColorDot } from '@/components/admin/TubeColorDot';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = { credit_card: 'Credit Card', card: 'Credit Card', sepa: 'SEPA', bank_transfer: 'Bank Transfer' };
  return map[method] || method || '-';
}

// Pipeline step display config
const PIPELINE_STEPS = [
  { key: 'materials', label: 'Materials', icon: Package, description: 'Kit contents calculated' },
  { key: 'anamnese_pdf', label: 'Anamnese PDF', icon: FileText, description: 'Lab order forms generated' },
  { key: 'ldt_file', label: 'LDT File', icon: FileCode, description: 'Lab transfer file generated' },
  { key: 'pad_pvs', label: 'PVS/PAD', icon: Receipt, description: 'Billing snapshot captured' },
  { key: 'dhl_label', label: 'DHL Label', icon: Truck, description: 'Shipping label created' },
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
  const [rerunningPipeline, setRerunningPipeline] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

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

  useEffect(() => { fetchOrder(); }, [params.id]);

  const handleConfirmPayment = async () => {
    if (!confirm('Confirm bank transfer payment for this order? This will trigger the preparation pipeline.')) return;
    setConfirmingPayment(true);
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
      await fetchOrder(); // Refresh order data to show updated pipeline status
    } catch (err: any) {
      alert('Pipeline error: ' + err.message);
    } finally {
      setRerunningPipeline(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/admin/orders" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  const prepStatus = order.preparation_status || {};
  const isAwaitingPayment = order.status === 'awaiting_payment';
  const isBankTransfer = order.payment_method === 'bank_transfer';

  // Group materials by lab
  const materialsByLab = new Map<string, any[]>();
  (order.calculated_materials || []).forEach((m: any) => {
    const labName = m.laboratory?.name || 'Unknown Lab';
    if (!materialsByLab.has(labName)) materialsByLab.set(labName, []);
    materialsByLab.get(labName)!.push(m);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
      {/* Back link */}
      <Link href="/admin/orders" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
              Order {order.display_id || order.id?.substring(0, 8)}
            </h1>
            <StatusBadge status={order.status || 'preparing'} />
          </div>
          <p className="text-gray-500 text-[14px]">
            Created {formatDate(order.created_at)}
            {order.recommendation?.display_id && (
              <> · Recommendation <Link href={`/admin/recommendations/${order.recommendation_id}`} className="text-primary hover:underline">{order.recommendation.display_id}</Link></>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAwaitingPayment && isBankTransfer && (
            <Button
              variant="primary"
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
              className="rounded-full"
            >
              {confirmingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Payment
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN — 2/3 width */}
        <div className="lg:col-span-2 space-y-6">

          {/* Preparation Pipeline */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-medium text-[16px] text-near-black">Preparation Pipeline</h2>
              <button
                onClick={handleRerunPipeline}
                disabled={rerunningPipeline}
                className="text-[13px] text-gray-500 hover:text-primary flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rerunningPipeline ? 'animate-spin' : ''}`} />
                Re-run
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {PIPELINE_STEPS.map(step => {
                  const s = prepStatus[step.key];
                  const StepIcon = step.icon;
                  return (
                    <div key={step.key} className="border border-gray-100 rounded-[8px] overflow-hidden bg-white hover:border-gray-300 transition-colors">
                      <div 
                        onClick={() => toggleStep(step.key)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <StepIcon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-medium text-[14px] text-near-black">{step.label}</span>
                            <StepStatusIcon status={s?.status || 'pending'} />
                          </div>
                          <p className="text-[12px] text-gray-400 truncate flex items-center gap-2">
                            <span>
                              {s?.status === 'completed' && s.completed_at ? `Completed ${formatDate(s.completed_at)}` :
                               s?.status === 'failed' ? `Failed: ${s.error || 'Unknown error'}` :
                               s?.status === 'skipped' ? `Skipped: ${s.note || ''}` :
                               step.description}
                            </span>
                            {step.key === 'materials' && s?.material_count != null && (
                              <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">{s.material_count} material(s)</span>
                            )}
                            {step.key === 'anamnese_pdf' && s?.file_count != null && (
                              <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">{s.file_count} PDF(s)</span>
                            )}
                            {step.key === 'dhl_label' && s?.mock && (
                              <span className="text-[11px] text-amber-500 font-medium border-l border-gray-200 pl-2">Mock tracking</span>
                            )}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                          {expandedSteps[step.key]
                            ? <ChevronDown className="w-4 h-4 text-gray-300" />
                            : <ChevronRight className="w-4 h-4 text-gray-300" />
                          }
                        </div>
                      </div>
                      
                      {expandedSteps[step.key] && s && (
                        <div className="px-4 pb-3 border-t border-gray-100">
                          <div className="bg-gray-50 rounded-[8px] p-3 mt-2 font-mono text-[12px] text-gray-600 space-y-1.5">
                            {s.status && (
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-400 flex-shrink-0">status</span>
                                <span className={s.status === 'completed' ? 'text-green-600' : s.status === 'failed' ? 'text-red-500' : 'text-gray-500'}>
                                  {s.status}
                                </span>
                              </div>
                            )}
                            {s.attempted_at && (
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-400 flex-shrink-0">attempted</span>
                                <span>{new Date(s.attempted_at).toLocaleString('de-DE')}</span>
                              </div>
                            )}
                            {s.completed_at && (
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-400 flex-shrink-0">completed</span>
                                <span>{new Date(s.completed_at).toLocaleString('de-DE')}</span>
                              </div>
                            )}
                            {s.error && (
                              <div className="flex justify-between gap-2">
                                <span className="text-gray-400 flex-shrink-0">error</span>
                                <span className="text-red-500 text-right">{s.error}</span>
                              </div>
                            )}
                            {Object.entries(s)
                              .filter(([k]) => !['status', 'attempted_at', 'completed_at', 'error'].includes(k))
                              .map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-2">
                                  <span className="text-gray-400 flex-shrink-0">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-right break-all max-w-[70%]">
                                    {Array.isArray(value)
                                      ? value.join(', ')
                                      : typeof value === 'object'
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Downloadable Files */}
          {(order.anamnese_pdf_urls?.length > 0 || order.ldt_file_url) && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-heading font-medium text-[16px] text-near-black">Generated Files</h2>
              </div>
              <div className="p-6 space-y-3">
                {order.anamnese_pdf_urls?.map((pdf: any, i: number) => (
                  <a
                    key={i}
                    href={pdf.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-near-black">Anamnese PDF</div>
                      <div className="text-[12px] text-gray-500 truncate">{pdf.lab_name}</div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 shrink-0" />
                  </a>
                ))}

                {order.ldt_file_url && (
                  <a
                    href={order.ldt_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-[12px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium text-near-black">LDT File</div>
                      <div className="text-[12px] text-gray-500">Lab data transfer</div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Packing List (Materials) */}
          {materialsByLab.size > 0 && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-heading font-medium text-[16px] text-near-black">Packing List</h2>
              </div>
              <div className="p-6 space-y-6">
                {Array.from(materialsByLab.entries()).map(([labName, mats]) => (
                  <div key={labName}>
                    <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{labName}</h3>
                    <div className="space-y-2">
                      {mats.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 p-3 rounded-[12px] bg-gray-50 border border-gray-100">
                          {m.material?.tube_color && <TubeColorDot color={m.material.tube_color} />}
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-medium text-near-black">
                              {m.material?.name || 'Unknown Material'}
                              <span className="text-[12px] text-gray-500 font-mono ml-2">({m.material?.code})</span>
                            </div>
                            {m.source_tests && Array.isArray(m.source_tests) && (
                              <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                                Tests: {m.source_tests.map((t: any) => t.test_name).join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {m.measurement_type === 'volume' ? (
                              <div>
                                <div className="text-[14px] font-mono font-medium text-near-black">
                                  {m.calculated_tube_count != null ? `${m.calculated_tube_count} tube${m.calculated_tube_count !== 1 ? 's' : ''}` : '-'}
                                </div>
                                <div className="text-[11px] text-gray-400">
                                  {m.total_required_volume != null ? `${m.total_required_volume} ${m.volume_unit || 'ml'}` : ''} 
                                  {m.tube_capacity != null ? ` / ${m.tube_capacity} ${m.volume_unit || 'ml'} cap.` : ''}
                                </div>
                              </div>
                            ) : (
                              <div className="text-[14px] font-mono font-medium text-near-black">
                                {m.total_quantity != null ? `×${m.total_quantity}` : '-'}
                              </div>
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

          {/* Order Items (Tests) */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-heading font-medium text-[16px] text-near-black">Ordered Tests</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium text-near-black">{item.test?.name || 'Unknown'}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] font-mono text-gray-500">{item.test?.sku}</span>
                      {item.test?.lab?.name && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[12px] text-gray-500">{item.test.lab.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-[14px] font-mono text-gray-900">
                    €{(Number(item.unit_price) || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN — 1/3 width */}
        <div className="space-y-6">

          {/* Pricing Breakdown */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4">Pricing</h2>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Test costs</span>
                <span className="font-mono">€{(Number(order.test_costs_total) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Service fee ({order.service_fee_pct}%)</span>
                <span className="font-mono">€{(Number(order.service_fee_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping ({order.shipping_method})</span>
                <span className="font-mono">€{(Number(order.shipping_cost) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 mt-2">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-mono">€{(Number(order.subtotal) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VAT ({order.vat_rate}%)</span>
                <span className="font-mono">€{(Number(order.vat_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-2 font-semibold">
                <span className="text-near-black">Total</span>
                <span className="font-mono text-primary">€{(Number(order.total) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" /> Payment
            </h2>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{formatPaymentMethod(order.payment_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <StatusBadge status={order.status} />
              </div>
              {order.payment_confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Confirmed</span>
                  <span className="text-[13px]">{formatDate(order.payment_confirmed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {(order.dhl_tracking_outbound || order.dhl_tracking_return) && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-gray-400" /> Shipping
              </h2>
              <div className="space-y-2 text-[14px]">
                {order.dhl_tracking_outbound && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Outbound</span>
                    <span className="font-mono text-[13px]">{order.dhl_tracking_outbound}</span>
                  </div>
                )}
                {order.dhl_tracking_return && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Return</span>
                    <span className="font-mono text-[13px]">{order.dhl_tracking_return}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Patient
            </h2>
            <div className="space-y-1.5 text-[14px]">
              <div className="font-medium text-near-black">{order.patient?.first_name} {order.patient?.last_name}</div>
              {order.patient?.email && <div className="text-gray-500">{order.patient.email}</div>}
              {order.patient?.phone && <div className="text-gray-500">{order.patient.phone}</div>}
              {order.patient?.date_of_birth && <div className="text-gray-500">DOB: {order.patient.date_of_birth?.substring(0, 10)}</div>}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
              <h2 className="font-heading font-medium text-[16px] text-near-black mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" /> Shipping Address
              </h2>
              <div className="text-[14px] text-gray-600 leading-relaxed">
                {order.shipping_address.line1 && <div>{order.shipping_address.line1}</div>}
                {order.shipping_address.line2 && <div>{order.shipping_address.line2}</div>}
                <div>{order.shipping_address.zip} {order.shipping_address.city}</div>
                {order.shipping_address.country && order.shipping_address.country !== 'DE' && (
                  <div>{order.shipping_address.country}</div>
                )}
              </div>
            </div>
          )}

          {/* Doctor Info */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-gray-400" /> Doctor
            </h2>
            <div className="space-y-1.5 text-[14px]">
              <div className="font-medium text-near-black">{order.doctor?.full_name || '-'}</div>
              {order.doctor?.practice_name && <div className="text-gray-500">{order.doctor.practice_name}</div>}
              {order.doctor?.email && <div className="text-gray-500">{order.doctor.email}</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
