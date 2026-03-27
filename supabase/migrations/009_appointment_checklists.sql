-- 009_appointment_checklists.sql
-- Adds checklist tracking columns for the appointment detail views

ALTER TABLE appointment 
ADD COLUMN bc_checklist_completed boolean DEFAULT false,
ADD COLUMN patient_checklist_completed boolean DEFAULT false;
