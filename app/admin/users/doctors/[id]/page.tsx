"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, User, Mail, Phone, Building2, MapPin, FileText,
  ClipboardList, ShoppingCart, Users, TrendingUp, Clock, Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import UserActionsDropdown from '@/components/admin/UserActionsDropdown';
import DoctorEditModal from '@/components/admin/DoctorEditModal';

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

export default function DoctorDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'recommendations' | 'patients' | 'activity'>('profile');
  const [editing, setEditing] = useState(false);

  const [recSearch, setRecSearch] = useState('');
  const [recStatus, setRecStatus] = useState('all');
  const [recHasOrder, setRecHasOrder] = useState('all');
  const [recSort, setRecSort] = useState<{column: string, direction: 'asc'|'desc'}>({column: 'created', direction: 'desc'});
  const [patSearch, setPatSearch] = useState('');
  const [patSort, setPatSort] = useState<{column: string, direction: 'asc'|'desc'}>({column: 'created', direction: 'desc'});

  const REC_STATUSES = [
    { value: 'all', label: 'All Statuses' },
    { value: 'created', label: 'Created' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'expired', label: 'Expired' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const HAS_ORDER_OPTIONS = [
    { value: 'all', label: 'All Orders' },
    { value: 'yes', label: 'Has Order' },
    { value: 'no', label: 'No Order' }
  ];

  const selectClasses = "w-full min-w-[140px] px-3 pr-8 h-9 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] text-gray-700 bg-white appearance-none cursor-pointer";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' };

  function SortableHeader({ label, sortKey, currentSort, onSort }: { label: string, sortKey: string, currentSort: any, onSort: any }) {
    const isSorted = currentSort.column === sortKey;
    const isAsc = currentSort.direction === 'asc';
    return (
      <th 
        className="px-6 py-4 cursor-pointer select-none group"
        onClick={() => {
          if (isSorted) onSort({ column: sortKey, direction: isAsc ? 'desc' : 'asc' });
          else onSort({ column: sortKey, direction: 'desc' });
        }}
      >
        <div className="flex items-center gap-1.5 hover:text-near-black transition-colors">
          {label}
          <div className="flex flex-col opacity-40 group-hover:opacity-100 transition-opacity">
            <svg className={`w-2 h-2 ${isSorted && isAsc ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z"/></svg>
            <svg className={`w-2 h-2 mt-0.5 ${isSorted && !isAsc ? 'text-primary' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4z"/></svg>
          </div>
        </div>
      </th>
    );
  }

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/users/doctors/${params.id}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        setError('Doctor not found');
      }
    } catch (err) {
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [params.id]);

  const filteredRecs = useMemo(() => {
    if (!data?.recommendations) return [];
    let r = [...data.recommendations];
    
    if (recSearch) {
      const q = recSearch.toLowerCase();
      r = r.filter(x => 
        x.display_id?.toLowerCase().includes(q) || 
        x.patient?.first_name?.toLowerCase().includes(q) || 
        x.patient?.last_name?.toLowerCase().includes(q)
      );
    }
    
    if (recStatus !== 'all') r = r.filter(x => x.status === recStatus);
    
    if (recHasOrder !== 'all') {
      const wantOrder = recHasOrder === 'yes';
      r = r.filter(x => wantOrder ? !!x.order : !x.order);
    }
    
    r.sort((a,b) => {
      let valA = 0, valB = 0;
      if (recSort.column === 'created') {valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime();}
      else if (recSort.column === 'total') {valA = Number(a.test_total); valB = Number(b.test_total);}
      else if (recSort.column === 'patient') {valA = a.patient?.last_name || ''; valB = b.patient?.last_name || '';}
      
      if (valA < valB) return recSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return recSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return r;
  }, [data?.recommendations, recSearch, recStatus, recHasOrder, recSort]);

  const filteredPatients = useMemo(() => {
    if (!data?.patients) return [];
    let p = [...data.patients];
    
    if (patSearch) {
      const q = patSearch.toLowerCase();
      p = p.filter(x => 
        x.first_name?.toLowerCase().includes(q) || 
        x.last_name?.toLowerCase().includes(q) ||
        x.email?.toLowerCase().includes(q)
      );
    }
    
    p.sort((a,b) => {
      let valA = 0, valB = 0;
      if (patSort.column === 'created') {valA = new Date(a.created_at).getTime(); valB = new Date(b.created_at).getTime();}
      else if (patSort.column === 'name') {valA = a.last_name || ''; valB = b.last_name || '';}
      
      if (valA < valB) return patSort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return patSort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return p;
  }, [data?.patients, patSearch, patSort]);

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (error || !data) return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/users" className="flex items-center gap-2 text-[14px] text-gray-500 hover:text-primary"><ArrowLeft className="w-4 h-4" /> Back to Users</Link>
      <div className="p-6 bg-red-50 text-red-600 rounded-[16px] text-sm border border-red-100">{error || 'Not found'}</div>
    </div>
  );

  const doc = data.doctor;
  const stats = data.stats;
  const verStatus = doc.verification_status || 'pending';

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'recommendations' as const, label: `Recommendations (${stats.total_recommendations})`, icon: ClipboardList },
    { id: 'patients' as const, label: `Patients (${stats.total_patients})`, icon: Users },
    { id: 'activity' as const, label: 'Activity', icon: Clock },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8">
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
              <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>{doc.full_name}</h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                verStatus === 'verified' ? 'bg-green-50 text-green-600' : verStatus === 'rejected' ? 'bg-red-50 text-red-600' : verStatus === 'suspended' ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-600'
              }`}>{verStatus.charAt(0).toUpperCase() + verStatus.slice(1)}</span>
            </div>
            <div className="text-[14px] text-gray-500 mt-0.5">
              {doc.practice_name}{doc.specialty ? ` · ${doc.specialty}` : ''} · Registered {formatDate(doc.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setEditing(true)} className="rounded-full text-[13px] h-9 px-4">Edit Profile</Button>
          <UserActionsDropdown user={doc} type="doctor" onEdit={() => setEditing(true)} onActionComplete={fetchData} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={ClipboardList} value={String(stats.total_recommendations)} label="Recommendations" />
        <StatCard icon={ShoppingCart} value={String(stats.total_orders)} label="Orders" />
        <StatCard icon={Users} value={String(stats.total_patients)} label="Patients" />
        <StatCard icon={TrendingUp} value={formatCurrency(stats.total_revenue)} label="Revenue" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'
              }`}
            ><Icon className="w-3.5 h-3.5" /> {tab.label}</button>
          );
        })}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[14px]">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                {doc.email ? <a href={`mailto:${doc.email}`} className="text-primary hover:underline">{doc.email}</a> : <span className="text-gray-500">-</span>}
              </div>
              <div className="flex items-center gap-3 text-[14px]">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {doc.phone ? <a href={`tel:${doc.phone}`} className="text-primary hover:underline">{doc.phone}</a> : <span className="text-gray-500">-</span>}
              </div>
              <div className="flex items-center gap-3 text-[14px]">
                <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">{doc.practice_name || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-[14px]">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">License: {doc.license_number || '-'}</span>
              </div>
              <div className="flex items-center gap-3 text-[14px]">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-600">
                  {[doc.address_street, `${doc.address_zip || ''} ${doc.address_city || ''}`.trim(), doc.address_country].filter(Boolean).join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-3">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Verification</h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-gray-700">{verStatus.charAt(0).toUpperCase() + verStatus.slice(1)}</span></div>
                {doc.verified_at && <div className="flex justify-between"><span className="text-gray-500">Verified</span><span className="text-gray-600">{formatDate(doc.verified_at)}</span></div>}
                {doc.rejection_reason && <div className="flex justify-between"><span className="text-gray-500">Reason</span><span className="text-red-600 text-right max-w-[200px]">{doc.rejection_reason}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Active</span><span className={doc.is_active ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{doc.is_active ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6 space-y-3">
              <h2 className="font-heading font-medium text-[16px] text-near-black" style={{ textTransform: 'none' }}>Settings</h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between"><span className="text-gray-500">Service Fee</span><span className="text-gray-700">{doc.custom_service_fee_pct != null ? `${doc.custom_service_fee_pct}% (custom)` : 'Platform default'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Language</span><span className="text-gray-700">{doc.language === 'en' ? 'English' : 'Deutsch'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS TAB */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-3.5 w-3.5 text-gray-400" /></div>
              <input type="text" className="w-full pl-9 pr-3 h-9 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] placeholder:text-gray-400"
                placeholder="Search ID or patient..." value={recSearch} onChange={e => setRecSearch(e.target.value)} />
            </div>
            <select value={recStatus} onChange={e => setRecStatus(e.target.value)} className={selectClasses} style={selectStyle}>
              {REC_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={recHasOrder} onChange={e => setRecHasOrder(e.target.value)} className={selectClasses} style={selectStyle}>
              {HAS_ORDER_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span className="text-[12px] text-gray-400">{filteredRecs.length} results</span>
          </div>

          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <SortableHeader label="Patient" sortKey="patient" currentSort={recSort} onSort={setRecSort} />
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Tests</th>
                    <SortableHeader label="Total" sortKey="total" currentSort={recSort} onSort={setRecSort} />
                    <th className="px-6 py-4">Order</th>
                    <SortableHeader label="Created" sortKey="created" currentSort={recSort} onSort={setRecSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecs.map((rec: any) => (
                    <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/recommendations/${rec.id}`}>
                      <td className="px-6 py-4 font-mono text-[13px] text-primary font-semibold">{rec.display_id}</td>
                      <td className="px-6 py-4 text-gray-700">{rec.patient?.first_name} {rec.patient?.last_name}</td>
                      <td className="px-6 py-4"><StatusBadge status={rec.status} /></td>
                      <td className="px-6 py-4"><span className="text-[13px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{rec.item_count}</span></td>
                      <td className="px-6 py-4 font-mono text-gray-700">{rec.test_total > 0 ? formatCurrency(rec.test_total) : '-'}</td>
                      <td className="px-6 py-4">
                        {rec.order ? (
                          <Link
                            href={`/admin/orders/${rec.order.orderId}`}
                            onClick={e => e.stopPropagation()}
                            className="font-mono text-[12px] text-primary hover:underline font-medium"
                          >
                            {rec.order.orderDisplayId}
                          </Link>
                        ) : (
                          <span className="text-gray-300 text-[12px]">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(rec.created_at)}</td>
                    </tr>
                  ))}
                  {filteredRecs.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400"><ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />No recommendations found</td></tr>
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </div>
      )}

      {/* PATIENTS TAB */}
      {activeTab === 'patients' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-3.5 w-3.5 text-gray-400" /></div>
              <input type="text" className="w-full pl-9 pr-3 h-9 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-[13px] placeholder:text-gray-400"
                placeholder="Search name or email..." value={patSearch} onChange={e => setPatSearch(e.target.value)} />
            </div>
            <span className="text-[12px] text-gray-400">{filteredPatients.length} results</span>
          </div>

          <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] whitespace-nowrap">
                <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                  <tr>
                    <SortableHeader label="Name" sortKey="name" currentSort={patSort} onSort={setPatSort} />
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">DOB</th>
                    <th className="px-6 py-4">Insurance</th>
                    <SortableHeader label="Registered" sortKey="created" currentSort={patSort} onSort={setPatSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPatients.map((pat: any) => (
                    <tr key={pat.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/users/patients/${pat.id}`}>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-800">{pat.first_name} {pat.last_name}</div>
                        {pat.is_minor && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">MINOR</span>}
                      </td>
                      <td className="px-6 py-4 text-[13px]">
                        {pat.email ? <a href={`mailto:${pat.email}`} className="text-primary hover:underline">{pat.email}</a> : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 text-[13px]">
                        {pat.phone ? <a href={`tel:${pat.phone}`} className="text-primary hover:underline">{pat.phone}</a> : <span className="text-gray-500">-</span>}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(pat.date_of_birth)}</td>
                      <td className="px-6 py-4 text-gray-600 text-[13px] capitalize">{pat.insured_status?.replace(/_/g, ' ') || '-'}</td>
                      <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(pat.created_at)}</td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400"><Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />No patients found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-6">
          <h2 className="font-heading font-medium text-[16px] text-near-black mb-5" style={{ textTransform: 'none' }}>Activity Timeline</h2>
          <div className="relative pl-8 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-100" />

            <div className="relative">
              <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-primary/10 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-primary" /></div>
              <div className="text-[14px] font-medium text-gray-800">Account Created</div>
              <div className="text-[13px] text-gray-500">{formatDate(doc.created_at)}</div>
            </div>

            {doc.verified_at && (
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-green-50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /></div>
                <div className="text-[14px] font-medium text-gray-800">Account Verified</div>
                <div className="text-[13px] text-gray-500">{formatDate(doc.verified_at)}</div>
              </div>
            )}

            {doc.rejection_reason && (
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-red-50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /></div>
                <div className="text-[14px] font-medium text-gray-800">Verification Rejected</div>
                <div className="text-[13px] text-gray-500">{doc.rejection_reason}</div>
              </div>
            )}

            {data.recommendations?.length > 0 && (
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-blue-50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /></div>
                <div className="text-[14px] font-medium text-gray-800">First Recommendation</div>
                <div className="text-[13px] text-gray-500">{formatDate(data.recommendations[data.recommendations.length - 1]?.created_at)} · {data.recommendations[data.recommendations.length - 1]?.display_id}</div>
              </div>
            )}

            {data.recommendations?.length > 1 && (
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-blue-50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /></div>
                <div className="text-[14px] font-medium text-gray-800">Latest Recommendation</div>
                <div className="text-[13px] text-gray-500">{formatDate(data.recommendations[0]?.created_at)} · {data.recommendations[0]?.display_id} · {stats.total_recommendations} total</div>
              </div>
            )}

            {stats.total_revenue > 0 && (
              <div className="relative">
                <div className="absolute -left-8 top-0.5 w-[22px] h-[22px] rounded-full bg-teal-50 flex items-center justify-center"><div className="w-2.5 h-2.5 rounded-full bg-teal-500" /></div>
                <div className="text-[14px] font-medium text-gray-800">Revenue Generated</div>
                <div className="text-[13px] text-gray-500">{formatCurrency(stats.total_revenue)} across {stats.total_orders} orders</div>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && <DoctorEditModal doctor={doc} onClose={() => setEditing(false)} onSuccess={() => { setEditing(false); fetchData(); }} />}
    </div>
  );
}
