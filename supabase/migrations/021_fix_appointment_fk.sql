-- Migration 021: Fix Appointment Foreign Key 

-- 1. Drop the legacy foreign key pointing to the dropped case_application table
ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_application_id_fkey;

-- 2. Rename the column to match the new architecture
ALTER TABLE appointment RENAME COLUMN application_id TO match_id;

-- 3. Add the new foreign key pointing to the match table
ALTER TABLE appointment 
  ADD CONSTRAINT appointment_match_id_fkey 
  FOREIGN KEY (match_id) 
  REFERENCES match(id) 
  ON DELETE CASCADE;
