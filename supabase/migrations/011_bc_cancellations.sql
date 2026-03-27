-- 011_bc_cancellations.sql
-- Adds cancellation tracking to blood_collector and appointment tables

ALTER TABLE blood_collector 
ADD COLUMN cancellation_count integer DEFAULT 0;

ALTER TABLE appointment 
ADD COLUMN cancellation_reason text;
