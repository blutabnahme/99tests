"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, Mail, Phone, ClipboardList } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PortalDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch('/api/portal/data?section=doctors');
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchDoctors();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <h1 className="font-heading font-medium text-[24px] text-near-black tracking-tight mb-1" style={{ textTransform: 'none' }}>My Doctors</h1>
      <p className="text-gray-500 text-[14px] mb-8">Doctors who have recommended tests for you.</p>

      {doctors.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-gray-200 shadow-sm p-12 text-center">
          <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-[14px]">No linked doctors yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {doctors.map((doc: any) => {
            const rawParts = (doc.full_name || '').split(' ');
            const titlePrefixes = [
              'dr.', 'dr', 'med.', 'med', 'prof.', 'prof', 'pd', 'pd.',
              'dipl.', 'dipl', 'mag.', 'mag', 'habil.', 'habil',
              'dent.', 'dent', 'rer.', 'rer', 'nat.', 'nat',
              'phil.', 'phil', 'jur.', 'jur', 'ing.', 'ing',
              'oec.', 'oec', 'theol.', 'theol', 'vet.', 'vet',
              'h.c.', 'mult.', 'mult', 'univ.', 'univ',
            ];
            const nameParts = rawParts.filter((p: string) => !titlePrefixes.includes(p.toLowerCase()));
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();

            return (
              <div key={doc.id} className="bg-white rounded-[16px] border border-gray-200 shadow-sm overflow-hidden">
                {/* Header with teal accent */}
                <div className="bg-primary/5 px-6 py-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-[16px] shrink-0">
                    {initials}
                  </div>
                  <div>
                    <div className="text-[17px] font-heading font-medium text-near-black">{doc.full_name}</div>
                    {doc.practice_name && <div className="text-[13px] text-gray-600">{doc.practice_name}</div>}
                    {doc.specialty && <div className="text-[12px] text-primary/70 mt-0.5">{doc.specialty}</div>}
                  </div>
                </div>

                {/* Contact details */}
                <div className="px-6 py-4 space-y-3">
                  {doc.email && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <a href={`mailto:${doc.email}`} className="text-primary hover:underline">{doc.email}</a>
                    </div>
                  )}
                  {doc.phone && (
                    <div className="flex items-center gap-3 text-[13px]">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <a href={`tel:${doc.phone}`} className="text-gray-700 hover:underline">{doc.phone}</a>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
