"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, User, Mail, Phone, MapPin, Calendar,
  ClipboardList, ShoppingCart, TrendingUp, Stethoscope, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import UserActionsDropdown from '@/components/admin/UserActionsDropdown';
import PatientEditModal from '@/components/admin/PatientEditModal';

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function formatCurrency(n: number): string {
  return `€${n.toFixed(2)}`;
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="bg-white rounded-[12px] border border-gray-200 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <div className="text-[20px] font-semibold text-near-black tracking-tight">{value}</div>
        <div className="text-[13px] text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'recommendations'>('profile');
  const [editing, setEditing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/users/patients/${params.id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setError('Patient not found');
      }
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (error || !data) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/users" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary"><ArrowLeft className="w-4 h-4" /> Back to Users</Link>
      <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error || 'Not found'}</div>
    </div>
  );

  const pat = data.patient;
  const stats = data.stats;

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'recommendations' as const, label: `Recommendations & Orders (${stats.total_recommendations})`, icon: ClipboardList },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
      {/* Back */}
      <Link href="/admin/users" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>
                {pat.first_name} {pat.last_name}
              </h1>
              {pat.is_minor && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">MINOR</span>}
            </div>
            <div className="text-[14px] text-gray-500 mt-0.5">
              Patient of {pat.doctor?.full_name || 'Unknown Doctor'} · Registered {formatDate(pat.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)} className="rounded-full text-[13px] h-9 px-4">Edit Profile</Button>
          <UserActionsDropdown user={pat} type="patient" onEdit={() => setEditing(true)} onActionComplete={fetchData} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard icon={ClipboardList} value={String(stats.total_recommendations)} label="Recommendations" />
        <StatCard icon={ShoppingCart} value={String(stats.total_orders)} label="Orders" />
        <StatCard icon={TrendingUp} value={formatCurrency(stats.total_spent)} label="Total Spent" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Personal Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[14px]"><Mail className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-gray-700">{pat.email || '-'}</span></div>
              <div className="flex items-center gap-3 text-[14px]"><Phone className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-gray-700">{pat.phone || '-'}</span></div>
              <div className="flex items-center gap-3 text-[14px]"><Calendar className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-gray-700">DOB: {formatDate(pat.date_of_birth)}</span></div>
              <div className="flex items-center gap-3 text-[14px]"><User className="w-4 h-4 text-gray-400 shrink-0" /><span className="text-gray-700">Gender: {pat.gender === 'W' ? 'Female' : pat.gender === 'D' ? 'Diverse' : 'Male'}</span></div>
              <div className="flex items-center gap-3 text-[14px]">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">
                  {[pat.address_line1, `${pat.address_zip || ''} ${pat.address_city || ''}`.trim(), pat.address_country].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Medical & Doctor Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-3">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Insurance & Medical</h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Insurance Status</span>
                  <span className="font-medium capitalize">{pat.insured_status?.replace(/_/g, ' ') || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Minor</span>
                  <span className={pat.is_minor ? 'text-amber-600 font-medium' : 'text-gray-700'}>{pat.is_minor ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-3">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Referring Doctor</h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name</span>
                  {pat.doctor ? (
                    <Link href={`/admin/users/doctors/${pat.doctor.id}`} className="text-primary font-medium hover:underline">{pat.doctor.full_name}</Link>
                  ) : (
                    <span className="text-gray-700">-</span>
                  )}
                </div>
                {pat.doctor?.practice_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Practice</span>
                    <span>{pat.doctor.practice_name}</span>
                  </div>
                )}
                {pat.doctor?.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-700">{pat.doctor.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS & ORDERS TAB */}
      {activeTab === 'recommendations' && (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
          {/* Recommendations */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Tests</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.recommendations || []).map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/recommendations/${rec.id}`}>
                    <td className="px-6 py-4 font-mono text-[13px] text-primary font-semibold">{rec.display_id}</td>
                    <td className="px-6 py-4 text-gray-600">{rec.doctor?.full_name || '-'}</td>
                    <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                    <td className="px-6 py-4"><span className="text-[13px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{rec.item_count}</span></td>
                    <td className="px-6 py-4 font-mono text-gray-900">{rec.test_total > 0 ? formatCurrency(rec.test_total) : '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(rec.created_at)}</td>
                  </tr>
                ))}
                {(data.recommendations || []).length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />No recommendations</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Orders */}
          {(data.orders || []).length > 0 && (
            <>
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <h3 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Orders ({data.orders.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] whitespace-nowrap">
                  <thead className="bg-gray-50/30 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Order</th>
                      <th className="px-6 py-3">Rec</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Payment</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.orders || []).map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/orders/${order.id}`}>
                        <td className="px-6 py-3 font-mono text-[13px] text-primary font-semibold">{order.display_id}</td>
                        <td className="px-6 py-3 font-mono text-[12px] text-gray-500">{order.recommendation?.display_id || '-'}</td>
                        <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-6 py-3 font-mono text-gray-900">{formatCurrency(Number(order.total) || 0)}</td>
                        <td className="px-6 py-3 text-gray-500 text-[13px] capitalize">{order.payment_method?.replace(/_/g, ' ') || '-'}</td>
                        <td className="px-6 py-3 text-gray-500 text-[13px]">{formatDate(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && <PatientEditModal patient={pat} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); fetchData(); }} />}
    </div>
  );
}
