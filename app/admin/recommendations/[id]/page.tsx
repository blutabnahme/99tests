/* eslint-disable */
"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, ClipboardList, User, Stethoscope, ShoppingCart,
  Package, FileText, Mail, Phone, MapPin, Calendar, ExternalLink,
  XCircle, Copy, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatCurrency(n: number): string {
  return `€${n.toFixed(2)}`;
}

function PipelineDotsIndicator({ status }: { status: any }) {
  if (!status || typeof status !== 'object') return null;
  const steps = ['materials', 'anamnese_pdf', 'ldt_file', 'pad_pvs', 'dhl_label'];
  return (
    <div className="flex items-center gap-1">
      {steps.map(step => {
        const s = status[step];
        const color = s?.status === 'completed' ? 'bg-green-500' : s?.status === 'failed' ? 'bg-red-500' : s?.status === 'skipped' ? 'bg-yellow-400' : 'bg-gray-200';
        return <div key={step} className={`w-2 h-2 rounded-full ${color}`} title={`${step}: ${s?.status || 'pending'}`} />;
      })}
    </div>
  );
}

export default function RecommendationDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/recommendations/${params.id}`);
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this recommendation? This cannot be undone.')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/recommendations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (!res.ok) throw new Error('Failed to cancel');
      await fetchData();
    } catch (err: any) { alert(err.message); }
    finally { setCancelling(false); }
  };

  const copyMagicLink = () => {
    if (data?.recommendation?.magic_link) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const url = `${baseUrl}/patient/${data.recommendation.magic_link}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error || !data) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/recommendations" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary"><ArrowLeft className="w-4 h-4" /> Back to Recommendations</Link>
      <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error || 'Not found'}</div>
    </div>
  );

  const rec = data.recommendation;
  const items = data.items || [];
  const order = data.order;
  const computed = data.computed;
  const canCancel = rec.status !== 'cancelled' && rec.status !== 'paid';

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
      <Link href="/admin/recommendations" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Recommendations
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>
              Recommendation {rec.display_id}
            </h1>
            <StatusBadge status={rec.status} />
          </div>
          <p className="text-gray-500 text-[14px]">
            Created {formatDate(rec.created_at)}
            {rec.sent_at && <> · Sent {formatDate(rec.sent_at)}</>}
            {rec.paid_at && <> · Paid {formatDate(rec.paid_at)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rec.magic_link && (
            <Button variant="secondary" onClick={copyMagicLink} className="rounded-full text-[13px] h-9 px-4">
              {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-500" /> : <Copy className="w-4 h-4 mr-1.5" />}
              {copied ? 'Copied!' : 'Copy Patient Link'}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} disabled={cancelling} className="rounded-full text-[13px] h-9 px-4">
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Test Items */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Tests ({items.length})</h2>
              <div className="text-[14px] font-mono font-medium text-gray-700">{formatCurrency(computed.test_total)}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map((item: any) => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-[14px] font-medium text-gray-800">{item.test?.name || 'Unknown Test'}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[12px] font-mono text-gray-500">{item.test?.sku}</span>
                      {item.test?.goae_digit && (
                        <><span className="text-gray-300">·</span><span className="text-[12px] text-gray-500">GoÄ {item.test.goae_digit}</span></>
                      )}
                      {item.test?.lab?.name && (
                        <><span className="text-gray-300">·</span><span className="text-[12px] text-gray-500">{item.test.lab.name}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-mono text-gray-700">{formatCurrency(Number(item.unit_price) || 0)}</div>
                    {item.quantity > 1 && <div className="text-[11px] text-gray-400">×{item.quantity}</div>}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-[14px]">No tests in this recommendation</div>
              )}
            </div>
          </div>

          {/* Order (if linked) */}
          {order && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Linked Order</h2>
                <Link href={`/admin/orders/${order.id}`} className="text-[13px] text-primary font-medium hover:underline flex items-center gap-1">
                  View Order <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[14px]">
                <div>
                  <div className="text-gray-500 text-[12px] mb-0.5">Order ID</div>
                  <div className="font-mono text-primary font-semibold">{order.display_id}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[12px] mb-0.5">Status</div>
                  <StatusBadge status={order.status} />
                </div>
                <div>
                  <div className="text-gray-500 text-[12px] mb-0.5">Total</div>
                  <div className="font-mono text-gray-700">{formatCurrency(Number(order.total) || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[12px] mb-0.5">Pipeline</div>
                  <PipelineDotsIndicator status={order.preparation_status} />
                </div>
              </div>
              {(order.dhl_tracking_outbound || order.dhl_tracking_return) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-4 text-[13px]">
                  {order.dhl_tracking_outbound && <div><span className="text-gray-500">Outbound:</span> <span className="font-mono text-gray-700">{order.dhl_tracking_outbound}</span></div>}
                  {order.dhl_tracking_return && <div><span className="text-gray-500">Return:</span> <span className="font-mono text-gray-700">{order.dhl_tracking_return}</span></div>}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {(rec.anamnese_notes || rec.internal_notes) && (
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Notes</h2>
              {rec.anamnese_notes && (
                <div>
                  <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Anamnese</div>
                  <p className="text-[14px] text-gray-600 whitespace-pre-wrap">{rec.anamnese_notes}</p>
                </div>
              )}
              {rec.internal_notes && (
                <div>
                  <div className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Internal Notes</div>
                  <p className="text-[14px] text-gray-600 whitespace-pre-wrap">{rec.internal_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — 1/3 */}
        <div className="space-y-6">

          {/* Patient */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Patient</div>
            </h2>
            <div className="space-y-2 text-[14px]">
              <div className="font-medium text-gray-800">{rec.patient?.first_name} {rec.patient?.last_name}</div>
              {rec.patient?.email && (
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${rec.patient.email}`} className="text-primary hover:underline text-[13px]">{rec.patient.email}</a></div>
              )}
              {rec.patient?.phone && (
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /><a href={`tel:${rec.patient.phone}`} className="text-primary hover:underline text-[13px]">{rec.patient.phone}</a></div>
              )}
              {rec.patient?.date_of_birth && (
                <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-600 text-[13px]">{rec.patient.date_of_birth.substring(0, 10)}</span></div>
              )}
              {rec.patient?.insured_status && (
                <div className="text-[13px] text-gray-600 capitalize">{rec.patient.insured_status.replace(/_/g, ' ')}</div>
              )}
              <Link href={`/admin/users/patients/${rec.patient?.id}`} className="text-[12px] text-primary hover:underline mt-2 inline-block">View Patient →</Link>
            </div>
          </div>

          {/* Doctor */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>
              <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-gray-400" /> Doctor</div>
            </h2>
            <div className="space-y-2 text-[14px]">
              <div className="font-medium text-gray-800">{rec.doctor?.full_name}</div>
              {rec.doctor?.practice_name && <div className="text-[13px] text-gray-600">{rec.doctor.practice_name}</div>}
              {rec.doctor?.email && (
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gray-400" /><a href={`mailto:${rec.doctor.email}`} className="text-primary hover:underline text-[13px]">{rec.doctor.email}</a></div>
              )}
              <Link href={`/admin/users/doctors/${rec.doctor?.id}`} className="text-[12px] text-primary hover:underline mt-2 inline-block">View Doctor →</Link>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
            <h2 className="font-heading font-medium text-[16px] text-near-black mb-4" style={{ textTransform: 'none' }}>Details</h2>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between"><span className="text-gray-500">Collection</span><span className="text-gray-700 capitalize">{rec.collection_preference?.replace(/_/g, ' ') || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Results Delivery</span><span className="text-gray-700 capitalize">{rec.results_delivery?.replace(/_/g, ' ') || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pricing Tier</span><span className="text-gray-700 capitalize">{rec.pricing_tier?.replace(/_/g, ' ') || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Labs</span><span className="text-gray-700">{computed.labs.join(', ') || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Test Total</span><span className="font-mono text-gray-700">{formatCurrency(computed.test_total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
