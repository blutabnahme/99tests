-- Create Enum for application status
CREATE TYPE application_status AS ENUM (
  'invited',
  'applied',
  'accepted',
  'rejected',
  'withdrawn'
);

-- Case Application Table
CREATE TABLE IF NOT EXISTS public.case_application (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES public."case"(id) ON DELETE CASCADE,
  bc_id UUID NOT NULL REFERENCES public.blood_collector(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  status application_status NOT NULL DEFAULT 'applied',
  invited_by_hc BOOLEAN DEFAULT false NOT NULL,
  bc_message TEXT,
  ranking_score FLOAT,
  CONSTRAINT case_application_bc_message_length CHECK (char_length(bc_message) <= 200)
);

-- Add new fields to Case table
ALTER TABLE public."case" 
  ADD COLUMN IF NOT EXISTS application_window_hours INTEGER,
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notification_wave INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS invited_bc_ids UUID[];

-- Update Case constraint for bc_selection_mode to remove auto_assign
-- PostgreSQL doesn't allow removing enum/check values cleanly without recreation,
-- so we will handle the constraint update simply by dropping it if it's there (assuming check constraint on text field)
-- The original table defines bc_selection_mode as TEXT with a default. We should add a strictly checked constraint.
ALTER TABLE public."case"
  DROP CONSTRAINT IF EXISTS case_bc_selection_mode_check;

ALTER TABLE public."case"
  ADD CONSTRAINT case_bc_selection_mode_check 
  CHECK (bc_selection_mode IN ('hc_curates', 'patient_decides'));

-- Create Index
CREATE INDEX IF NOT EXISTS idx_case_application_case_id ON public.case_application(case_id);
CREATE INDEX IF NOT EXISTS idx_case_application_bc_id ON public.case_application(bc_id);
CREATE INDEX IF NOT EXISTS idx_case_application_status ON public.case_application(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_case_application ON public.case_application(case_id, bc_id);

-- Enable RLS
ALTER TABLE public.case_application ENABLE ROW LEVEL SECURITY;

-- Creating standard isolated policies
-- 1. Admins see all (this often needs a global function or is inherited if service role is used)
-- 2. BCs see their own applications
CREATE POLICY "BCs can view their own applications"
  ON public.case_application
  FOR SELECT
  USING (auth.uid() = bc_id);

CREATE POLICY "BCs can insert their own applications"
  ON public.case_application
  FOR INSERT
  WITH CHECK (auth.uid() = bc_id);

CREATE POLICY "BCs can update their own applications"
  ON public.case_application
  FOR UPDATE
  USING (auth.uid() = bc_id);

-- 3. HCs see applications for their cases
CREATE POLICY "HCs can view applications for their cases"
  ON public.case_application
  FOR SELECT
  USING (
    case_id IN (
      SELECT id FROM public."case" WHERE hc_id = auth.uid()
    )
  );

CREATE POLICY "HCs can update applications for their cases"
  ON public.case_application
  FOR UPDATE
  USING (
    case_id IN (
      SELECT id FROM public."case" WHERE hc_id = auth.uid()
    )
  );

-- Enable realtime broadcasting for updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.case_application;
