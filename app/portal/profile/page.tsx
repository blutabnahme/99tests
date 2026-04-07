"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PortalProfilePage() {
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    insured_status: '',
    address_line1: '',
    address_zip: '',
    address_city: '',
    address_country: 'DE',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/portal/data?section=profile');
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
          if (data.patient) {
            setForm({
              first_name: data.patient.first_name || '',
              last_name: data.patient.last_name || '',
              email: data.patient.email || '',
              phone: data.patient.phone || '',
              date_of_birth: formatDate(data.patient.date_of_birth) || '',
              gender: data.patient.gender || '',
              insured_status: data.patient.insured_status || '',
              address_line1: data.patient.address_street || '',
              address_zip: data.patient.address_postal_code || '',
              address_city: data.patient.address_city || '',
              address_country: data.patient.address_country || 'DE',
            });
          }
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/portal/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...form,
           // map UI properties directly to table properties for persistence
           address_street: form.address_line1,
           address_postal_code: form.address_zip
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const inputClasses = "w-full rounded-full border border-gray-200 px-4 py-2.5 text-[14px] text-near-black focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors bg-white";
  const selectClasses = "w-full rounded-full border border-gray-200 px-4 py-2.5 pr-10 text-[14px] text-near-black focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none bg-white transition-colors bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat";
  const labelClasses = "text-[12px] font-medium text-gray-500 uppercase tracking-wider mb-1.5 block";

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="md" /></div>;
  if (!patient) return <div className="text-gray-500 text-center py-12">Profile not found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight" style={{ textTransform: 'none' }}>Profile</h1>
          <p className="text-gray-500 text-[14px] mt-1">Update your personal information.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-6 rounded-full bg-primary text-white text-[14px] font-semibold hover:bg-[#005C5F] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-[13px] rounded-[12px] border border-red-100">{error}</div>
      )}

      <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[18px]">
            {(form.first_name || 'U')[0]}{(form.last_name || '')[0] || ''}
          </div>
          <div>
            <div className="text-[18px] font-heading font-medium text-near-black">{form.first_name} {form.last_name}</div>
            <div className="text-[13px] text-gray-500">Patient since {patient.created_at ? new Date(patient.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' }) : '-'}</div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Personal */}
          <div>
            <div className="text-[11px] font-medium text-primary uppercase tracking-wider mb-4">Personal Information</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>First name</label>
                <input type="text" className={inputClasses} value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>Last name</label>
                <input type="text" className={inputClasses} value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className={labelClasses}>Date of birth</label>
                <input type="date" className={inputClasses} value={form.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>Gender</label>
                <select className={selectClasses} value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="M">Male</option>
                  <option value="W">Female</option>
                  <option value="D">Diverse</option>
                </select>
              </div>
              <div>
                <label className={labelClasses}>Insurance status</label>
                <select className={selectClasses} value={form.insured_status} onChange={(e) => updateField('insured_status', e.target.value)}>
                  <option value="">Select...</option>
                  <option value="insured">Privately insured</option>
                  <option value="self_pay">Self-payer</option>
                  <option value="statutory">Statutory insured</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className="text-[11px] font-medium text-primary uppercase tracking-wider mb-4">Contact</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Email</label>
                <input type="email" className={inputClasses} value={form.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>Phone</label>
                <input type="tel" className={inputClasses} value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="text-[11px] font-medium text-primary uppercase tracking-wider mb-4">Address</div>
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>Street address</label>
                <input type="text" className={inputClasses} value={form.address_line1} onChange={(e) => updateField('address_line1', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClasses}>Postal code</label>
                  <input type="text" className={inputClasses} value={form.address_zip} onChange={(e) => updateField('address_zip', e.target.value)} />
                </div>
                <div>
                  <label className={labelClasses}>City</label>
                  <input type="text" className={inputClasses} value={form.address_city} onChange={(e) => updateField('address_city', e.target.value)} />
                </div>
                <div>
                  <label className={labelClasses}>Country</label>
                  <select className={selectClasses} value={form.address_country} onChange={(e) => updateField('address_country', e.target.value)}>
                    <option value="DE">Germany</option>
                    <option value="AT">Austria</option>
                    <option value="CH">Switzerland</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
