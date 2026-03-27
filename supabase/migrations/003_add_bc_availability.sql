-- Add availability column to store weekly schedules
ALTER TABLE blood_collector
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;

-- Comment for the schema
COMMENT ON COLUMN blood_collector.availability IS 'Stores weekly availability blocks (e.g. {"monday": [{"start": "08:00", "end": "12:00", "type": "practice"}]})';
