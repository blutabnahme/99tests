"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, User, MapPin, Settings, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format-date';

interface DoctorEditModalProps {
  doctor: any;
  onClose: () => void;
  onSuccess: () => void;
}

const SPECIALTIES = [
  'Allgemeinmedizin',
  'Anästhesiologie',
  'Anatomie',
  'Arbeitsmedizin',
  'Augenheilkunde',
  'Biochemie',
  'Chirurgie',
  'Dermatologie',
  'Endokrinologie',
  'Frauenheilkunde und Geburtshilfe',
  'Gastroenterologie',
  'Gefäßchirurgie',
  'Geriatrie',
  'Gynäkologie',
  'Hämatologie',
  'Hals-Nasen-Ohren-Heilkunde',
  'Handchirurgie',
  'Herzchirurgie',
  'Humangenetik',
  'Hygiene und Umweltmedizin',
  'Immunologie',
  'Infektiologie',
  'Innere Medizin',
  'Intensivmedizin',
  'Kardiologie',
  'Kinder- und Jugendmedizin',
  'Kinder- und Jugendpsychiatrie',
  'Kinderchirurgie',
  'Laboratoriumsmedizin',
  'Mikrobiologie',
  'Mund-Kiefer-Gesichtschirurgie',
  'Naturheilverfahren',
  'Nephrologie',
  'Neurochirurgie',
  'Neurologie',
  'Neuropathologie',
  'Nuklearmedizin',
  'Onkologie',
  'Orthopädie',
  'Palliativmedizin',
  'Pathologie',
  'Pharmakologie',
  'Phoniatrie und Pädaudiologie',
  'Physikalische Medizin',
  'Physiologie',
  'Plastische Chirurgie',
  'Pneumologie',
  'Psychiatrie und Psychotherapie',
  'Psychosomatische Medizin',
  'Radiologie',
  'Rechtsmedizin',
  'Rehabilitation',
  'Rheumatologie',
  'Schlafmedizin',
  'Sportmedizin',
  'Strahlentherapie',
  'Thoraxchirurgie',
  'Transfusionsmedizin',
  'Tropenmedizin',
  'Unfallchirurgie',
  'Urologie',
  'Viszeralchirurgie',
  'Zahnmedizin',
];

function SpecialtySearchSelect({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Store as comma-separated string, parse to array
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const filtered = query
    ? SPECIALTIES.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : SPECIALTIES;

  const toggleSpecialty = (s: string) => {
    let updated: string[];
    if (selected.includes(s)) {
      updated = selected.filter(x => x !== s);
    } else {
      updated = [...selected, s];
    }
    onChange(updated.join(', '));
  };

  const removeSpecialty = (s: string) => {
    const updated = selected.filter(x => x !== s);
    onChange(updated.join(', '));
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        className="min-h-[44px] pl-3 pr-10 py-2 text-[14px] rounded-[22px] border border-gray-200 bg-white flex items-center flex-wrap gap-1.5 cursor-pointer hover:border-gray-300 transition-colors"
      >
        {selected.length > 0 ? (
          selected.map(s => (
            <span key={s} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[12px] font-medium px-2.5 py-1 rounded-full">
              {s}
              <button
                onClick={(e) => { e.stopPropagation(); removeSpecialty(s); }}
                className="hover:text-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 pl-1">Select specialties...</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[12px] shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search specialties..."
              className="w-full h-9 px-3 text-[13px] rounded-[8px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.map(s => {
              const isSelected = selected.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => { toggleSpecialty(s); setQuery(''); }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors flex items-center justify-between ${isSelected ? 'text-primary font-semibold' : 'text-gray-700'}`}
                >
                  <span>{s}</span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-[13px] text-gray-400 text-center">No match found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorEditModal({ doctor, onClose, onSuccess }: DoctorEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'address' | 'settings'>('general');

  useEffect(() => { setMounted(true); }, []);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    practice_name: '',
    specialty: '',
    license_number: '',
    language: 'de',
    is_active: true,
    // Address
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'DE',
    // Settings
    custom_service_fee_pct: '',
    custom_doctor_billing_fee_pct: '',
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        practice_name: doctor.practice_name || '',
        specialty: doctor.specialty || '',
        license_number: doctor.license_number || '',
        language: doctor.language || 'de',
        is_active: doctor.is_active ?? true,
        address_street: doctor.address_street || '',
        address_zip: doctor.address_zip || '',
        address_city: doctor.address_city || '',
        address_country: doctor.address_country || 'DE',
        custom_service_fee_pct: doctor.custom_service_fee_pct != null ? String(doctor.custom_service_fee_pct) : '',
        custom_doctor_billing_fee_pct: doctor.custom_doctor_billing_fee_pct != null ? String(doctor.custom_doctor_billing_fee_pct) : '',
      });
    }
  }, [doctor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...formData };
      // Convert custom fee to number or null
      if (payload.custom_service_fee_pct === '' || payload.custom_service_fee_pct === undefined) {
        payload.custom_service_fee_pct = null;
      } else {
        payload.custom_service_fee_pct = parseFloat(payload.custom_service_fee_pct);
      }

      if (payload.custom_doctor_billing_fee_pct === '' || payload.custom_doctor_billing_fee_pct === undefined) {
        payload.custom_doctor_billing_fee_pct = null;
      } else {
        payload.custom_doctor_billing_fee_pct = parseFloat(payload.custom_doctor_billing_fee_pct);
      }

      const res = await fetch(`/api/admin/users/${doctor.id}?type=doctor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const inputClasses = "w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder:text-gray-400";
  const selectClasses = `${inputClasses} appearance-none pr-10`;
  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' };
  const labelClasses = "text-[13px] font-medium text-gray-700";

  const tabs = [
    { id: 'general' as const, label: 'General', icon: User },
    { id: 'address' as const, label: 'Address', icon: MapPin },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <div>
            <h2 className="font-heading font-medium text-[20px] text-near-black" style={{ textTransform: 'none' }}>Edit Doctor</h2>
            <div className="text-[13px] text-gray-500 mt-0.5">{doctor.email}</div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 flex border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-near-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 font-body">
          {error && <div className="mb-5 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">{error}</div>}

          <form id="doctor-form" onSubmit={handleSubmit}>

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Full Name *</label>
                  <input required name="full_name" value={formData.full_name} onChange={handleChange} className={inputClasses} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Practice Name</label>
                    <input name="practice_name" value={formData.practice_name} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Specialty</label>
                    <SpecialtySearchSelect
                      value={formData.specialty}
                      onChange={(val) => setFormData(prev => ({ ...prev, specialty: val }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>License Number</label>
                    <input name="license_number" value={formData.license_number} onChange={handleChange} className={inputClasses} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>Language</label>
                    <select name="language" value={formData.language} onChange={handleChange} className={selectClasses} style={selectStyle}>
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ADDRESS TAB */}
            {activeTab === 'address' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className={labelClasses}>Street</label>
                  <input name="address_street" value={formData.address_street} onChange={handleChange} className={inputClasses} placeholder="Musterstraße 1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelClasses}>ZIP Code</label>
                    <input name="address_zip" value={formData.address_zip} onChange={handleChange} className={inputClasses} placeholder="60329" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClasses}>City</label>
                    <input name="address_city" value={formData.address_city} onChange={handleChange} className={inputClasses} placeholder="Frankfurt am Main" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label className={labelClasses}>Country</label>
                  <select name="address_country" value={formData.address_country} onChange={handleChange} className={selectClasses} style={selectStyle}>
                    <option value="DE">Germany</option>
                    <option value="AT">Austria</option>
                    <option value="CH">Switzerland</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="LU">Luxembourg</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="PT">Portugal</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[12px] border border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-[14px] font-medium text-gray-700">
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    Active Doctor
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClasses}>Custom Service Fee (%)</label>
                  <div className="relative max-w-xs">
                    <input
                      name="custom_service_fee_pct"
                      type="number"
                      step="0.01"
                      value={formData.custom_service_fee_pct}
                      onChange={handleChange}
                      className={`${inputClasses} pr-10`}
                      placeholder="Leave empty to use platform default"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                  </div>
                  <p className="text-[12px] text-gray-400">
                    Override the platform default service fee for this doctor's recommendations.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClasses}>Custom Doctor Billing Fee (%)</label>
                  <div className="relative max-w-xs">
                    <input
                      name="custom_doctor_billing_fee_pct"
                      type="number"
                      step="0.01"
                      value={formData.custom_doctor_billing_fee_pct}
                      onChange={handleChange}
                      className={`${inputClasses} pr-10`}
                      placeholder="Leave empty for platform default"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">%</span>
                  </div>
                  <p className="text-[12px] text-gray-400">
                    Fee applied when this doctor pays on behalf of patients (monthly invoice).
                  </p>
                </div>

                {/* Verification info (read-only) */}
                <div className="border-t border-gray-100 pt-5">
                  <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Verification</div>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium ${
                        doctor.verification_status === 'verified' ? 'text-green-600' :
                        doctor.verification_status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {(doctor.verification_status || 'pending').charAt(0).toUpperCase() + (doctor.verification_status || 'pending').slice(1)}
                      </span>
                    </div>
                    {doctor.verified_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Verified at</span>
                        <span className="text-gray-700">{formatDate(doctor.verified_at)}</span>
                      </div>
                    )}
                    {doctor.rejection_reason && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rejection reason</span>
                        <span className="text-red-600 text-right max-w-[200px]">{doctor.rejection_reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3 rounded-b-[16px]">
          <Button variant="secondary" onClick={onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" form="doctor-form" className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Doctor'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
