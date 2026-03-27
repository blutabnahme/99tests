-- 008_appointment_fields.sql
-- Adds new columns requested for the appointment booking flow

ALTER TABLE appointment 
ADD COLUMN application_id uuid REFERENCES case_application(id) ON DELETE SET NULL,
ADD COLUMN location jsonb,
ADD COLUMN type text; -- 'practice' or 'home_visit'

-- Note: We retain the 'scheduled' default status for appointments as it acts as 'confirmed' and is used in other queries.
