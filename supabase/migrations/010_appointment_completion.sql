-- 010_appointment_completion.sql
-- Adds completion-related columns to the appointment table

ALTER TABLE appointment 
ADD COLUMN tubes_collected integer DEFAULT 0,
ADD COLUMN issues_encountered text,
ADD COLUMN issues_notes text,
ADD COLUMN sample_ready_for_transport boolean DEFAULT false;
