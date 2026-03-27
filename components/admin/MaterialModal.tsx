"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TubeColorDot, AVAILABLE_TUBE_COLORS } from './TubeColorDot';

interface MaterialModalProps {
  material?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MaterialModal({ material, onClose, onSuccess }: MaterialModalProps) {
  const isEditing = !!material;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    tube_type: '',
    tube_color: '',
    default_volume: '',
    default_unit: 'ml',
    sort_order: '0',
    is_active: true,
  });

  useEffect(() => {
    if (material) {
      setFormData({
        code: material.code || '',
        name: material.name || '',
        description: material.description || '',
        tube_type: material.tube_type || '',
        tube_color: material.tube_color || '',
        default_volume: material.default_volume ? String(material.default_volume) : '',
        default_unit: material.default_unit || 'ml',
        sort_order: material.sort_order ? String(material.sort_order) : '0',
        is_active: material.is_active ?? true,
      });
    }
  }, [material]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, is_active: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      default_volume: formData.default_volume ? parseFloat(formData.default_volume) : null,
      sort_order: parseInt(formData.sort_order, 10) || 0
    };

    try {
      const url = isEditing ? `/api/admin/materials/${material.id}` : `/api/admin/materials`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save material');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0"
      style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-[16px] shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0 bg-white">
          <div>
            <h2 className="font-heading font-medium text-[20px] text-near-black">
              {isEditing ? 'Edit Material' : 'Add Material'}
            </h2>
            {isEditing && <div className="text-[13px] text-gray-500 font-mono mt-0.5">{material.code}</div>}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 font-body">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-[12px] text-[14px] font-medium border border-red-100">
              {error}
            </div>
          )}
          
          <form id="material-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-[12px] border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700">
                <input 
                  type="checkbox" 
                  name="is_active"
                  checked={formData.is_active} 
                  onChange={handleToggleActive}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                Active Material
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Code *</label>
                <input required name="code" value={formData.code} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="e.g. EDTA-S" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Name *</label>
                <input required name="name" value={formData.name} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="e.g. EDTA Röhrchen" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[13px] font-medium text-gray-700">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full min-h-[80px] p-4 text-[14px] rounded-[16px] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Tube Type</label>
                <input name="tube_type" value={formData.tube_type} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="e.g. Röhrchen, Abstrich" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Tube Color</label>
                <div className="relative">
                  {formData.tube_color && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                      <TubeColorDot color={formData.tube_color} />
                    </div>
                  )}
                  <select 
                    name="tube_color" 
                    value={formData.tube_color} 
                    onChange={handleChange} 
                    className={`w-full h-11 ${formData.tube_color ? 'pl-10' : 'pl-4'} pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all bg-white appearance-none`}
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22currentColor%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' }}
                  >
                    <option value="">No Color</option>
                    {AVAILABLE_TUBE_COLORS.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Default Volume</label>
                <input type="number" step="0.1" name="default_volume" value={formData.default_volume} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Default Unit</label>
                <input name="default_unit" value={formData.default_unit} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" placeholder="e.g. ml" />
              </div>

               <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">Sort Order</label>
                <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} className="w-full h-11 px-4 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400" />
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0 flex items-center justify-end gap-3 rounded-b-[16px]">
          <Button variant="secondary" onClick={onClose} className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="material-form" className="rounded-full px-6 h-10 text-[14px]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Material'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
