"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Archive, Loader2, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import LaboratoryModal from '@/components/admin/LaboratoryModal';

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const fetchLaboratories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/laboratories?active_only=${activeOnly}`);
      if (!res.ok) throw new Error('Failed to fetch laboratories');
      const data = await res.json();
      setLaboratories(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchLaboratories();
  }, [fetchLaboratories]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/laboratories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchLaboratories();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
            Laboratories
          </h1>
          <p className="text-gray-500 text-[14px]">Manage partner laboratories and LDT/PAD configurations</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700 bg-white px-3 py-2 rounded-full border border-gray-200 shadow-sm">
            <input 
              type="checkbox" 
              checked={activeOnly} 
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            Active Only
          </label>
          <Button 
            variant="primary" 
            onClick={() => { setEditingLab(null); setIsModalOpen(true); }}
            className="rounded-full shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Laboratory
          </Button>
        </div>
      </div>

      {/* Content */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">AISID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {laboratories.map((lab) => (
                  <tr key={lab.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingLab(lab); setIsModalOpen(true); }}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-near-black">{lab.name}</div>
                      {lab.official_name && <div className="text-[13px] text-gray-500">{lab.official_name}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lab.address_city || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-[13px]">{lab.aisid || '-'}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lab.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingLab(lab); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(lab.id, lab.is_active)}
                          className={`p-2 rounded-full transition-colors ${lab.is_active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                          title={lab.is_active ? "Deactivate" : "Activate"}
                        >
                          {lab.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {laboratories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      No laboratories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List Container */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {laboratories.map((lab, index) => (
              <div 
                key={lab.id} 
                onClick={() => { setEditingLab(lab); setIsModalOpen(true); }}
                className={`p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors ${index !== laboratories.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-near-black text-[15px]">{lab.name}</div>
                  <StatusBadge status={lab.is_active ? 'active' : 'inactive'} />
                </div>
                <div className="text-[13px] text-gray-500 mb-3 space-y-0.5">
                  {lab.official_name && <div>{lab.official_name}</div>}
                  <div className="flex items-center gap-2">
                    {lab.address_city && <span>{lab.address_city}</span>}
                    {lab.address_city && lab.aisid && <span className="text-gray-300">•</span>}
                    {lab.aisid && <span className="font-mono">AISID {lab.aisid}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button 
                    variant="secondary"
                    className="flex-1 rounded-full text-[13px] h-9"
                    onClick={(e) => { e.stopPropagation(); setEditingLab(lab); setIsModalOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant={lab.is_active ? "danger" : "secondary"}
                    className="flex-1 rounded-full text-[13px] h-9"
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(lab.id, lab.is_active); }}
                  >
                    {lab.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
            {laboratories.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-[14px]">
                No laboratories found
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <LaboratoryModal 
          lab={editingLab} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchLaboratories(); }}
        />
      )}
    </div>
  );
}
