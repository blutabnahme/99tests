"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Edit2, Archive, Loader2, ArchiveRestore, Search, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import LaboratoryModal from '@/components/admin/LaboratoryModal';

const bulkBarKeyframes = `@keyframes bulkBarIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`;

function SortableHeader({ label, sortKey, currentSort, onSort, className = '' }: {
  label: string; sortKey: string; currentSort: string; onSort: (key: string) => void; className?: string;
}) {
  const isAsc = currentSort === `${sortKey}_asc`;
  const isDesc = currentSort === `${sortKey}_desc`;
  const handleClick = () => { if (isAsc) onSort(`${sortKey}_desc`); else onSort(`${sortKey}_asc`); };
  return (
    <th className={`px-6 py-4 cursor-pointer select-none hover:text-near-black transition-colors group ${className}`} onClick={handleClick}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col text-[8px] leading-[8px]">
          <span className={isAsc ? 'text-[#008085]' : 'text-gray-300 group-hover:text-gray-400'}>▲</span>
          <span className={isDesc ? 'text-[#008085]' : 'text-gray-300 group-hover:text-gray-400'}>▼</span>
        </span>
      </div>
    </th>
  );
}

export default function LaboratoriesPage() {
  const [laboratories, setLaboratories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<any | null>(null);
  const [error, setError] = useState('');

  // Filters
  const [activeOnly, setActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLdt, setFilterLdt] = useState(false);
  const [filterPad, setFilterPad] = useState(false);
  const [filterPrivate, setFilterPrivate] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Sorting
  const [columnSort, setColumnSort] = useState('name_asc');

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

  useEffect(() => { fetchLaboratories(); }, [fetchLaboratories]);
  useEffect(() => { setSelectedIds(new Set()); }, [activeOnly, searchQuery, filterLdt, filterPad, filterPrivate]);

  // Filtered labs
  const filteredLabs = useMemo(() => {
    return laboratories.filter((lab) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!lab.name?.toLowerCase().includes(q) && !lab.official_name?.toLowerCase().includes(q) && !lab.address_city?.toLowerCase().includes(q) && !lab.aisid?.toLowerCase().includes(q)) return false;
      }
      if (filterLdt && !lab.ldt_config?.enabled) return false;
      if (filterPad && !lab.pad_config?.enabled) return false;
      if (filterPrivate && !lab.is_private) return false;
      return true;
    });
  }, [laboratories, searchQuery, filterLdt, filterPad, filterPrivate]);

  // Sorted labs
  const sortedLabs = useMemo(() => {
    if (!columnSort) return filteredLabs;
    const items = [...filteredLabs];
    items.sort((a, b) => {
      if (columnSort === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (columnSort === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      if (columnSort === 'city_asc') return (a.address_city || '').localeCompare(b.address_city || '');
      if (columnSort === 'city_desc') return (b.address_city || '').localeCompare(a.address_city || '');
      if (columnSort === 'aisid_asc') return (a.aisid || '').localeCompare(b.aisid || '');
      if (columnSort === 'aisid_desc') return (b.aisid || '').localeCompare(a.aisid || '');
      return 0;
    });
    return items;
  }, [filteredLabs, columnSort]);

  // Selection helpers
  const allFilteredSelected = sortedLabs.length > 0 && sortedLabs.every((l) => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedLabs.map((l) => l.id)));
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/laboratories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !currentStatus }) });
      if (!res.ok) throw new Error('Failed to update status');
      fetchLaboratories();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleBulkToggle = async (activate: boolean) => {
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await fetch(`/api/admin/laboratories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: activate }) });
      }
      setSelectedIds(new Set());
      fetchLaboratories();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const activeFilterCount = [searchQuery ? 1 : 0, filterLdt ? 1 : 0, filterPad ? 1 : 0, filterPrivate ? 1 : 0].reduce((a, b) => a + b, 0);
  const clearFilters = () => { setSearchQuery(''); setFilterLdt(false); setFilterPad(false); setFilterPrivate(false); };

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">Laboratories</h1>
          <p className="text-gray-500 text-[14px]">
            Manage partner laboratories and LDT/PAD configurations.
            {!loading && <span className="text-gray-400 ml-1">({sortedLabs.length}{sortedLabs.length !== laboratories.length ? ` of ${laboratories.length}` : ''})</span>}
          </p>
        </div>
        <Button variant="primary" onClick={() => { setEditingLab(null); setIsModalOpen(true); }} className="rounded-full shrink-0">
          <Plus className="w-4 h-4 mr-2" />Add Laboratory
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by name, city, or AISID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-10 pl-10 pr-4 text-[14px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none transition-colors placeholder:text-gray-400" />
          {searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <button onClick={() => setFilterLdt(!filterLdt)} className={`h-9 px-3.5 text-[13px] font-medium rounded-full border transition-colors ${filterLdt ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>LDT</button>
          <button onClick={() => setFilterPad(!filterPad)} className={`h-9 px-3.5 text-[13px] font-medium rounded-full border transition-colors ${filterPad ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>PAD</button>
          <button onClick={() => setFilterPrivate(!filterPrivate)} className={`h-9 px-3.5 text-[13px] font-medium rounded-full border transition-colors ${filterPrivate ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>Private</button>
          <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700 bg-white px-3 h-9 rounded-full border border-gray-200">
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
          <button className="inline-flex items-center justify-center rounded-full text-[13px] h-9 px-4 font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#008085] hover:text-[#008085] disabled:opacity-50 transition-colors" onClick={() => handleBulkToggle(true)} disabled={bulkLoading}>Activate</button>
          <button className="inline-flex items-center justify-center rounded-full text-[13px] h-9 px-4 font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#008085] hover:text-[#008085] disabled:opacity-50 transition-colors" onClick={() => handleBulkToggle(false)} disabled={bulkLoading}>Deactivate</button>
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
                  <th className="px-4 py-4 w-12">
                    <input type="checkbox" checked={allFilteredSelected && sortedLabs.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                  </th>
                  <SortableHeader label="Name" sortKey="name" currentSort={columnSort} onSort={setColumnSort} />
                  <SortableHeader label="City" sortKey="city" currentSort={columnSort} onSort={setColumnSort} />
                  <SortableHeader label="AISID" sortKey="aisid" currentSort={columnSort} onSort={setColumnSort} />
                  <th className="px-6 py-4 w-[70px]">Status</th>
                  <th className="px-6 py-4 w-[90px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {sortedLabs.map((lab) => {
                  const isSelected = selectedIds.has(lab.id);
                  return (
                    <tr key={lab.id} className={`transition-colors cursor-pointer ${isSelected ? 'bg-[#E6F7F5]/30' : 'hover:bg-gray-50/50'}`} onClick={() => { setEditingLab(lab); setIsModalOpen(true); }}>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(lab.id)} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-near-black">{lab.name}</span>
                          {lab.is_private && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Private</span>}
                          {lab.ldt_config?.enabled && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">LDT</span>}
                          {lab.pad_config?.enabled && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">PAD</span>}
                        </div>
                        {lab.official_name && <div className="text-[13px] text-gray-500">{lab.official_name}</div>}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lab.address_city || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-[13px]">{lab.aisid || '-'}</td>
                      <td className="px-6 py-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${lab.is_active ? 'bg-green-500' : 'bg-gray-300'}`} title={lab.is_active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setEditingLab(lab); setIsModalOpen(true); }} className="p-2 text-gray-400 hover:text-[#008085] hover:bg-[#008085]/5 rounded-full transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleToggleActive(lab.id, lab.is_active)} className={`p-2 rounded-full transition-colors ${lab.is_active ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={lab.is_active ? 'Deactivate' : 'Activate'}>{lab.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedLabs.length === 0 && (<tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">{laboratories.length === 0 ? 'No laboratories found' : 'No laboratories match your filters'}</td></tr>)}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {sortedLabs.length > 0 && (
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                <span className="text-[13px] text-gray-500 font-medium">Select all ({sortedLabs.length})</span>
              </div>
            )}
            {sortedLabs.map((lab, index) => {
              const isSelected = selectedIds.has(lab.id);
              return (
                <div key={lab.id} className={`p-4 transition-colors ${isSelected ? 'bg-[#E6F7F5]/20' : 'hover:bg-gray-50/50 active:bg-gray-50'} ${index !== sortedLabs.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(lab.id)} className="w-4 h-4 mt-1 rounded border-gray-300 text-[#008085] focus:ring-[#008085]" />
                    <div className="flex-1 min-w-0" onClick={() => { setEditingLab(lab); setIsModalOpen(true); }}>
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-near-black text-[15px]">{lab.name}</span>
                          {lab.is_private && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Private</span>}
                          {lab.ldt_config?.enabled && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">LDT</span>}
                          {lab.pad_config?.enabled && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">PAD</span>}
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${lab.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                        <Button variant="secondary" className="flex-1 rounded-full text-[13px] h-9" onClick={(e) => { e.stopPropagation(); setEditingLab(lab); setIsModalOpen(true); }}>Edit</Button>
                        <Button variant="secondary" className="flex-1 rounded-full text-[13px] h-9" onClick={(e) => { e.stopPropagation(); handleToggleActive(lab.id, lab.is_active); }}>{lab.is_active ? 'Deactivate' : 'Activate'}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedLabs.length === 0 && (<div className="py-12 text-center text-gray-500 text-[14px]">{laboratories.length === 0 ? 'No laboratories found' : 'No laboratories match your filters'}</div>)}
          </div>
        </div>
      )}

      {isModalOpen && (<LaboratoryModal lab={editingLab} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchLaboratories(); }} />)}
    </div>
  );
}
