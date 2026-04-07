"use client";
import { createContext, useContext } from 'react';

export interface PatientContextType {
  patient: any;
  loading: boolean;
}

export const PatientCtx = createContext<PatientContextType>({ patient: null, loading: true });

export function usePatient() {
  return useContext(PatientCtx);
}
