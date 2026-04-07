"use client";

import React, { useState, useEffect } from 'react';
import {
  ClipboardList, ChevronDown, ChevronRight, FlaskConical,
  Package, Truck, Clock, CheckCircle2, CreditCard, ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { usePatient } from '@/lib/patient-context';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatCurrency(n: number): string {
  return `€${Number(n || 0).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
    awaiting_payment: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Awaiting Payment' },
    sent: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Awaiting Payment' },
    paid: { bg: 'bg-green-50', text: 'text-green-700', label: 'Paid' },
    preparing: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Preparing' },
    kit_shipped: { bg: 'bg-teal-50', text: 'text-teal-700', label: 'Kit Shipped' },
    collecting: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Collecting' },
    at_lab: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'At Lab' },
    results_ready: { bg: 'bg-green-50', text: 'text-green-700', label: 'Results Ready' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completed' },
    cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Cancelled' },
  };
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

const TIMELINE_STEPS = [
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'kit_shipped', label: 'Shipped', icon: Truck },
  { key: 'collecting', label: 'Collecting', icon: Clock },
  { key: 'at_lab', label: 'At Lab', icon: FlaskConical },
  { key: 'results_ready', label: 'Results', icon: CheckCircle2 },
];

function OrderTimeline({ status }: { status: string }) {
  const statusOrder = ['preparing', 'kit_shipped', 'collecting', 'at_lab', 'results_ready', 'completed'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-1 py-2">
      {TIMELINE_STEPS.map((step, i) => {
        const isComplete = currentIdx > i || status === 'completed';
        const isCurrent = statusOrder[currentIdx] === step.key;
        const Icon = step.icon;

        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div className={`flex-1 h-[2px] ${isComplete ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-primary text-white' :
                isCurrent ? 'bg-primary/10 text-primary border border-primary' :
                'bg-gray-100 text-gray-400'
              }`}>
                <Icon className="w-3 h-3" />
              </div>
              <span className={`text-[9px] font-medium ${
                isComplete || isCurrent ? 'text-primary' : 'text-gray-400'
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

export default function PortalHomePage() {
  const { patient } = usePatient();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch('/api/portal/data?section=tests');
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchTests();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="md" /></div>;

  return (
    <div>
      <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight mb-1" style={{ textTransform: 'none' }}>
        Welcome back, {patient?.first_name || 'there'}
      </h1>
      <p className="text-gray-500 text-[14px] mb-8">Your lab tests and orders.</p>

      {recommendations.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No test recommendations yet.</p>
          <p className="text-gray-400 text-[13px] mt-1">When your doctor recommends lab tests, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec: any) => {
            const testCount = rec.items?.length || 0;
            const doctor = rec.doctor;
            const order = rec.order;
            const isExpanded = expandedId === rec.id;
            const isCancelled = rec.status === 'cancelled';
            const needsPayment = rec.status === 'sent' && rec.billing_mode !== 'doctor';
            const effectiveStatus = order ? order.status : rec.status;

            return (
              <div
                key={rec.id}
                className={`bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden transition-all duration-200 ${
                  isCancelled ? 'opacity-50' : ''
                }`}
              >
                {/* Summary row */}
                <div
                  className={`px-6 py-4 flex items-center gap-4 ${!isCancelled ? 'cursor-pointer hover:bg-gray-50/50' : ''} transition-colors`}
                  onClick={() => !isCancelled && setExpandedId(isExpanded ? null : rec.id)}
                >
                  {/* Expand icon */}
                  {!isCancelled ? (
                    isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  ) : <div className="w-4 shrink-0" />}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    needsPayment ? 'bg-amber-50' : 'bg-primary/10'
                  }`}>
                    {needsPayment ? (
                      <CreditCard className="w-5 h-5 text-amber-600" />
                    ) : (
                      <FlaskConical className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Left: ID + Doctor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[13px] text-primary font-semibold">{rec.display_id}</span>
                      <StatusBadge status={effectiveStatus} />
                    </div>
                    <div className="text-[13px] text-gray-500 truncate">
                      {doctor?.full_name || 'Doctor'}
                      {doctor?.practice_name && <span className="text-gray-300"> · </span>}
                      {doctor?.practice_name && <span className="text-gray-400">{doctor.practice_name}</span>}
                    </div>
                  </div>

                  {/* Right: Tests + Price + Date stacked */}
                  <div className="text-right shrink-0 hidden sm:block">
                    {needsPayment ? (
                      <a
                        href={`/patient/${(rec.magic_link || '').split('/').pop()}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-[#005C5F] transition-colors"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Now
                      </a>
                    ) : (
                      <>
                        <div className="font-mono font-semibold text-near-black text-[15px]">
                          {order ? formatCurrency(Number(order.total)) : ''}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {testCount} test{testCount !== 1 ? 's' : ''} · {formatDate(rec.created_at)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Mobile: price below */}
                  <div className="sm:hidden text-right shrink-0">
                    {needsPayment ? (
                      <a
                        href={`/patient/${(rec.magic_link || '').split('/').pop()}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-[12px] font-semibold"
                      >
                        Pay
                      </a>
                    ) : order ? (
                      <div className="font-mono font-semibold text-near-black text-[14px]">
                        {formatCurrency(Number(order.total))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && !isCancelled && (
                  <div className="border-t border-gray-100">
                    {/* Order timeline */}
                    {order && (
                      <div className="px-6 py-3 bg-gray-50/30">
                        <OrderTimeline status={order.status} />
                      </div>
                    )}

                    {/* Tests list */}
                    <div className="px-6 py-4">
                      <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Tests ordered</div>
                      <div className="space-y-1.5">
                        {(rec.items || []).map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
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

                    {/* Order cost breakdown */}
                    {order && (
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
                            <div className="font-mono font-semibold text-primary">{formatCurrency(Number(order.total))}</div>
                          </div>
                        </div>

                        {/* Tracking */}
                        {order.dhl_tracking_outbound && !order.dhl_tracking_outbound.startsWith('MOCK') && (
                          <div className="mt-3 p-2.5 bg-white rounded-[10px] border border-gray-100 flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-gray-400 uppercase tracking-wider">Tracking</div>
                              <div className="font-mono text-[13px] text-gray-700">{order.dhl_tracking_outbound}</div>
                            </div>
                            <a
                              href={`https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode=${order.dhl_tracking_outbound}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary text-[12px] font-medium hover:underline flex items-center gap-1"
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
                          {order.shipped_at && ` · Shipped ${formatDate(order.shipped_at)}`}
                        </div>
                      </div>
                    )}

                    {/* Appointment info */}
                    {rec.expected_appointment_date && (
                      <div className="px-6 py-3 border-t border-gray-100 text-[13px] text-gray-500">
                        Expected appointment: <span className="font-medium text-gray-700">{formatDate(rec.expected_appointment_date)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
