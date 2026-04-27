"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
 const [limit, setLimit] = useState(50);
 
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
 const res = await fetch(`/api/admin/catalog?page=${page}&limit=${limit}&type=${type}&search=${encodeURIComponent(search)}&lab_id=${labId !== 'all' ? labId : ''}&active_only=${activeOnly}`);
 if (!res.ok) throw new Error('Failed to fetch tests');
 const data = await res.json();
 
 setTests(data.data);
 setTotal(data.total);
 } catch (err: any) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 }, [page, search, type, category, labId, activeOnly, limit]);

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
 {total} tests · {laboratories.filter((l: any) => l.is_active).length} laboratories
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
 <div className="flex flex-col md:flex-row gap-3 items-center">
 <div className="relative flex-1 w-full">
 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
 <Search className="h-4 w-4 text-gray-400" />
 </div>
 <input
 type="text"
 className="w-full pl-10 pr-4 h-11 rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[14px] placeholder:text-gray-400"
 placeholder="Search SKU or Name..."
 value={search}
 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
 />
 </div>
 
 <select 
 value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}
 className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full md:w-36 bg-white shrink-0 appearance-none"
 style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' }}
 >
 <option value="all">All Types</option>
 <option value="parameter">Parameters</option>
 <option value="profile">Profiles</option>
 </select>
 
 <select 
 value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
 className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full md:w-48 bg-white shrink-0 appearance-none"
 style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' }}
 >
 <option value="all">All Categories</option>
 {categories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>

 <select 
 value={labId} onChange={(e) => { setLabId(e.target.value); setPage(1); }}
 className="h-11 pl-4 pr-10 text-[14px] rounded-full border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none w-full md:w-48 bg-white shrink-0 appearance-none"
 style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236E7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '20px 20px' }}
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
 <LoadingSpinner size="lg" />
 </div>
 ) : (
 <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
 {/* Desktop Table */}
 <div className="hidden lg:block overflow-x-auto">
 <table className="w-full text-left text-[14px] whitespace-nowrap">
 <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
 <tr>
 <th className="px-4 py-4 w-[130px]">SKU</th>
 <th className="px-4 py-4">Name</th>
 <th className="px-4 py-4 w-[100px]">Type</th>
 <th className="px-4 py-4 w-[150px]">Laboratory</th>
 <th className="px-4 py-4 w-[90px]">Price</th>
 <th className="px-4 py-4 w-[70px]">Status</th>
 <th className="px-4 py-4 w-[90px] text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 font-body">
 {tests.map((test) => (
 <tr key={test.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingTest(test); setIsTestModalOpen(true); }}>
 <td className="px-4 py-4 text-gray-500 font-mono text-[12px]">{test.sku}</td>
 <td className="px-4 py-4 font-semibold text-near-black truncate" title={test.name}>{test.name}</td>
 <td className="px-4 py-4">
 <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider ${test.type === 'profile' ? 'bg-blue-50 text-blue-600' : 'bg-primary/10 text-primary'}`}>
 {test.type.toUpperCase()}
 </span>
 </td>
 <td className="px-4 py-4 text-gray-600 truncate">{test.lab?.name || '-'}</td>
 <td className="px-4 py-4 text-gray-600">
 {test.price_insured !== null ? `€${Number(test.price_insured).toFixed(2)}` : '-'}
 </td>
 <td className="px-4 py-4">
 <div className={`w-2.5 h-2.5 rounded-full ${test.is_active ? 'bg-green-500' : 'bg-gray-300'}`} title={test.is_active ? 'Active' : 'Inactive'} />
 </td>
 <td className="px-4 py-4">
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
 <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
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

 {/* Pagination */}
 {!loading && totalPages > 1 && (
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className="text-[13px] text-gray-500">
 Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
 </span>
 <select
 value={limit}
 onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
 className="h-8 pl-2 pr-7 text-[12px] rounded-full border border-gray-200 focus:border-[#008085] focus:ring-1 focus:ring-[#008085] outline-none bg-white appearance-none"
 style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2214%22%20height%3D%2214%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239CA3AF%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%20%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '14px 14px' }}
 >
 <option value={25}>25 / page</option>
 <option value={50}>50 / page</option>
 <option value={100}>100 / page</option>
 </select>
 </div>
 <div className="flex items-center gap-1">
 <button
 disabled={page === 1}
 onClick={() => setPage(page - 1)}
 className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[13px]"
 >
 ‹
 </button>
 {(() => {
 const pages: (number | '...')[] = [];
 if (totalPages <= 7) {
 for (let i = 1; i <= totalPages; i++) pages.push(i);
 } else {
 pages.push(1);
 if (page > 3) pages.push('...');
 for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
 pages.push(i);
 }
 if (page < totalPages - 2) pages.push('...');
 pages.push(totalPages);
 }
 return pages.map((p, idx) =>
 p === '...' ? (
 <span key={`ellipsis-${idx}`} className="h-9 w-6 flex items-center justify-center text-gray-400 text-[13px]">…</span>
 ) : (
 <button
 key={p}
 onClick={() => setPage(p as number)}
 className={`h-9 min-w-[36px] px-2 flex items-center justify-center rounded-full text-[13px] font-medium transition-colors ${
 p === page
 ? 'bg-[#008085] text-white'
 : 'border border-gray-200 text-gray-600 hover:border-gray-300'
 }`}
 >
 {p}
 </button>
 )
 );
 })()}
 <button
 disabled={page === totalPages}
 onClick={() => setPage(page + 1)}
 className="h-9 w-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-[13px]"
 >
 ›
 </button>
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
