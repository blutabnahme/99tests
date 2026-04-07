"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toast } from '@/components/shared/Toast';
import { Search, Plus, ChevronLeft, ChevronRight, FileText, Loader2, Download, MoreHorizontal, FlaskConical, Calendar, FilterX, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

// Helper debounce hook
function useDebounce<T>(value: T, delay: number): T {
 const [debouncedValue, setDebouncedValue] = useState<T>(value);
 useEffect(() => {
 const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
 return () => clearTimeout(handler);
 }, [value, delay]);
 return debouncedValue;
}

export default function RecommendationsList() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 useEffect(() => {
 const toast = searchParams.get('toast');
 if (toast) {
 setToastMessage(toast);
 window.history.replaceState({}, '', window.location.pathname);
 }
 }, [searchParams]);
 
 const [searchQuery, setSearchQuery] = useState('');
 const debouncedSearch = useDebounce(searchQuery, 300);
 const [statusFilter, setStatusFilter] = useState('all');
 const [dateFrom, setDateFrom] = useState('');
 const [dateTo, setDateTo] = useState('');
 const [sortParam, setSortParam] = useState('newest');
 const [labFilter, setLabFilter] = useState('all');
 
 const [labs, setLabs] = useState<{id: string, name: string}[]>([]);
 const [data, setData] = useState<any[]>([]);
 const [total, setTotal] = useState(0);
 const [page, setPage] = useState(1);
 const limit = 20;
 
 const [loading, setLoading] = useState(true);
 const [exporting, setExporting] = useState(false);
 const [activeMenu, setActiveMenu] = useState<string | null>(null);
 const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
 const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

 // Click outside menu handler
 useEffect(() => {
 const handleClickOutside = (e: any) => {
 try {
 const el = e.target;
 if (el && typeof (el as any).closest === 'function' && (el as any).closest('.action-menu-trigger')) {
 return;
 }
 } catch {
 // ignore
 }
 setActiveMenu(null);
 };
 document.addEventListener('click', handleClickOutside);
 document.addEventListener('scroll', handleClickOutside, true);
 return () => {
 document.removeEventListener('click', handleClickOutside);
 document.removeEventListener('scroll', handleClickOutside, true);
 };
 }, []);

 // Retrieve Labs list
 useEffect(() => {
 fetch('/api/doctor/laboratories')
 .then(res => res.json())
 .then(json => {
 if (json.data) setLabs(json.data);
 })
 .catch(console.error);
 }, []);

 const buildQueryUrl = (base: string) => {
 let url = base;
 if (statusFilter !== 'all') url += `&status=${statusFilter}`;
 if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
 if (dateFrom) url += `&date_from=${dateFrom}`;
 if (dateTo) url += `&date_to=${dateTo}`;
 if (sortParam) url += `&sort=${sortParam}`;
 return url;
 };

 useEffect(() => {
 const fetchData = async () => {
 setLoading(true);
 try {
 const url = buildQueryUrl(`/api/doctor/recommendations?page=${page}&limit=${limit}`);
 const res = await fetch(url);
 const result = await res.json();
 if (result.data) {
 let finalData = result.data;
 if (sortParam === 'patient_asc') {
 finalData.sort((a:any, b:any) => (a.patient?.first_name || '').localeCompare(b.patient?.first_name || ''));
 } else if (sortParam === 'patient_desc') {
 finalData.sort((a:any, b:any) => (b.patient?.first_name || '').localeCompare(a.patient?.first_name || ''));
 }
 if (labFilter !== 'all') {
 finalData = finalData.filter((item: any) => {
 const labNames = item.items?.filter((i:any) => i.test?.laboratory?.name).map((i:any) => i.test.laboratory.name);
 return labNames?.includes(labFilter);
 });
 }
 setData(finalData);
 setTotal(result.total);
 } else {
 setData([]);
 setTotal(0);
 }
 } catch (err) {
 console.error("Failed to fetch recommendations:", err);
 } finally {
 setLoading(false);
 }
 };

 fetchData();
 }, [page, statusFilter, debouncedSearch, dateFrom, dateTo, sortParam]);

 const handleExport = async () => {
 try {
 setExporting(true);
 const url = buildQueryUrl(`/api/doctor/recommendations/export?`);
 const response = await fetch(url);
 if (!response.ok) throw new Error('Export failed');
 const blob = await response.blob();
 const downloadUrl = window.URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = downloadUrl;
 link.download = `99tests-recommendations-${new Date().toISOString().split('T')[0]}.xlsx`;
 document.body.appendChild(link);
 link.click();
 link.remove();
 window.URL.revokeObjectURL(downloadUrl);
 } catch (err) {
 console.error(err);
 alert('Failed to construct export file.');
 } finally {
 setExporting(false);
 }
 };

 const clearFilters = () => {
 setSearchQuery('');
 setStatusFilter('all');
 setDateFrom('');
 setDateTo('');
 setSortParam('newest');
 setLabFilter('all');
 setPage(1);
 };

 const handleSendToPatient = async (id: string) => {
 try {
 const res = await fetch(`/api/doctor/recommendations/${id}/send`, { method: 'POST' });
 if (!res.ok) throw new Error('Failed to send recommendation');
 window.location.reload();
 } catch (err: any) { alert(err.message); }
 };

 const handleResendToPatient = handleSendToPatient;

 const handleDelete = async (id: string) => {
 try {
 const res = await fetch(`/api/doctor/recommendations/${id}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ status: 'cancelled' }),
 });
 if (!res.ok) throw new Error('Failed to delete recommendation');
 setDeleteModal({ open: false, id: null });
 setToastMessage('Recommendation deleted');
 router.refresh();
 } catch (err: any) { alert(err.message); }
 };

 const getActions = (recommendation: any) => {
 const status = recommendation.status === 'created' ? 'draft' : recommendation.status;
 const actions = [];

 // Always available
 actions.push({
 label: 'View Details',
 onClick: () => router.push(`/dashboard/recommendations/${recommendation.id}`),
 disabled: false,
 });

 // Edit — only for draft and sent
 if (['draft', 'sent'].includes(status)) {
 actions.push({
 label: 'Edit Recommendation',
 onClick: () => router.push(`/dashboard/recommendations/${recommendation.id}/edit`),
 disabled: false,
 });
 }

 // Send to Patient — only for draft, with validation
 if (status === 'draft') {
 const canSend = Boolean(
 recommendation.patient_id &&
 recommendation.items_count > 0 &&
 recommendation.collection_preference &&
 recommendation.results_delivery
 );

 actions.push({
 label: 'Send to Patient',
 onClick: canSend ? () => handleSendToPatient(recommendation.id) : undefined,
 disabled: !canSend,
 hint: !canSend ? 'Complete all required fields first' : undefined,
 });
 }

 // Resend — only for sent
 if (status === 'sent') {
 actions.push({
 label: 'Resend to Patient',
 onClick: () => handleResendToPatient(recommendation.id),
 disabled: false,
 });
 }

 // Delete (soft) — only for draft and sent
 if (['draft', 'sent'].includes(status)) {
 actions.push({
 label: 'Delete',
 onClick: () => setDeleteModal({ open: true, id: recommendation.id }),
 disabled: false,
 danger: true,
 });
 }

 return actions;
 };

 const totalPages = Math.ceil(total / limit) || 1;
 const isFiltered = debouncedSearch || statusFilter !== 'all' || dateFrom || dateTo || sortParam !== 'newest' || labFilter !== 'all';

 return (
 <div className="max-w-7xl mx-auto space-y-6">
 {toastMessage && (
 <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
 )}
 
 {/* Header */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h1 className="font-heading text-[28px] font-medium text-near-black tracking-tight">Recommendations</h1>
 <p className="text-[14px] text-gray-500 mt-1">Search, filter, and manage all your recommendations.</p>
 </div>
 <Link href="/dashboard/recommendations/new">
 <Button variant="primary" className="rounded-full px-6 h-11 text-[14px] flex items-center gap-2 shadow-sm">
 <Plus className="w-4 h-4"/> New Recommendation
 </Button>
 </Link>
 </div>

 {/* Filters (Outside Wrapper) */}
 <div className="space-y-4 mb-2">
 
 {/* Primary Controls Row */}
 <div className="flex flex-col lg:flex-row gap-3">
 <div className="relative flex-1">
 <input 
 type="text" 
 placeholder="Search by patient name, ID, or email..."
 value={searchQuery}
 onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
 className="w-full h-10 pl-10 pr-4 text-[13px] bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-primary transition-colors placeholder:text-gray-400"
 />
 <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
 </div>

 <div className="flex flex-wrap gap-3 items-center">
 <div className="relative">
 <select 
 value={statusFilter} 
 onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
 className="appearance-none h-10 pl-4 pr-10 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-full outline-none cursor-pointer hover:bg-gray-50 transition-colors"
 >
 <option value="all">All Statuses</option>
 <option value="created">Draft</option>
 <option value="sent">Sent</option>
 <option value="paid">Paid</option>
 <option value="shipped">Shipped</option>
 <option value="collecting">Collecting</option>
 <option value="at_lab">At Lab</option>
 <option value="results_ready">Results Ready</option>
 <option value="cancelled">Cancelled</option>
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 </div>

 <div className="relative">
 <select 
 value={labFilter} 
 onChange={(e) => { setLabFilter(e.target.value); setPage(1); }}
 className="appearance-none h-10 pl-4 pr-10 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-full outline-none cursor-pointer hover:bg-gray-50 transition-colors"
 >
 <option value="all">All Laboratories</option>
 {labs.map(lab => (
 <option key={lab.id} value={lab.name}>{lab.name}</option>
 ))}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 </div>

 <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 h-10 hover:bg-gray-50 transition-colors">
 <Calendar className="w-4 h-4 text-gray-400" />
 <input 
 type="date"
 value={dateFrom}
 title="Date From"
 onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
 className="text-[12px] bg-transparent outline-none w-[110px] text-gray-600 cursor-text"
 />
 <span className="text-gray-300">-</span>
 <input 
 type="date"
 value={dateTo}
 title="Date To"
 onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
 className="text-[12px] bg-transparent outline-none w-[110px] text-gray-600 cursor-text"
 />
 </div>

 <div className="relative">
 <select 
 value={sortParam} 
 onChange={(e) => { setSortParam(e.target.value); setPage(1); }}
 className="appearance-none h-10 pl-4 pr-10 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-full outline-none cursor-pointer hover:bg-gray-50 transition-colors"
 >
 <option value="newest">Newest first</option>
 <option value="oldest">Oldest first</option>
 <option value="highest">Highest value</option>
 <option value="lowest">Lowest value</option>
 <option value="patient_asc">Patient A-Z</option>
 <option value="patient_desc">Patient Z-A</option>
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 </div>

 <Button 
 variant="ghost" 
 onClick={handleExport}
 disabled={exporting || loading || total === 0}
 className="h-10 px-4 text-[13px] font-medium rounded-full border border-gray-200"
 >
 {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
 Export
 </Button>
 </div>
 </div>

 {/* Active Filter Chips */}
 {isFiltered && (
 <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-gray-50">
 <span className="text-[12px] text-gray-400 mr-1 pt-1">Active filters:</span>
 
 {debouncedSearch && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
 Search: {debouncedSearch}
 <button onClick={() => setSearchQuery('')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
 </span>
 )}
 {statusFilter !== 'all' && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
 Status: {statusFilter.replace('_', ' ')}
 <button onClick={() => setStatusFilter('all')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
 </span>
 )}
 {(dateFrom || dateTo) && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
 Date: {dateFrom || 'Any'} to {dateTo || 'Any'}
 <button onClick={() => {setDateFrom(''); setDateTo('');}} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
 </span>
 )}
 {sortParam !== 'newest' && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
 Sort: {sortParam.replace('_', ' ')}
 <button onClick={() => setSortParam('newest')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
 </span>
 )}
 
 {labFilter !== 'all' && (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 mt-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
 Lab: {labFilter}
 <button onClick={() => setLabFilter('all')} className="hover:bg-primary/20 rounded-full p-0.5"><X className="w-3 h-3"/></button>
 </span>
 )}
 
 <button onClick={clearFilters} className="text-[12px] text-gray-500 hover:text-gray-700 underline pt-1 ml-2">Clear all filters</button>
 </div>
 )}

 </div>

 <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 flex flex-col">
 
 {loading ? (
 <div className="flex justify-center items-center py-20 min-h-[400px]">
 <LoadingSpinner size="md" />
 </div>
 ) : (
 <>
 {/* Results Summary & Table */}
 <div className="p-0 overflow-x-auto min-h-[400px]">
 <div className="px-6 py-4 border-b border-gray-100/60 bg-white">
 <span className="text-[13px] text-gray-500 font-medium tracking-tight">
 Showing <span className="text-gray-900">{Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)}</span> of <span className="text-gray-900">{total}</span> recommendations
 </span>
 </div>
 
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-gray-100 text-[12px] font-medium text-gray-500 uppercase tracking-wider bg-white">
 <th className="py-4 pl-6 font-medium w-[100px]">ID</th>
 <th className="py-4 font-medium">Patient</th>
 <th className="py-4 font-medium">Status</th>
 <th className="py-4 text-center font-medium">Tests</th>
 <th className="py-4 font-medium">Lab(s)</th>
 <th className="py-4 text-center font-medium">Total</th>
 <th className="py-4 text-center font-medium">Date</th>
 <th className="py-4 pr-6 text-right font-medium">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50 bg-white">
 {data.length === 0 ? (
 <tr>
 <td colSpan={8} className="py-20 text-center bg-gray-50/10">
 <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
 <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4">
 {isFiltered ? <FilterX className="w-8 h-8 text-gray-300"/> : <FileText className="w-8 h-8 text-gray-300"/>}
 </div>
 <h3 className="text-[16px] text-near-black font-semibold mb-1">
 {isFiltered ? "No recommendations match your filters" : "No recommendations yet"}
 </h3>
 <p className="text-[14px] text-gray-500 mb-6 text-center">
 {isFiltered ? "Try adjusting your search or filter criteria to find what you're looking for." : "Create your first recommendation to get started and begin generating laboratory tests."}
 </p>
 {isFiltered ? (
 <Button variant="ghost" className="border border-gray-200" onClick={clearFilters}>Clear filters</Button>
 ) : (
 <Link href="/dashboard/recommendations/new">
 <Button variant="primary" className="rounded-full px-6 shadow-sm">Create Recommendation</Button>
 </Link>
 )}
 </div>
 </td>
 </tr>
 ) : (
 data.map((row) => {
 const testNames: string[] = row.items?.filter((i:any)=>i.test?.name).map((i:any) => i.test.name) || [];
 const labs: string[] = Array.from(new Set(row.items?.filter((i:any)=>i.test?.laboratory?.name).map((i:any) => i.test.laboratory.name)));
 
 return (
 <tr 
 key={row.id} 
 className="group hover:bg-gray-50/50 transition-colors text-[14px] relative"
 >
 <td 
 className="py-4 pl-6 w-[100px] font-mono text-[13px] text-gray-500 cursor-pointer hover:text-primary transition-colors"
 onClick={() => router.push(`/dashboard/recommendations/${row.id}`)}
 >
 {row.display_id}
 </td>
 <td className="py-4" onClick={() => router.push(`/dashboard/recommendations/${row.id}`)} style={{cursor: 'pointer'}}>
 <div className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{row.patient ? `${row.patient.first_name} ${row.patient.last_name}` : 'Unknown'}</div>
 <div className="text-[12px] text-gray-500 group-hover:text-gray-600 transition-colors">{row.patient?.email}</div>
 </td>
 <td className="py-4" onClick={() => router.push(`/dashboard/recommendations/${row.id}`)} style={{cursor: 'pointer'}}>
 <StatusBadge status={row.status} />
 </td>
 <td className="py-4 text-center relative group/test">
 <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 text-[12px] font-bold px-2 py-1.5 rounded-full hover:bg-gray-200 transition-colors min-w-[60px] cursor-help">
 {row.items_count} test{row.items_count !== 1 ? 's' : ''}
 </span>
 
 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max min-w-[200px] max-w-[280px] bg-white border border-gray-100 shadow-md rounded-lg p-3 z-50 opacity-0 invisible group-hover/test:opacity-100 group-hover/test:visible transition-colors duration-150 text-left pointer-events-none">
 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45" />
 <div className="flex flex-col gap-2.5 relative z-10 bg-white">
 {row.items?.map((item:any, idx:number) => (
 <div key={idx} className="flex flex-col">
 <div className="flex items-start gap-1.5">
 <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"/>
 <div className="flex flex-wrap items-baseline gap-1">
 <span className="text-sm font-medium text-gray-900 leading-snug">{item.test?.name}</span>
 {item.test?.sku && <span className="text-xs text-gray-400">({item.test.sku})</span>}
 </div>
 </div>
 {item.test?.laboratory?.name && (
 <div className="text-xs text-gray-400 ml-3">
 {item.test.laboratory.name}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </td>
 <td className="py-4" onClick={() => router.push(`/dashboard/recommendations/${row.id}`)} style={{cursor: 'pointer'}}>
 <div className="text-[13px] text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
 {labs[0] || '-'} {labs.length > 1 ? <span className="text-gray-400 text-[11px] ml-1">+{labs.length - 1} more</span> : null}
 </div>
 </td>
 <td className="py-4 text-center font-medium text-gray-900" onClick={() => router.push(`/dashboard/recommendations/${row.id}`)} style={{cursor: 'pointer'}}>
 €{Number(row.calculated_total || 0).toFixed(2)}
 </td>
 <td className="py-4 text-center group/date relative cursor-help" onClick={() => router.push(`/dashboard/recommendations/${row.id}`)}>
 <div className="text-[13px] text-gray-900">{new Date(row.created_at).toLocaleDateString()}</div>
 <div className="text-[11px] text-gray-400 absolute left-1/2 -translate-x-1/2 opacity-0 group-hover/date:opacity-100 transition-opacity bg-white px-1.5 py-0.5 -mt-6 rounded border shadow-sm w-max z-10">
 {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
 </div>
 </td>
 <td className="py-4 text-right pr-6 relative w-24">
 <div className="flex justify-end w-full">
 <button 
 onClick={(e) => { 
 e.stopPropagation(); 
 if (activeMenu === row.id) { setActiveMenu(null); return; }
 const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
 setMenuPos({ top: rect.bottom + 4, left: window.innerWidth - rect.right });
 setActiveMenu(row.id); 
 }}
 className="action-menu-trigger p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:ring-2 focus:ring-primary/20 outline-none"
 >
 <MoreHorizontal className="w-5 h-5 pointer-events-none"/>
 </button>
 </div>
 
 {activeMenu === row.id && typeof document !== 'undefined' && createPortal(
 <div 
 className="fixed bg-white border border-gray-100 shadow-xl rounded-xl flex flex-col w-48 z-[9999] overflow-hidden" 
 style={{ top: menuPos.top, right: menuPos.left }}
 onClick={e => e.stopPropagation()}
 >
 {getActions(row).map((action, i) => (
 <button
 key={i}
 onClick={(e) => {
 e.stopPropagation();
 if (action.disabled) return;
 setActiveMenu(null);
 if (action.onClick) action.onClick();
 }}
 disabled={action.disabled}
 className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
 action.danger
 ? 'text-red-600 hover:bg-red-50'
 : action.disabled
 ? 'text-gray-400 cursor-not-allowed opacity-60'
 : 'text-gray-700 hover:bg-gray-50'
 }`}
 title={action.hint || ''}
 >
 {action.label}
 {action.disabled && action.hint && (
 <span className="block text-[10px] text-gray-400 mt-0.5 leading-tight">{action.hint}</span>
 )}
 </button>
 ))}
 </div>,
 document.body
 )}
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination Controls */}
 {totalPages > 0 && (
 <div className="flex items-center justify-between p-5 border-t border-gray-100 bg-white rounded-b-[20px]">
 <span className="text-[13px] text-gray-500 font-medium">
 Page {page} of {totalPages}
 </span>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 className="h-9 px-4 text-[13px] border border-gray-200 bg-white shadow-sm font-medium hover:bg-gray-50 disabled:opacity-50"
 disabled={page === 1}
 onClick={() => setPage(Math.max(1, page - 1))}
 >
 Previous
 </Button>
 <Button
 variant="ghost"
 className="h-9 px-4 text-[13px] border border-gray-200 bg-white shadow-sm font-medium hover:bg-gray-50 disabled:opacity-50"
 disabled={page === totalPages}
 onClick={() => setPage(Math.min(totalPages, page + 1))}
 >
 Next
 </Button>
 </div>
 </div>
 )}
 </>
 )}
 </div>

 <ConfirmModal
 open={deleteModal.open}
 onClose={() => setDeleteModal({ open: false, id: null })}
 title="Delete Recommendation?"
 description="This recommendation will be cancelled and removed from your active list. This action cannot be undone."
 actions={[
 {
 label: 'Delete Recommendation',
 onClick: () => deleteModal.id && handleDelete(deleteModal.id),
 variant: 'danger',
 },
 {
 label: 'Cancel',
 onClick: () => setDeleteModal({ open: false, id: null }),
 variant: 'outline',
 },
 ]}
 />
 </div>
 );
}
