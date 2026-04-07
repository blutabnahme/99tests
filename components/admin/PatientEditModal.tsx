"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PatientEditModalProps {
  patient: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PatientEditModal({ patient, onClose, onSuccess }: PatientEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'M',
    insured_status: '',
    address_line1: '',
    address_zip: '',
    address_city: '',
    address_country: 'DE',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || '',
        last_name: patient.last_name || '',
        email: patient.email || '',
        phone: patient.phone || '',
        date_of_birth: patient.date_of_birth ? patient.date_of_birth.substring(0, 10) : '',
        gender: patient.gender || 'M',
        insured_status: patient.insured_status || '',
        address_line1: patient.address_line1 || '',
        address_zip: patient.address_zip || '',
        address_city: patient.address_city || '',
        address_country: patient.address_country || 'DE',
      });
    }
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${patient.id}?type=patient`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={onClose}>
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-heading font-medium text-[20px] text-near-black">Edit Patient</h2>
            <div className="text-[13px] text-gray-500 mt-0.5">{patient.first_name} {patient.last_name}</div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 font-body">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">{error}</div>}

          <form id="patient-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">First Name *</label>
                <input required name="first_name" value={formData.first_name} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Last Name *</label>
                <input required name="last_name" value={formData.last_name} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Date of Birth *</label>
                <input required name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className={selectClasses} style={selectStyle}>
                  <option value="M">Male</option>
                  <option value="W">Female</option>
                  <option value="D">Diverse</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-medium text-gray-700">Insurance Status</label>
                <select name="insured_status" value={formData.insured_status} onChange={handleChange} className={selectClasses} style={selectStyle}>
                  <option value="">Not specified</option>
                  <option value="privat_versichert">Privately Insured (PKV)</option>
                  <option value="selbstzahler">Self-payer</option>
                  <option value="gesetzlich">Statutory (GKV)</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-medium text-gray-700">Address</label>
                <input name="address_line1" value={formData.address_line1} onChange={handleChange} className={inputClasses} placeholder="Street" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">ZIP</label>
                <input name="address_zip" value={formData.address_zip} onChange={handleChange} className={inputClasses} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">City</label>
                <input name="address_city" value={formData.address_city} onChange={handleChange} className={inputClasses} />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3 rounded-b-[16px]">
          <Button variant="secondary" onClick={onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>Cancel</Button>
          <Button variant="primary" type="submit" form="patient-form" className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Patient'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
