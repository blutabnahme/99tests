"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Search, Users, User, Stethoscope, ChevronDown, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import DoctorEditModal from '@/components/admin/DoctorEditModal';
import PatientEditModal from '@/components/admin/PatientEditModal';
import UserActionsDropdown from '@/components/admin/UserActionsDropdown';
import { CreateUserModal } from './CreateUserModal';

function SortableHeader({ label, sortKey, currentSort, onSort }: {
  label: string; sortKey: string; currentSort: string; onSort: (key: string) => void;
}) {
  const isAsc = currentSort === `${sortKey}_asc`;
  const isDesc = currentSort === `${sortKey}_desc`;
  const isActive = isAsc || isDesc;

  const handleClick = () => {
    if (isAsc) onSort(`${sortKey}_desc`);
    else onSort(`${sortKey}_asc`);
  };

  return (
    <th className="px-6 py-4 cursor-pointer select-none hover:text-near-black transition-colors group" onClick={handleClick}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col text-[8px] leading-[8px]">
          <span className={isAsc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}>▲</span>
          <span className={isDesc ? 'text-primary' : 'text-gray-300 group-hover:text-gray-400'}>▼</span>
        </span>
      </div>
    </th>
  );
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

function VerificationDot({ status }: { status: string }) {
  const color = status === 'verified' ? 'bg-green-500' : status === 'rejected' ? 'bg-red-500' : 'bg-amber-400';
  const label = status === 'verified' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Pending';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className={`text-[12px] font-medium ${
        status === 'verified' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : 'text-amber-600'
      }`}>{label}</span>
    </div>
  );
}

// Searchable doctor select for patient filter
function DoctorFilterSelect({ doctors, value, onChange }: { doctors: any[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selected = doctors.find(d => d.id === value);
  const filtered = query ? doctors.filter(d => d.full_name?.toLowerCase().includes(query.toLowerCase())) : doctors;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-44">
      <div onClick={() => setOpen(!open)} className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 bg-white flex items-center cursor-pointer hover:border-gray-300 transition-colors">
        <span className={`truncate ${value === 'all' ? 'text-gray-500' : 'text-near-black'}`}>
          {value === 'all' ? 'All Doctors' : selected?.full_name || 'All Doctors'}
        </span>
        {value !== 'all' && (
          <button onClick={(e) => { e.stopPropagation(); onChange('all'); }} className="absolute right-8 p-0.5 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3" />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search doctors..." className="w-full h-9 px-3 text-[13px] rounded-[8px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none" autoFocus />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <button onClick={() => { onChange('all'); setOpen(false); setQuery(''); }} className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 ${value === 'all' ? 'text-primary font-semibold' : 'text-gray-700'}`}>All Doctors</button>
            {filtered.map((d: any) => (
              <button key={d.id} onClick={() => { onChange(d.id); setOpen(false); setQuery(''); }} className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 ${value === d.id ? 'text-primary font-semibold' : 'text-gray-700'}`}>{d.full_name}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DOCTOR_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'recs_desc', label: 'Most recs' },
  { value: 'recs_asc', label: 'Least recs' },
];

const PATIENT_SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
];

const VERIFICATION_STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
];

const INSURANCE_OPTIONS = [
  { value: 'all', label: 'All Insurance' },
  { value: 'privat_versichert', label: 'PKV (Private)' },
  { value: 'selbstzahler', label: 'Self-payer' },
  { value: 'gesetzlich', label: 'GKV (Statutory)' },
];

const CUSTOM_FEE_OPTIONS = [
  { value: 'all', label: 'All Fees' },
  { value: 'yes', label: 'Custom fee' },
  { value: 'no', label: 'Default fee' },
];

const MINOR_OPTIONS = [
  { value: 'all', label: 'All Ages' },
  { value: 'yes', label: 'Minors only' },
  { value: 'no', label: 'Adults only' },
];

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'patients'>('doctors');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  // Doctor filters
  const [verificationStatus, setVerificationStatus] = useState('all');
  const [specialty, setSpecialty] = useState('all');
  const [hasCustomFee, setHasCustomFee] = useState('all');
  const [doctorSort, setDoctorSort] = useState('created_desc');

  // Patient filters
  const [insurance, setInsurance] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [isMinor, setIsMinor] = useState('all');
  const [patientSort, setPatientSort] = useState('created_desc');

  // Shared
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Doctors list for patient filter
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);

  const selectClasses = "h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white shrink-0 appearance-none";
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };
  const inputClasses = "h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white";

  // Fetch doctors list for patient filter
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/admin/users?type=doctors&limit=100');
        if (res.ok) { const d = await res.json(); setDoctorsList(d.data || []); }
      } catch (e) {}
    }
    fetchDoctors();
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ type: activeTab, page: page.toString(), limit: limit.toString() });
      if (search) params.append('search', search);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      if (activeTab === 'doctors') {
        params.append('sort', doctorSort);
        if (verificationStatus !== 'all') params.append('verification_status', verificationStatus);
        if (specialty !== 'all') params.append('specialty', specialty);
        if (hasCustomFee !== 'all') params.append('has_custom_fee', hasCustomFee);
      } else {
        params.append('sort', patientSort);
        if (insurance !== 'all') params.append('insurance', insurance);
        if (doctorFilter !== 'all') params.append('doctor_id', doctorFilter);
        if (isMinor !== 'all') params.append('is_minor', isMinor);
      }

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const result = await res.json();
      setData(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, dateFrom, dateTo, doctorSort, verificationStatus, specialty, hasCustomFee, patientSort, insurance, doctorFilter, isMinor]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reset filters when switching tabs
  useEffect(() => {
    setPage(1);
    setSearch('');
    setDateFrom('');
    setDateTo('');
  }, [activeTab]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">Users</h1>
          <p className="text-gray-500 text-[14px] mt-1">Manage doctors and patients on the platform</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all shadow-sm shrink-0">
          <Plus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('doctors')} className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'doctors' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'}`}>
          <Stethoscope className="w-4 h-4" /> Doctors
        </button>
        <button onClick={() => setActiveTab('patients')} className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'patients' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'}`}>
          <User className="w-4 h-4" /> Patients
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input type="text" className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[14px] placeholder:text-gray-400"
            placeholder={activeTab === 'doctors' ? 'Search name, email...' : 'Search name or email...'}
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Doctor-specific filters */}
        {activeTab === 'doctors' && (
          <>
            <select value={verificationStatus} onChange={e => { setVerificationStatus(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-36`} style={selectStyle}>
              {VERIFICATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={hasCustomFee} onChange={e => { setHasCustomFee(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-32`} style={selectStyle}>
              {CUSTOM_FEE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </>
        )}

        {/* Patient-specific filters */}
        {activeTab === 'patients' && (
          <>
            <select value={insurance} onChange={e => { setInsurance(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-40`} style={selectStyle}>
              {INSURANCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <DoctorFilterSelect doctors={doctorsList} value={doctorFilter} onChange={v => { setDoctorFilter(v); setPage(1); }} />
            <select value={isMinor} onChange={e => { setIsMinor(e.target.value); setPage(1); }} className={`${selectClasses} w-full md:w-32`} style={selectStyle}>
              {MINOR_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </>
        )}


      </div>

      {/* Summary */}
      <div className="text-[13px] text-gray-500">
        Showing <span className="font-semibold text-near-black">{Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)}</span> of <span className="font-semibold text-near-black">{total}</span> {activeTab}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">

          {activeTab === 'doctors' && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-[14px] whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                    <tr>
                      <SortableHeader label="Name" sortKey="name" currentSort={doctorSort} onSort={(s) => { setDoctorSort(s); setPage(1); }} />
                      <SortableHeader label="Specialty" sortKey="specialty" currentSort={doctorSort} onSort={(s) => { setDoctorSort(s); setPage(1); }} />
                      <SortableHeader label="Email" sortKey="email" currentSort={doctorSort} onSort={(s) => { setDoctorSort(s); setPage(1); }} />
                      <SortableHeader label="Recs" sortKey="recs" currentSort={doctorSort} onSort={(s) => { setDoctorSort(s); setPage(1); }} />
                      <th className="px-6 py-4">Fee</th>
                      <th className="px-6 py-4">Status</th>
                      <SortableHeader label="Registered" sortKey="created" currentSort={doctorSort} onSort={(s) => { setDoctorSort(s); setPage(1); }} />
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-body">
                    {data.map((doc: any) => (
                      <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setEditingDoctor(doc)}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-near-black">{doc.full_name || '-'}</div>
                          {doc.practice_name && <div className="text-[12px] text-gray-500 mt-0.5">{doc.practice_name}</div>}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-[13px]">{doc.specialty || '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{doc.email || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{doc.recommendation_count}</span>
                        </td>
                        <td className="px-6 py-4 text-[13px]">
                          {doc.custom_service_fee_pct != null ? (
                            <span className="font-mono font-medium text-primary">{doc.custom_service_fee_pct}%</span>
                          ) : (
                            <span className="text-gray-400">Default</span>
                          )}
                        </td>
                        <td className="px-6 py-4"><VerificationDot status={doc.verification_status || 'pending'} /></td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(doc.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                            <UserActionsDropdown
                              user={doc}
                              type="doctor"
                              onEdit={() => setEditingDoctor(doc)}
                              onActionComplete={() => fetchUsers()}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><Users className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p>No doctors found</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden border-y border-gray-200">
                {data.map((doc: any, i: number) => (
                  <div key={doc.id} onClick={() => setEditingDoctor(doc)} className={`p-4 cursor-pointer hover:bg-gray-50/50 ${i !== data.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="font-semibold text-near-black text-[15px]">{doc.full_name || '-'}</div>
                      <VerificationDot status={doc.verification_status || 'pending'} />
                    </div>
                    <div className="text-[13px] text-gray-500">{doc.practice_name || '-'} {doc.specialty ? `· ${doc.specialty}` : ''}</div>
                    <div className="text-[13px] text-gray-400 mt-1">{doc.email} · {doc.recommendation_count} recs · {formatDate(doc.created_at)}</div>
                  </div>
                ))}
                {data.length === 0 && <div className="py-12 text-center text-gray-500 text-[14px]">No doctors found</div>}
              </div>
            </>
          )}

          {activeTab === 'patients' && (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-[14px] whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                    <tr>
                      <SortableHeader label="Name" sortKey="name" currentSort={patientSort} onSort={(s) => { setPatientSort(s); setPage(1); }} />
                      <SortableHeader label="Email" sortKey="email" currentSort={patientSort} onSort={(s) => { setPatientSort(s); setPage(1); }} />
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Date of Birth</th>
                      <th className="px-6 py-4">Insurance</th>
                      <SortableHeader label="Registered" sortKey="created" currentSort={patientSort} onSort={(s) => { setPatientSort(s); setPage(1); }} />
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-body">
                    {data.map((pat: any) => (
                      <tr key={pat.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setEditingPatient(pat)}>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-near-black">
                            {pat.first_name} {pat.last_name}
                            {pat.is_minor && <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">MINOR</span>}
                          </div>
                          {pat.doctor?.full_name && <div className="text-[12px] text-gray-500 mt-0.5">{pat.doctor.full_name}</div>}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{pat.email || '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{pat.phone || '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(pat.date_of_birth)}</td>
                        <td className="px-6 py-4 text-gray-600 text-[13px] capitalize">{pat.insured_status?.replace(/_/g, ' ') || '-'}</td>
                        <td className="px-6 py-4 text-gray-500 text-[13px]">{formatDate(pat.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                            <UserActionsDropdown
                              user={pat}
                              type="patient"
                              onEdit={() => setEditingPatient(pat)}
                              onActionComplete={() => fetchUsers()}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50"><Users className="w-8 h-8 text-gray-300 mx-auto mb-3" /><p>No patients found</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="lg:hidden border-y border-gray-200">
                {data.map((pat: any, i: number) => (
                  <div key={pat.id} onClick={() => setEditingPatient(pat)} className={`p-4 cursor-pointer hover:bg-gray-50/50 ${i !== data.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="font-semibold text-near-black text-[15px]">
                      {pat.first_name} {pat.last_name}
                      {pat.is_minor && <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">MINOR</span>}
                    </div>
                    <div className="text-[13px] text-gray-500">{pat.email || '-'}</div>
                    <div className="text-[13px] text-gray-400 mt-1">DOB: {formatDate(pat.date_of_birth)} · {pat.insured_status?.replace(/_/g, ' ') || '-'}</div>
                  </div>
                ))}
                {data.length === 0 && <div className="py-12 text-center text-gray-500 text-[14px]">No patients found</div>}
              </div>
            </>
          )}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-gray-500">Page {page} of {totalPages}</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)} className="text-[13px] h-9 px-4 rounded-full">Previous</Button>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)} className="text-[13px] h-9 px-4 rounded-full">Next</Button>
          </div>
        </div>
      )}

      {editingDoctor && <DoctorEditModal doctor={editingDoctor} onClose={() => setEditingDoctor(null)} onSuccess={() => { setEditingDoctor(null); fetchUsers(); }} />}
      {editingPatient && <PatientEditModal patient={editingPatient} onClose={() => setEditingPatient(null)} onSuccess={() => { setEditingPatient(null); fetchUsers(); }} />}
      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchUsers(); }} />}
    </div>
  );
}
