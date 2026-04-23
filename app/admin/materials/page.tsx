"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Archive, ArchiveRestore, Loader2, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TubeColorDot } from '@/components/admin/TubeColorDot';
import MaterialModal from '@/components/admin/MaterialModal';

const bulkBarKeyframes = `@keyframes bulkBarIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`;

// ─── Confirmation Modal ───────────────────────────────────────
function ConfirmDeleteModal({
  count, onConfirm, onCancel, loading
}: { count: number; onConfirm: () => void; onCancel: () => void; loading: boolean; }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(26, 29, 35, 0.5)' }} onClick={onCancel}>
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-heading font-medium text-[18px] text-near-black">
              Delete {count} material{count !== 1 ? 's' : ''}?
            </h3>
          </div>
          <p className="text-[14px] text-gray-600 mb-1">
            This will <strong>permanently remove</strong> {count === 1 ? 'this material' : `these ${count} materials`} from the database.
          </p>
          <p className="text-[13px] text-gray-500">
            Materials linked to existing test catalog entries or recommendations cannot be deleted. This action cannot be undone.
          </p>
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-[16px] flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} className="rounded-full px-5 h-10 text-[14px]" disabled={loading}>Cancel</Button>
          <button onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full px-5 h-10 text-[14px] font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Permanently
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
  const [error, setError] = useState('');

  // Filters
  const [activeOnly, setActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tubeTypeFilter, setTubeTypeFilter] = useState('all');
  const [measurementFilter, setMeasurementFilter] = useState('all');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[] } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/materials?active_only=${activeOnly}`);
      if (!res.ok) throw new Error('Failed to fetch materials');
      const data = await res.json();
      setMaterials(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);
  useEffect(() => { setSelectedIds(new Set()); }, [activeOnly, searchQuery, tubeTypeFilter, measurementFilter]);

  const tubeTypes = useMemo(() => {
    const types = new Set<string>();
    materials.forEach((m) => { if (m.tube_type) types.add(m.tube_type); });
    return Array.from(types).sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((mat) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!mat.code?.toLowerCase().includes(q) && !mat.name?.toLowerCase().includes(q)) return false;
      }
      if (tubeTypeFilter !== 'all' && mat.tube_type !== tubeTypeFilter) return false;
      if (measurementFilter !== 'all' && mat.measurement_type !== measurementFilter) return false;
      return true;
    });
  }, [materials, searchQuery, tubeTypeFilter, measurementFilter]);

  const allFilteredSelected = filteredMaterials.length > 0 && filteredMaterials.every((m) => selectedIds.has(m.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredMaterials.map((m) => m.id)));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/materials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !currentStatus }) });
      if (!res.ok) throw new Error('Failed to update status');
      fetchMaterials();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === 'delete') { setDeleteConfirm({ ids }); return; }
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/materials/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || `Failed to ${action}`); }
      setSelectedIds(new Set());
      fetchMaterials();
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/admin/materials/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', ids: deleteConfirm.ids }) });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to delete'); }
      const result = await res.json();
      setSelectedIds(new Set());
      setDeleteConfirm(null);
      fetchMaterials();
      if (result.failed > 0) {
        showToast(`Deleted ${result.deleted} material(s). ${result.failed} could not be deleted (may be linked to tests).`, 'warning');
      } else if (result.deleted > 0) {
        showToast(`${result.deleted} material(s) deleted successfully.`, 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSingleDelete = (id: string) => { setDeleteConfirm({ ids: [id] }); };

  const activeFilterCount = [searchQuery ? 1 : 0, tubeTypeFilter !== 'all' ? 1 : 0, measurementFilter !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0);
  const clearFilters = () => { setSearchQuery(''); setTubeTypeFilter('all'); setMeasurementFilter('all'); };

  const selectStyle = { backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239CA3AF%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px 16px' };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">Materials</h1>
          <p className="text-gray-500 text-[14px]">
            Manage collection materials, tubes, and sample containers.
            {!loading && <span className="text-gray-400 ml-1">({filteredMaterials.length}{filteredMaterials.length !== materials.length ? ` of ${materials.length}` : ''})</span>}
          </p>
        </div>
        <Button variant="primary" onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }} className="rounded-full shrink-0">
          <Plus className="w-4 h-4 mr-2" />Add Material
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors placeholder:text-gray-400" />
          {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>)}
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
          <select value={tubeTypeFilter} onChange={(e) => setTubeTypeFilter(e.target.value)} className="h-10 px-4 pr-8 text-[14px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors bg-white appearance-none" style={selectStyle}>
            <option value="all">All Tube Types</option>
            {tubeTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
          <select value={measurementFilter} onChange={(e) => setMeasurementFilter(e.target.value)} className="h-10 px-4 pr-8 text-[14px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors bg-white appearance-none" style={selectStyle}>
            <option value="all">All Measurements</option>
            <option value="volume">Volume</option>
            <option value="quantity">Quantity</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700 bg-white px-3 h-10 rounded-full border border-gray-200">
            <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />Active Only
          </label>
          {activeFilterCount > 0 && (<button onClick={clearFilters} className="text-[13px] text-gray-500 hover:text-[#008085] underline underline-offset-2 shrink-0">Clear filters</button>)}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex items-center gap-3 bg-[#E6F7F5]/50 border border-[#008085]/20 rounded-[12px] px-4 py-3" style={{ animation: 'bulkBarIn 0.2s ease-out' }}>
          <style>{bulkBarKeyframes}</style>
          <span className="text-[14px] font-medium text-[#005C5F] whitespace-nowrap">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <button className="inline-flex items-center justify-center rounded-full text-[13px] h-9 px-4 font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#008085] hover:text-[#008085] disabled:opacity-50 transition-colors" onClick={() => handleBulkAction('activate')} disabled={bulkLoading}>
            {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}Activate
          </button>
          <button className="inline-flex items-center justify-center rounded-full text-[13px] h-9 px-4 font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#008085] hover:text-[#008085] disabled:opacity-50 transition-colors" onClick={() => handleBulkAction('deactivate')} disabled={bulkLoading}>Deactivate</button>
          <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading} className="inline-flex items-center gap-1.5 rounded-full text-[13px] h-9 px-4 font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (<div className="p-4 bg-red-50 text-red-600 rounded-[16px] text-sm font-medium border border-red-100">{error}</div>)}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-4 w-12"><input type="checkbox" checked={allFilteredSelected && filteredMaterials.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" /></th>
                  <th className="px-4 py-4">Code</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Tube Type</th>
                  <th className="px-4 py-4">Tube Color</th>
                  <th className="px-4 py-4">Measurement</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {filteredMaterials.map((mat) => {
                  const isSelected = selectedIds.has(mat.id);
                  return (
                    <tr key={mat.id} className={`transition-colors cursor-pointer ${isSelected ? 'bg-[#E6F7F5]/30' : 'hover:bg-gray-50/50'}`} onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(mat.id)} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" /></td>
                      <td className="px-4 py-4 font-mono text-[13px] text-gray-600">{mat.code}</td>
                      <td className="px-4 py-4"><div className="font-semibold text-near-black">{mat.name}</div>{mat.description && <div className="text-[12px] text-gray-500 truncate max-w-[200px]">{mat.description}</div>}</td>
                      <td className="px-4 py-4 text-gray-600">{mat.tube_type || '-'}</td>
                      <td className="px-4 py-4"><div className="flex items-center gap-2"><TubeColorDot color={mat.tube_color} /><span className="text-gray-600 capitalize">{mat.tube_color || '-'}</span></div></td>
                      <td className="px-4 py-4 text-gray-600">{mat.measurement_type === 'volume' ? (<span>{mat.default_volume ? `${mat.default_volume} ${mat.default_unit || 'ml'} capacity` : 'Volume-based'}</span>) : (<span className="text-gray-400">Quantity-based</span>)}</td>
                      <td className="px-4 py-4"><StatusBadge status={mat.is_active ? 'active' : 'inactive'} /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#008085] hover:bg-[#008085]/5 rounded-full transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleToggleActive(mat.id, mat.is_active)} className={`p-2 rounded-full transition-colors ${mat.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={mat.is_active ? 'Deactivate' : 'Activate'}>{mat.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}</button>
                          <button onClick={() => handleSingleDelete(mat.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete permanently"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaterials.length === 0 && (<tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">{materials.length === 0 ? 'No materials found' : 'No materials match your filters'}</td></tr>)}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {filteredMaterials.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                <span className="text-[13px] text-gray-500 font-medium">Select all ({filteredMaterials.length})</span>
              </div>
            )}
            {filteredMaterials.map((mat, index) => {
              const isSelected = selectedIds.has(mat.id);
              return (
                <div key={mat.id} className={`p-4 transition-colors ${isSelected ? 'bg-[#E6F7F5]/20' : 'hover:bg-gray-50/50 active:bg-gray-50'} ${index !== filteredMaterials.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(mat.id)} className="w-4 h-4 mt-1 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                    <div className="flex-1 min-w-0" onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="font-semibold text-near-black text-[15px]">{mat.name}</div>
                        <StatusBadge status={mat.is_active ? 'active' : 'inactive'} />
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[12px] text-gray-500 font-mono px-2 py-0.5 bg-gray-100 rounded-md">{mat.code}</span>
                        {mat.tube_type && <span className="text-[12px] text-gray-500">{mat.tube_type}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-3">
                        <div className="flex items-center gap-1.5"><TubeColorDot color={mat.tube_color} /><span className="capitalize">{mat.tube_color || 'No color'}</span></div>
                        <span className="text-gray-300">•</span>
                        {mat.measurement_type === 'volume' ? (<span>{mat.default_volume ? `${mat.default_volume} ${mat.default_unit || 'ml'} capacity` : 'Volume-based'}</span>) : (<span className="text-gray-400">Quantity-based</span>)}
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button variant="secondary" className="flex-1 rounded-full text-[13px] h-9" onClick={(e) => { e.stopPropagation(); setEditingMaterial(mat); setIsModalOpen(true); }}>Edit</Button>
                        <Button variant="secondary" className="flex-1 rounded-full text-[13px] h-9" onClick={(e) => { e.stopPropagation(); handleToggleActive(mat.id, mat.is_active); }}>{mat.is_active ? 'Deactivate' : 'Activate'}</Button>
                        <button className="h-9 px-3 rounded-full text-[13px] font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleSingleDelete(mat.id); }}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredMaterials.length === 0 && (<div className="py-12 text-center text-gray-500 text-[14px]">{materials.length === 0 ? 'No materials found' : 'No materials match your filters'}</div>)}
          </div>
        </div>
      )}

      {isModalOpen && (<MaterialModal material={editingMaterial} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchMaterials(); }} />)}
      {deleteConfirm && (<ConfirmDeleteModal count={deleteConfirm.ids.length} onConfirm={handleConfirmDelete} onCancel={() => setDeleteConfirm(null)} loading={deleteLoading} />)}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9998] max-w-md" style={{ animation: 'toastIn 0.25s ease-out' }}>
          <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div className={`flex items-start gap-3 px-4 py-3 rounded-[12px] shadow-lg border ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            <span className="text-[14px] font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className={`p-0.5 rounded-full transition-colors shrink-0 ${toast.type === 'error' ? 'text-red-400 hover:text-red-600' : toast.type === 'warning' ? 'text-amber-400 hover:text-amber-600' : 'text-emerald-400 hover:text-emerald-600'}`}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
