-- Drop the old foreign key constraint pointing to match table
ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_match_id_fkey;

-- Rename the column to be clearer
ALTER TABLE appointment RENAME COLUMN match_id TO application_id;

-- Add new foreign key pointing to case_application
ALTER TABLE appointment ADD CONSTRAINT appointment_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES case_application(id);
