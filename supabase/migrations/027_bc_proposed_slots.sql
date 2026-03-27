-- supabase/migrations/027_bc_proposed_slots.sql

CREATE TABLE bc_proposed_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bc_id uuid NOT NULL REFERENCES blood_collector(id),
    case_application_id uuid NOT NULL REFERENCES case_application(id) ON DELETE CASCADE,
    case_id text NOT NULL REFERENCES "case"(id),
    slot_start timestamp with time zone NOT NULL,
    slot_duration_minutes integer NOT NULL DEFAULT 60,
    status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'released', 'expired')),
    proposed_by text NOT NULL DEFAULT 'bc' CHECK (proposed_by IN ('bc', 'patient')),
    round integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_bc_proposed_slots_bc_status ON bc_proposed_slots(bc_id, status);
CREATE INDEX idx_bc_proposed_slots_application ON bc_proposed_slots(case_application_id);

ALTER TABLE case_application ADD COLUMN is_flexible boolean NOT NULL DEFAULT false;

ALTER TABLE case_application ADD COLUMN scheduling_status text NOT NULL DEFAULT 'pending'
CHECK (scheduling_status IN ('pending', 'bc_proposed', 'patient_picking', 'patient_counter_proposed', 'bc_reproposing', 'scheduled', 'failed'));

ALTER TABLE case_application ADD COLUMN scheduling_message text;
