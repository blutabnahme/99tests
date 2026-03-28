"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, User, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PatientModal } from '@/components/dashboard/PatientModal';

export default function WizardStep1({ patient, setPatient, setPricingTier, onNext, urlPatientId }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-select from URL
  useEffect(() => {
    if (urlPatientId && !patient) {
      // Just set standard search text to auto-fetch if we dont have standard "get patient by id" route
      setSearchQuery(urlPatientId);
    }
  }, [urlPatientId]);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctor/patients?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.patients) {
          setPatients(data.patients);
          // If auto URL select matched EXACT id, select it
          if (urlPatientId && !patient) {
            const found = data.patients.find((p: any) => p.id === urlPatientId);
            if (found) handleSelectPatient(found);
          }
        }
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(fetchPatients, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const detectPricingTier = (p: any) => {
    const country = p.address_country || 'Deutschland';
    if (country === 'Deutschland' || country === 'DE') {
      if (p.insured_status === 'privat_versichert') return 'insured';
      return 'uninsured';
    }
    return 'zone1'; // Simplistic fallback
  };

  const handleSelectPatient = (selected: any) => {
    setPatient(selected);
    setPricingTier(detectPricingTier(selected));
    setSearchQuery('');
  };

  const getTierLabel = (tier: string) => {
    switch(tier) {
      case 'insured': return 'Privately Insured';
      case 'uninsured': return 'Self-Payer / Statutory';
      case 'zone1': return 'Foreign (Zone 1)';
      default: return 'Standard Tier';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-body">
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-8">
        <h2 className="font-heading text-[24px] font-medium text-near-black mb-6">Select Patient</h2>
        
        {!patient ? (
          <div>
            {/* Search Input */}
            <div className="relative mb-6">
              <input 
                type="text" 
                placeholder="Search patients by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 text-[14px] bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-400"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* List */}
            <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto">
              {loading && patients.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-[14px]">Searching...</div>
              ) : patients.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-[14px]">No matching patients found.</div>
              ) : (
                patients.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectPatient(p)}
                    className="w-full text-left p-4 rounded-[16px] border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="font-semibold text-[15px] text-near-black">
                          {p.first_name} {p.last_name}
                        </div>
                        <div className="text-[13px] text-gray-500 mt-0.5">
                          DOB: {p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : 'Unknown'} • {p.email || 'No email provided'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-gray-100 text-gray-600">
                        {p.insured_status === 'privat_versichert' ? 'Privat' : 'Selbstzahler / Gesetzlich'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-center">
              <Button variant="ghost" onClick={() => setIsModalOpen(true)} className="rounded-full flex items-center gap-2 border border-gray-200">
                <Plus className="w-4 h-4" />
                Register New Patient
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 rounded-[16px] border-2 border-primary/20 bg-primary/5 flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Selected Patient</h3>
                  <div className="font-heading text-[20px] font-medium text-near-black">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-[14px] text-gray-600 mt-1 flex items-center gap-3">
                    <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{patient.email || 'No email provided'}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-[13px] font-medium text-gray-700 shadow-sm">
                      {getTierLabel(detectPricingTier(patient))}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setPatient(null)}
                className="text-[13px] font-medium text-gray-500 hover:text-near-black transition-colors underline underline-offset-4"
              >
                Change
              </button>
            </div>
          </div>
        )}

        <PatientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            // Re-fetch handled generally, user can just search
          }} 
        />
        
      </div>

      {patient && (
        <div className="mt-4 flex justify-end">
          <Button onClick={onNext} className="rounded-full px-8 h-12 text-[15px] shadow-md">
            Continue to Tests
          </Button>
        </div>
      )}

    </div>
  );
}
