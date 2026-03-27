"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, User, Calendar, MapPin, Mail, ShieldCheck } from "lucide-react";
import { PatientModal } from "@/components/dashboard/PatientModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientsListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch logic
  const loadPatients = async () => {
    setLoading(true);
    try {
      const url = debouncedSearch 
        ? `/api/doctor/patients?search=${encodeURIComponent(debouncedSearch)}`
        : `/api/doctor/patients`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch patients");
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [debouncedSearch]);

  const handleOpenModal = (patient: any = null) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadPatients();
  };

  const formatInsurance = (val: string) => {
    if (!val) return "Unknown";
    const map: Record<string, string> = {
      'gesetzlich': 'Gesetzlich',
      'privat_versichert': 'Privat (PKV)',
      'selbstzahler': 'Selbstzahler'
    };
    return map[val] || val;
  };

  return (
    <div className="flex-1 min-w-0 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="mb-6 border-b border-gray-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] sm:text-[28px] font-medium text-near-black tracking-tight mb-1">
              Patients
            </h1>
            <p className="text-[13px] sm:text-[14px] text-gray-500 m-0">
              Manage your assigned patients and registry.
            </p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white rounded-full px-5 py-2.5 text-[13px] font-semibold flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Patient
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-2 mb-6 gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search patients by name or email..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-[13px] rounded-full border border-gray-200 focus:border-primary outline-none bg-white transition-colors"
          />
        </div>
        <div className="w-full sm:w-auto text-[13px] font-medium text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200">
          {patients.length} {patients.length === 1 ? 'patient' : 'patients'}
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-gray-200 p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-near-black mb-1">No patients found</h3>
          <p className="text-[14px] text-gray-500 mb-6 max-w-sm">
            {searchQuery 
              ? "We couldn't find any patients matching your search query." 
              : "Your patient registry is currently empty. Register your first patient to begin sending recommendations."}
          </p>
          <button onClick={() => handleOpenModal()} className="px-5 py-2.5 rounded-full bg-primary text-white font-semibold text-[13px] hover:bg-primary-dark transition-colors">
            Register New Patient
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-gray-200 overflow-hidden shadow-sm">
          {/* Default Table Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">Name</th>
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">DOB</th>
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">Gender</th>
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">Insurance</th>
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50">Recs</th>
                  <th className="px-5 py-3.5 text-[12px] font-semibold text-gray-500 uppercase tracking-widest bg-gray-50/50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr 
                    key={p.id} 
                    onClick={() => router.push(`/dashboard/patients/${p.id}`)}
                    className={`group cursor-pointer hover:bg-gray-50/50 transition-colors ${i < patients.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[14px] text-near-black tracking-tight">{p.last_name}, {p.first_name}</div>
                      <div className="text-[12px] text-gray-500 truncate max-w-[200px] mt-0.5">{p.email || '—'}</div>
                    </td>
                    <td className="px-5 py-4 font-body text-[13px] text-gray-600">
                      {new Date(p.date_of_birth).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-body text-[13px] text-gray-600">
                      {p.gender === 'M' ? 'Male' : p.gender === 'W' ? 'Female' : 'Diverse'}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-100/50">
                        {formatInsurance(p.insured_status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-body text-[13px] font-semibold text-gray-600">
                      {p.recommendation_count}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(p); }} 
                        className="p-1.5 text-gray-400 hover:text-near-black hover:bg-gray-100 rounded-lg transition-colors inline-flex"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards rendering */}
          <div className="md:hidden flex flex-col">
            {patients.map((p, i) => (
              <div 
                key={p.id}
                onClick={() => router.push(`/dashboard/patients/${p.id}`)}
                className={`p-4 active:bg-gray-50 transition-colors ${i < patients.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-[15px] text-near-black tracking-tight">
                    {p.last_name}, {p.first_name}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100/50">
                    {formatInsurance(p.insured_status)}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(p.date_of_birth).toLocaleDateString()} ({p.gender})
                  </div>
                </div>

                {p.email && (
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100/60">
                  <div className="text-[12px] font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {p.recommendation_count} {p.recommendation_count === 1 ? 'Recommendation' : 'Recommendations'}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(p); }} 
                    className="p-1.5 text-gray-400 hover:text-near-black bg-gray-50 hover:bg-gray-100 rounded-[8px] transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Edit Modal via React Portal */}
      <PatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        patient={editingPatient} 
        onSuccess={handleModalSuccess} 
      />
    </div>
  );
}
