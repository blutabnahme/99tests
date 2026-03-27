"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  X, 
  FolderOpen,
  ChevronRight,
  Plus
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Input } from "@/components/ui/Input";

export default function AdminCasesPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setCases] = useState<any[]>([]);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const casesPerPage = 15;


  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/recommendations');
        if (!res.ok) throw new Error('Failed to fetch');
        const { recommendations: data } = await res.json();
        setCases(data || []);
      } catch (err) {
        console.error("Error fetching admin recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  // Filter Logic
  const filteredCases = recommendations.filter(c => {
    // 1. Search Box
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      c.id.toLowerCase().includes(searchLower) ||
      c.patientName.toLowerCase().includes(searchLower) ||
      c.hcName.toLowerCase().includes(searchLower);
      
    // 2. Status Filter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && ['created', 'pending'].includes(c.status)) ||
      (statusFilter === 'matched' && c.status === 'matched') ||
      (statusFilter === 'booked' && c.status === 'booked') ||
      (statusFilter === 'completed' && c.status === 'completed') ||
      (statusFilter === 'cancelled' && c.status === 'cancelled');
      
    // 3. Urgency Filter
    const matchesUrgency = urgencyFilter === 'all' || c.urgency === urgencyFilter;
    
    // 4. Mode Filter
    const matchesMode = modeFilter === 'all' || c.mode === modeFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency && matchesMode;
  });

  const totalPages = Math.max(1, Math.ceil(filteredCases.length / casesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCases = filteredCases.slice((safeCurrentPage - 1) * casesPerPage, safeCurrentPage * casesPerPage);

  const renderStatusBadge = (status: string) => <StatusBadge status={status} />;

  const renderUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Emergency</span>;
      case 'urgent': return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-800">Urgent</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-500">Normal</span>;
    }
  };

  const renderMode = (mode: string) => {
    switch (mode) {
      case 'patient_decides': return "Patient Decides";
      case 'clinic_shortlist': return "Clinic Shortlist";
      case 'clinic_approval': return "Clinic Approval";
      default: return mode;
    }
  };

  return (
    <div className="flex-1 min-w-0 w-full font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-heading font-medium text-near-black">Recommendation Supervision</h1>
          <p className="text-[15px] text-gray-500 mt-1">Global platform overview of all network blood collections natively</p>
        </div>
        <Link
          href="/admin/recommendations/new"
          className="w-full sm:w-auto bg-primary text-white px-5 rounded-full h-10 font-semibold hover:bg-primary-dark transition-all shadow-[0_4px_16px_rgba(0, 128, 133,0.25)] hover:-translate-y-[1px] flex items-center justify-center text-[13px]"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Recommendation
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 sm:border-0 sm:bg-transparent sm:rounded-none shadow-sm sm:shadow-none mb-6">
        {/* Controls Container */}
        <div className="p-4 sm:p-5 border-b border-gray-100 sm:bg-white sm:rounded-t-2xl sm:border sm:border-gray-200 sm:border-b-0 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        {/* Search */}
        <div className="relative w-full xl:w-[320px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input 
            placeholder="Search by ID, Patient, or Doctor..." 
            value={search}
            onChange={(e: any) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 h-10 w-full"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center w-full xl:w-auto overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-3 sm:border-r border-gray-200 sm:pr-4 shrink-0">
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide w-20 shrink-0"><Filter className="w-3.5 h-3.5 inline mr-1" /> Status</span>
            <select value={statusFilter} onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }} className="flex-1 sm:flex-none text-[13px] h-9 px-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="matched">Matched</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-3 sm:border-r border-gray-200 sm:pr-4 shrink-0">
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide w-20 shrink-0">Urgency</span>
            <select value={urgencyFilter} onChange={e => {
                setUrgencyFilter(e.target.value);
                setCurrentPage(1);
              }} className="flex-1 sm:flex-none text-[13px] h-9 px-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto">
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] font-medium text-gray-500 uppercase tracking-wide w-20 shrink-0">Mode</span>
            <select value={modeFilter} onChange={e => {
                setModeFilter(e.target.value);
                setCurrentPage(1);
              }} className="flex-1 sm:flex-none text-[13px] h-9 px-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-auto">
              <option value="all">All</option>
              <option value="doctor_curates">Doctor Curates</option>
              <option value="patient_decides">Patient Decides</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="sm:bg-white sm:rounded-b-2xl sm:border sm:border-gray-200 sm:shadow-sm">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Recommendation ID</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Healthcare Co.</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">BC Assigned</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Selection Mode</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 font-body text-[12px] font-semibold text-[#6E7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-99tests-red animate-spin mx-auto mb-3" />
                    Loading recommendations...
                  </td>
                </tr>
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-gray-500">
                    <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <div className="text-[14px] font-medium">No recommendations found matching filters.</div>
                  </td>
                </tr>
              ) : (
                paginatedCases.map(c => (
                  <tr key={c.id} className="hover:bg-[#008085]/[0.02] transition-colors group cursor-pointer" onClick={() => window.location.href=`/admin/recommendations/${c.id}`}>
                    <td className="px-5 py-4 text-[13px] font-mono font-medium text-primary-dark">{c.id}</td>
                    <td className="px-5 py-4 text-[14px] font-semibold text-near-black">{c.patientName}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{c.hcName}</td>
                    <td className="px-5 py-4">{renderStatusBadge(c.status)}</td>
                    <td className="px-5 py-4">{renderUrgencyBadge(c.urgency)}</td>
                    <td className="px-5 py-4 text-[13px]">
                      {c.assignedBcName ? (
                        <span className="text-near-black font-medium">{c.assignedBcName}</span>
                      ) : c.applicationCount > 0 ? (
                        <span className="text-[12px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {c.applicationCount} {c.applicationCount === 1 ? 'applicant' : 'applicants'}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{renderMode(c.mode)}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors ml-auto" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block sm:hidden">
          {loading ? (
             <div className="py-12 text-center text-gray-500 flex flex-col items-center">
               <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-99tests-red animate-spin mb-3" />
               <span className="text-[13px]">Loading recommendations...</span>
             </div>
          ) : paginatedCases.length === 0 ? (
             <div className="py-12 text-center text-gray-500 flex flex-col items-center">
               <FolderOpen className="w-8 h-8 text-gray-300 mb-2" />
               <span className="text-[14px] font-medium">No recommendations found matching filters.</span>
             </div>
          ) : (
             paginatedCases.map(c => (
               <div 
                 key={c.id} 
                 onClick={() => window.location.href=`/admin/recommendations/${c.id}`}
                 className="p-4 border-b border-gray-100 last:border-b-0 cursor-pointer active:bg-gray-50"
               >
                 <div className="flex items-center justify-between mb-2">
                   <div className="font-mono text-[14px] font-medium text-primary">{c.id}</div>
                   <div>{renderStatusBadge(c.status)}</div>
                 </div>
                 <div className="text-[14px] text-near-black">
                   {c.patientName}
                 </div>
                 <div className="text-[13px] text-gray-500 mb-2">
                   {c.hcName}
                 </div>
                 <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                   {renderUrgencyBadge(c.urgency)}
                   <span className="text-gray-300">•</span>
                   <span>{new Date(c.createdAt).toLocaleDateString('en-GB')}</span>
                 </div>
               </div>
             ))
          )}
        </div>
        <div className="px-4 sm:px-5 py-4 border-t border-gray-200 sm:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:rounded-b-2xl">
          <div className="text-[12px] sm:text-[13px] font-medium text-gray-500 text-center sm:text-left">
            Showing {((safeCurrentPage - 1) * casesPerPage) + 1}–{Math.min(safeCurrentPage * casesPerPage, filteredCases.length)} of {filteredCases.length} recommendations
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 rounded-md border border-gray-200 text-near-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-[13px] font-medium px-3 flex-1 sm:flex-none"
            >
              Previous
            </button>
            <span className="text-[13px] text-gray-500 px-1 sm:px-2 whitespace-nowrap hidden sm:inline">Page {safeCurrentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 rounded-md border border-gray-200 text-near-black bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 text-[13px] font-medium px-3 flex-1 sm:flex-none"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
