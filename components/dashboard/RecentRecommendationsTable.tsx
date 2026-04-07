"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";

export function RecentCasesTable({ 
 recommendations, 
 activeFilter = 'all', 
 onClearFilter, 
 filterLabel 
}: { 
 recommendations: any[],
 activeFilter?: string,
 onClearFilter?: () => void,
 filterLabel?: string
}) {
 const router = useRouter();

 const [searchQuery, setSearchQuery] = useState('');
 const [sortOrder, setSortOrder] = useState<'newest'|'oldest'|'highest'|'lowest'>('newest');

 const processedRecs = recommendations
 .filter(r => {
 if (!searchQuery) return true;
 const q = searchQuery.toLowerCase();
 const pt = r.patientName?.toLowerCase() || '';
 const id = r.display_id?.toLowerCase() || '';
 return pt.includes(q) || id.includes(q);
 })
 .sort((a, b) => {
 if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
 if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
 if (sortOrder === 'highest') return b.total - a.total;
 if (sortOrder === 'lowest') return a.total - b.total;
 return 0;
 });

 return (
 <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-sm">
 <div className="pt-5 px-6 pb-4 flex justify-between items-center border-b border-gray-200">
 <div className="flex items-center gap-3">
 <h2 className="font-heading text-[18px] font-medium m-0 text-near-black">
 {activeFilter !== 'all' ? `Recommendations — ${filterLabel}` : 'Recommendations'}
 </h2>
 {activeFilter !== 'all' && onClearFilter && (
 <button onClick={onClearFilter} className="text-[12px] text-gray-400 hover:text-red-500 font-medium ml-2 transition-colors">
 &times; Clear filter
 </button>
 )}
 </div>
 </div>

 <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center gap-4">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input 
 type="text"
 placeholder="Search by patient or ID..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-[13px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
 />
 </div>
 <div className="relative">
 <select
 value={sortOrder}
 onChange={(e) => setSortOrder(e.target.value as any)}
 className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-10 py-2 text-[13px] font-medium text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer"
 >
 <option value="newest">Newest first</option>
 <option value="oldest">Oldest first</option>
 <option value="highest">Highest value</option>
 <option value="lowest">Lowest value</option>
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 </div>
 </div>

 <div className="pt-3 pb-2 overflow-x-auto">
 <table className="w-full border-collapse min-w-[700px]">
 <thead>
 <tr className="border-b border-gray-200">
 {['ID', 'Patient', 'Status', 'Tests Count', 'Total', 'Date'].map((h, index) => (
 <th key={index} className="bg-gray-50 px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider text-left">
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {processedRecs.map((c, i) => (
 <tr 
 key={i} 
 onClick={() => router.push(`/dashboard/recommendations/${c.id}`)}
 className={`group cursor-pointer transition-colors hover:bg-[#008085]/[0.02] ${i < processedRecs.length - 1 ? 'border-b border-gray-200' : ''}`}
 >
 <td className="px-6 py-4 font-mono text-[13px] text-gray-500">{c.display_id || c.id}</td>
 <td className="px-6 py-4 font-semibold text-[14px] text-near-black">{c.patientName}</td>
 <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
 <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">{c.testsCount}</td>
 <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">€{c.total.toFixed(2)}</td>
 <td className="px-6 py-4 font-body text-[14px] font-normal text-gray-500">
 {new Date(c.created_at).toLocaleDateString()}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 
 {processedRecs.length === 0 && searchQuery && (
 <div className="p-10 text-center text-[14px] text-gray-500">
 No recommendations match your search "{searchQuery}".
 </div>
 )}
 {processedRecs.length === 0 && !searchQuery && (
 <div className="p-10 text-center text-[14px] text-gray-500">
 No recommendations yet. Create your first recommendation.
 </div>
 )}
 </div>
 </div>
 );
}
