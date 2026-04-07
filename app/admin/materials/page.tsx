"use client";
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Archive, Loader2, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { TubeColorDot } from '@/components/admin/TubeColorDot';
import MaterialModal from '@/components/admin/MaterialModal';

export default function MaterialsPage() {
 const [materials, setMaterials] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
 const [error, setError] = useState('');
 const [activeOnly, setActiveOnly] = useState(true);

 // IMPORTANT: Ensure you have run the provided SQL in Supabase to create the `tt_material` table!
 
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

 useEffect(() => {
 fetchMaterials();
 }, [fetchMaterials]);

 const handleToggleActive = async (id: string, currentStatus: boolean) => {
 try {
 const res = await fetch(`/api/admin/materials/${id}`, {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ is_active: !currentStatus })
 });
 if (!res.ok) throw new Error('Failed to update status');
 fetchMaterials();
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
 Materials
 </h1>
 <p className="text-gray-500 text-[14px]">Manage collection materials, tubes, and sample containers.</p>
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
 onClick={() => { setEditingMaterial(null); setIsModalOpen(true); }}
 className="rounded-full shrink-0"
 >
 <Plus className="w-4 h-4 mr-2" />
 Add Material
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
 <LoadingSpinner size="lg" />
 </div>
 ) : (
 <div className="bg-white lg:rounded-[16px] lg:border border-gray-200 overflow-hidden shadow-sm">
 {/* Desktop Table */}
 <div className="hidden lg:block overflow-x-auto">
 <table className="w-full text-left text-[14px] whitespace-nowrap">
 <thead className="bg-gray-50/50 text-gray-500 font-medium text-[12px] uppercase tracking-wider">
 <tr>
 <th className="px-6 py-4">Code</th>
 <th className="px-6 py-4">Name</th>
 <th className="px-6 py-4">Tube Type</th>
 <th className="px-6 py-4">Tube Color</th>
 <th className="px-6 py-4">Measurement</th>
 <th className="px-6 py-4">Status</th>
 <th className="px-6 py-4 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-100 font-body">
 {materials.map((mat) => (
 <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}>
 <td className="px-6 py-4 font-mono text-[13px] text-gray-600">
 {mat.code}
 </td>
 <td className="px-6 py-4">
 <div className="font-semibold text-near-black">{mat.name}</div>
 {mat.description && <div className="text-[12px] text-gray-500 truncate max-w-[200px]">{mat.description}</div>}
 </td>
 <td className="px-6 py-4 text-gray-600">
 {mat.tube_type || '-'}
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <TubeColorDot color={mat.tube_color} />
 <span className="text-gray-600 capitalize">{mat.tube_color || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-gray-600">
 {mat.measurement_type === 'volume' ? (
 <span>{mat.default_volume ? `${mat.default_volume} ${mat.default_unit || 'ml'} capacity` : 'Volume-based'}</span>
 ) : (
 <span className="text-gray-400">Quantity-based</span>
 )}
 </td>
 <td className="px-6 py-4">
 <StatusBadge status={mat.is_active ? 'active' : 'inactive'} />
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
 <button 
 onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}
 className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-colors"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button 
 onClick={() => handleToggleActive(mat.id, mat.is_active)}
 className={`p-2 rounded-full transition-colors ${mat.is_active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
 title={mat.is_active ? "Deactivate" : "Activate"}
 >
 {mat.is_active ? <Archive className="w-4 h-4" /> : <ArchiveRestore className="w-4 h-4" />}
 </button>
 </div>
 </td>
 </tr>
 ))}
 {materials.length === 0 && (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center text-gray-500 bg-gray-50/50">
 No materials found
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile List Container */}
 <div className="lg:hidden bg-white border-y border-gray-200">
 {materials.map((mat, index) => (
 <div 
 key={mat.id} 
 onClick={() => { setEditingMaterial(mat); setIsModalOpen(true); }}
 className={`p-4 hover:bg-gray-50/50 active:bg-gray-50 transition-colors ${index !== materials.length - 1 ? 'border-b border-gray-100' : ''}`}
 >
 <div className="flex items-start justify-between gap-3 mb-1">
 <div className="font-semibold text-near-black text-[15px]">{mat.name}</div>
 <StatusBadge status={mat.is_active ? 'active' : 'inactive'} />
 </div>
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[12px] text-gray-500 font-mono px-2 py-0.5 bg-gray-100 rounded-md">{mat.code}</span>
 {mat.tube_type && <span className="text-[12px] text-gray-500">{mat.tube_type}</span>}
 </div>
 <div className="flex items-center gap-3 text-[13px] text-gray-500 mb-3">
 <div className="flex items-center gap-1.5">
 <TubeColorDot color={mat.tube_color} />
 <span className="capitalize">{mat.tube_color || 'No color'}</span>
 </div>
 {mat.measurement_type === 'volume' ? (
 <>
 <span className="text-gray-300">•</span>
 <span>{mat.default_volume ? `${mat.default_volume} ${mat.default_unit || 'ml'} capacity` : 'Volume-based'}</span>
 </>
 ) : (
 <>
 <span className="text-gray-300">•</span>
 <span className="text-gray-400">Quantity-based</span>
 </>
 )}
 </div>
 
 <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
 <Button 
 variant="secondary"
 className="flex-1 rounded-full text-[13px] h-9"
 onClick={(e) => { e.stopPropagation(); setEditingMaterial(mat); setIsModalOpen(true); }}
 >
 Edit
 </Button>
 <Button 
 variant={mat.is_active ? "danger" : "secondary"}
 className="flex-1 rounded-full text-[13px] h-9"
 onClick={(e) => { e.stopPropagation(); handleToggleActive(mat.id, mat.is_active); }}
 >
 {mat.is_active ? "Deactivate" : "Activate"}
 </Button>
 </div>
 </div>
 ))}
 {materials.length === 0 && (
 <div className="py-12 text-center text-gray-500 text-[14px]">
 No materials found
 </div>
 )}
 </div>
 </div>
 )}

 {isModalOpen && (
 <MaterialModal 
 material={editingMaterial} 
 onClose={() => setIsModalOpen(false)} 
 onSuccess={() => { setIsModalOpen(false); fetchMaterials(); }}
 />
 )}
 </div>
 );
}
