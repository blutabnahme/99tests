"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Building2, Home, Search, MoreHorizontal, Eye, Copy, XCircle, CheckCircle2, ChevronLeft, ChevronRight, ChevronDown, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';

export function CasesOverviewTable({ recommendations }: { recommendations: any[] }) {
 const router = useRouter();
 const [selectedTab, setSelectedTab] = useState("All");
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const [copiedToken, setCopiedToken] = useState<string | null>(null);
 const t = useTranslations('hc.recommendations');
 
 const casesPerPage = 10;
 const tabs = [t('all'), t('open'), t('matched'), t('booked'), t('completed')];

 // Filtering
 const filteredCases = useMemo(() => {
 let filtered = recommendations;
 
 // Status filter
 if (selectedTab === t('open')) {
 filtered = filtered.filter(c => c.status === 'created' || c.status === 'pending_payment');
 } else if (selectedTab !== t('all')) {
 // Map translated tab values back to english enum states where needed, or just compare if they align roughly.
 const engMap: any = { [t('matched')]: 'matched', [t('booked')]: 'booked', [t('completed')]: 'completed' };
 filtered = filtered.filter(c => c.status === engMap[selectedTab]);
 }
 
 // Text search (patient name or token)
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 filtered = filtered.filter(c => 
 c.patientName.toLowerCase().includes(q) || 
 c.token.toLowerCase().includes(q)
 );
 }
 
 return filtered;
 }, [recommendations, selectedTab, searchQuery]);

 // Pagination
 const totalPages = Math.max(1, Math.ceil(filteredCases.length / casesPerPage));
 // Ensure current page is valid after filtering
 const safeCurrentPage = Math.min(currentPage, totalPages);
 
 const currentCases = useMemo(() => {
 const start = (safeCurrentPage - 1) * casesPerPage;
 return filteredCases.slice(start, start + casesPerPage);
 }, [filteredCases, safeCurrentPage]);

 // Handle Tab change
 const handleTabChange = (tab: string) => {
 setSelectedTab(tab);
 setCurrentPage(1); // Reset to page 1 on filter change
 };

 // Handle Search change
 const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 setSearchQuery(e.target.value);
 setCurrentPage(1); // Reset to page 1 on search
 };

 const handleCopyLink = (e: React.MouseEvent, token: string) => {
 e.stopPropagation();
 navigator.clipboard.writeText(`http://localhost:3000/patient/${token}`);
 setCopiedToken(token);
 setTimeout(() => setCopiedToken(null), 2000);
 };

 const handleCancelCase = (e: React.MouseEvent, id: string) => {
 e.stopPropagation();
 // For now, this is a placeholder. In a real app, this would call an API route.
 alert(t('alertCancel', { id }));
 };

 const handleViewDetails = (e: React.MouseEvent, id: string) => {
 e.stopPropagation();
 router.push(`/dashboard/recommendations/${id}`);
 };

 // Prevent row click when interacting with dropdown
 const handleDropdownClick = (e: React.MouseEvent) => {
 e.stopPropagation();
 };

 return (
 <div className="bg-white rounded-[16px] border border-gray-200 overflow-hidden shadow-sm">
 
 {/* Table Header Controls */}
 <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
 {/* Desktop Filter Tabs */}
 <div className="hidden sm:flex gap-6 w-full sm:w-auto">
 {tabs.map(tab => {
 const isActive = selectedTab === tab;
 return (
 <button
 key={tab}
 onClick={() => handleTabChange(tab)}
 className={`py-2 text-[13px] font-semibold transition-colors duration-150 whitespace-nowrap border-b-2 ${
 isActive 
 ? "border-primary-dark text-primary-dark" 
 : "border-transparent text-gray-500 hover:text-primary-dark"
 }`}
 >
 {tab}
 </button>
 );
 })}
 </div>

 {/* Mobile Dropdown */}
 <div className="block sm:hidden relative w-full">
 <select 
 value={selectedTab}
 onChange={(e) => handleTabChange(e.target.value)}
 className="w-full h-10 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-near-black px-3 appearance-none focus:outline-none focus:ring-2 focus:ring-[#005C5F]/20"
 >
 {tabs.map(tab => (
 <option key={tab} value={tab}>{tab}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
 <ChevronDown className="w-4 h-4 text-gray-500" />
 </div>
 </div>

 {/* Search Bar */}
 <div className="relative w-full sm:w-[300px]">
 <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input 
 type="text" 
 placeholder={t('search', { fallback: "Search" })}
 value={searchQuery}
 onChange={handleSearchChange}
 className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark transition-colors placeholder:text-gray-400"
 />
 </div>
 </div>

 {/* Table Content */}
 <div className="w-full">
 <div className="responsive-table-wrapper">
 <table className="w-full border-collapse min-w-[900px]">
 <thead>
 <tr className="bg-gray-50/50 border-b border-gray-200">
 {[t('thPatient'), t('thTest'), t('thCollector'), t('thType'), t('thUrgency'), t('thStatus'), t('thDate'), ""].map((h, index) => (
 <th key={index} className="px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-left">
 {h}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {currentCases.map((c, i) => (
 <tr 
 key={c.id} 
 onClick={() => router.push(`/dashboard/recommendations/${c.id}`)}
 className={`group cursor-pointer transition-colors hover:bg-gray-50 ${i < currentCases.length - 1 ? 'border-b border-gray-200' : ''}`}
 >
 <td className="px-6 py-4">
 <div className="font-semibold text-[14px] text-near-black">{c.patientName}</div>
 <div className="text-[12px] text-gray-500 font-mono mt-0.5">{c.token}</div>
 </td>
 <td className="px-6 py-4 text-[13px] text-near-black capitalize truncate max-w-[150px]">
 {c.testType}
 </td>
 <td className="px-6 py-4 text-[13px]">
 {c.bcName ? (
 <span className="text-near-black font-medium">{c.bcName}</span>
 ) : c.applicationCount > 0 ? (
 <span className="text-[12px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
 {c.applicationCount === 1 ? t('applicant', { count: 1 }) : t('applicants', { count: c.applicationCount })}
 </span>
 ) : (
 <span className="text-gray-400 text-[12px] italic">{t('noApplicants')}</span>
 )}
 </td>
 <td className="px-6 py-4">
 <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
 {c.mobility === "home_visit" 
 ? <Home className="w-[14px] h-[14px] text-orange-500" />
 : <Building2 className="w-[14px] h-[14px] text-steel-500" />
 }
 {c.mobility === "home_visit" ? t('homeVisit') : t('practice')}
 </span>
 </td>
 <td className="px-6 py-4">
 {c.urgency_level === 'emergency' ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#FEF0F2] text-[#008085]">
 {t('emergency')}
 </span>
 ) : c.urgency_level === 'urgent' ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#FFF7ED] text-[#D97706]">
 {t('urgent')}
 </span>
 ) : (
 <span className="text-[12px] text-gray-400">{t('normal')}</span>
 )}
 </td>
 <td className="px-6 py-4 flex flex-col items-start gap-1">
 <StatusBadge status={c.status} />
 {c.status === 'completed' && c.payoutStatus === 'pending_confirmation' && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 mt-1 whitespace-nowrap">
 <AlertCircle className="w-3 h-3" /> {t('actionNeeded')}
 </span>
 )}
 </td>
 <td className="px-6 py-4 text-[13px] font-medium text-gray-500">
 {new Date(c.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
 </td>
 <td className="px-6 py-4 text-right relative" onClick={handleDropdownClick}>
 {/* Custom simple dropdown via hover/focus-within */}
 <div className="relative group/dropdown inline-block text-left">
 <button className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors focus:outline-none focus:bg-gray-200">
 <MoreHorizontal className="w-4 h-4" />
 </button>
 {/* Dropdown Menu */}
 <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible group-focus-within/dropdown:opacity-100 group-focus-within/dropdown:visible transition-colors z-10 overflow-hidden transform origin-top-right scale-95 group-hover/dropdown:scale-100 group-focus-within/dropdown:scale-100">
 <div className="py-1">
 <button 
 onClick={(e) => handleViewDetails(e, c.id)}
 className="w-full text-left px-4 py-2.5 text-[13px] text-near-black hover:bg-gray-50 flex items-center gap-2"
 >
 <Eye className="w-4 h-4 text-gray-500" />
 {t('viewDetails')}
 </button>
 <button 
 onClick={(e) => handleCopyLink(e, c.token)}
 className="w-full text-left px-4 py-2.5 text-[13px] text-near-black hover:bg-gray-50 flex items-center gap-2"
 >
 {copiedToken === c.token ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 ) : (
 <Copy className="w-4 h-4 text-gray-500" />
 )}
 {copiedToken === c.token ? t('copyActions.copied', { fallback: "Copied!" }) : t('copyUrl')}
 </button>
 <div className="h-px bg-gray-100 my-1"></div>
 <button 
 onClick={(e) => handleCancelCase(e, c.id)}
 className="w-full text-left px-4 py-2.5 text-[13px] text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 font-semibold"
 >
 <XCircle className="w-4 h-4" />
 {t('cancelCase')}
 </button>
 </div>
 </div>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Mobile card view */}
 <div className="mobile-card-list">
 {currentCases.map((c: any) => (
 <div
 key={c.id}
 className="border-b border-gray-100 p-4 cursor-pointer active:bg-gray-50 last:border-0"
 onClick={() => router.push(`/dashboard/recommendations/${c.id}`)}
 >
 <div className="flex items-center justify-between mb-2">
 <div>
 <div className="text-[14px] font-medium text-near-black">
 {c.patientName}
 </div>
 <div className="text-[12px] font-mono text-gray-400 mt-0.5">{c.token}</div>
 </div>
 <StatusBadge status={c.status} />
 </div>
 <div className="flex items-center gap-4 mt-2 text-[12px] text-gray-500">
 <span>{new Date(c.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
 {c.urgency_level && <span className="capitalize">{c.urgency_level === 'emergency' ? t('emergency') : c.urgency_level === 'urgent' ? t('urgent') : t('normal')}</span>}
 <span>{c.applicationCount === 1 ? t('applicant', { count: 1 }) : t('applicants', { count: c.applicationCount })}</span>
 </div>
 </div>
 ))}
 </div>
 
 {currentCases.length === 0 && (
 <div className="p-12 text-center flex flex-col items-center justify-center">
 <Search className="w-8 h-8 text-gray-300 mb-3" />
 <p className="text-[15px] font-semibold text-near-black">{t('noCasesMatch', { fallback: "No matching recommendations" })}</p>
 <p className="text-[13px] text-gray-500 mt-1 max-w-[250px]">
 {t('noCases')}
 </p>
 </div>
 )}
 </div>

 {/* Pagination Footer */}
 {filteredCases.length > 0 && (
 <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
 <div className="text-[13px] font-medium text-gray-500">
 {t('pageOf', { current: safeCurrentPage, total: totalPages })}
 </div>
 <div className="flex items-center gap-2">
 <button 
 onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
 disabled={safeCurrentPage === 1}
 className="p-1.5 rounded-full border border-gray-200 text-gray-500 bg-transparent hover:border-gray-300 hover:text-near-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-[13px] font-semibold px-3"
 >
 <ChevronLeft className="w-4 h-4" />
 {t('previous')}
 </button>
 <button 
 onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
 disabled={safeCurrentPage === totalPages}
 className="p-1.5 rounded-full border border-gray-200 text-gray-500 bg-transparent hover:border-gray-300 hover:text-near-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-[13px] font-semibold px-3"
 >
 {t('next')}
 <ChevronRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
