"use client";

import React, { createContext, useContext } from 'react';

// Simplified Doctor profile definition matched to tt_doctor table
export interface DoctorProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  practice_name: string;
  specialty: string | null;
  license_number: string | null;
  phone: string | null;
  address_street: string | null;
  address_zip: string | null;
  address_city: string | null;
  address_country: string;
  language: string;
  is_verified: boolean;
  is_active: boolean;
  custom_service_fee_pct: number | null;
}

interface DoctorContextType {
  doctor: DoctorProfile | null;
}

const DoctorContext = createContext<DoctorContextType>({ doctor: null });

export const useDoctor = () => {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error('useDoctor must be used within a DoctorProvider');
  }
  return context;
};

export const DoctorProvider = ({ 
  children, 
  doctorProfile 
}: { 
  children: React.ReactNode; 
  doctorProfile: DoctorProfile | null;
}) => {
  return (
    <DoctorContext.Provider value={{ doctor: doctorProfile }}>
      {children}
    </DoctorContext.Provider>
  );
};
