"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Upload, Loader2, Search, Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import TestCatalogModal from '@/components/admin/TestCatalogModal';
import ImportTestsModal from '@/components/admin/ImportTestsModal';

export default function CatalogPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<string[]>([]);
  const [laboratories, setLaboratories] = useState<any[]>([]);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;
  
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [labId, setLabId] = useState('all');
  const [activeOnly, setActiveOnly] = useState(true);

  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchFiltersData = async () => {
    try {
      const [catsRes, labsRes] = await Promise.all([
        fetch('/api/admin/catalog/categories'),
        fetch('/api/admin/laboratories')
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (labsRes.ok) setLaboratories(await labsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        active_only: activeOnly.toString()
      });
      if (search) params.append('search', search);
      if (type !== 'all') params.append('type', type);
      if (category !== 'all') params.append('category', category);
      if (labId !== 'all') params.append('lab_id', labId);

      const res = await fetch(`/api/admin/catalog?page=${page}&limit=${limit}&type=${type}&category=${encodeURIComponent(category)}&search=${encodeURIComponent(search)}&active_only=${activeOnly}`);
      if (!res.ok) throw new Error('Failed to fetch tests');
      const data = await res.json();
      
      setTests(data.data);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, type, category, labId, activeOnly]);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchTests();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (category !== 'all') params.append('category', category);
    if (labId !== 'all') params.append('lab_id', labId);
    window.location.href = `/api/admin/catalog/export?${params.toString()}`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-medium text-[24px] lg:text-[28px] text-near-black tracking-tight">
            Test Catalog
          </h1>
          <p className="text-gray-500 text-[14px] mt-1">
            {total} items · {categories.length} categories · {laboratories.filter(l => l.is_active).length} laboratories
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button variant="secondary" className="rounded-full shrink-0" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="secondary" className="rounded-full shrink-0" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => { setEditingTest(null); setIsTestModalOpen(true); }}
            className="rounded-full shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Test
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[16px] border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-[14px] placeholder:text-gray-400"
            placeholder="Search SKU or Name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <select 
          value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="h-11 px-4 text-[14px] rounded-full border border-gray-200 outline-none w-full md:w-36 bg-white shrink-0"
        >
          <option value="all">All Types</option>
          <option value="parameter">Parameters</option>
          <option value="profile">Profiles</option>
        </select>
        
        <select 
          value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="h-11 px-4 text-[14px] rounded-full border border-gray-200 outline-none w-full md:w-48 bg-white shrink-0"
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select 
          value={labId} onChange={(e) => { setLabId(e.target.value); setPage(1); }}
          className="h-11 px-4 text-[14px] rounded-full border border-gray-200 outline-none w-full md:w-48 bg-white shrink-0"
        >
          <option value="all">All Laboratories</option>
          {laboratories.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <label className="flex items-center gap-2 cursor-pointer shrink-0 text-[14px] font-medium text-gray-700">
          <input 
            type="checkbox" 
            checked={activeOnly} 
            onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          Active Only
        </label>
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
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Laboratory</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-body">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingTest(test); setIsTestModalOpen(true); }}>
                    <td className="px-6 py-4 text-gray-500 font-mono text-[13px]">{test.sku}</td>
                    <td className="px-6 py-4 font-semibold text-near-black max-w-[250px] truncate" title={test.name}>{test.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${test.type === 'profile' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                        {test.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">{test.category || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">{test.lab?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {test.price_insured !== null ? `€${Number(test.price_insured).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`w-2.5 h-2.5 rounded-full ${test.is_active ? 'bg-green-500' : 'bg-gray-300'}`} title={test.is_active ? 'Active' : 'Inactive'} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => { setEditingTest(test); setIsTestModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleActive(test.id, test.is_active)}
                          className={`p-2 text-gray-400 rounded-full transition-colors ${test.is_active ? 'hover:text-red-600 hover:bg-red-50' : 'hover:text-green-600 hover:bg-green-50'}`}
                          title={test.is_active ? "Deactivate" : "Activate"}
                        >
                          {test.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
                      No tests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile List => simple stacked view */}
          <div className="lg:hidden bg-white border-y border-gray-200">
            {tests.map((test, index) => (
              <div 
                key={test.id} 
                onClick={() => { setEditingTest(test); setIsTestModalOpen(true); }}
                className={`p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors ${index !== tests.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-near-black text-[15px]">{test.name}</div>
                  <div className={`w-2.5 h-2.5 shrink-0 rounded-full mt-1.5 ${test.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${test.type === 'profile' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>
                    {test.type.toUpperCase()}
                  </span>
                  <span className="text-[12px] text-gray-500 font-mono">{test.sku}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-[12px] text-gray-500 items-center">
                  {test.category && <span className="bg-gray-100 px-2 py-1 rounded-md">{test.category}</span>}
                  {test.lab?.name && <span className="bg-gray-100 px-2 py-1 rounded-md max-w-[150px] truncate">{test.lab.name}</span>}
                  {test.price_insured && <span className="font-medium text-gray-700 ml-auto pt-1">€{Number(test.price_insured).toFixed(2)}</span>}
                </div>
              </div>
            ))}
            {tests.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-[14px]">
                No tests found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination Container */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-gray-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-[13px] h-9 px-4 rounded-full"
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="text-[13px] h-9 px-4 rounded-full"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isTestModalOpen && (
        <TestCatalogModal 
          test={editingTest} 
          categories={categories}
          laboratories={laboratories}
          onClose={() => setIsTestModalOpen(false)} 
          onSuccess={() => { setIsTestModalOpen(false); fetchTests(); fetchFiltersData(); }}
        />
      )}

      {isImportModalOpen && (
        <ImportTestsModal 
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => { setIsImportModalOpen(false); fetchTests(); fetchFiltersData(); }}
        />
      )}
    </div>
  );
}
