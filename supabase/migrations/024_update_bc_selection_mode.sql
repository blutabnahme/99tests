-- Drop the old constraint
ALTER TABLE public.case DROP CONSTRAINT IF EXISTS case_bc_selection_mode_check;

-- Update existing data in case table
UPDATE public.case 
SET bc_selection_mode = 'clinic_shortlist'
WHERE bc_selection_mode = 'patient_decides';

UPDATE public.case 
SET bc_selection_mode = 'clinic_approval'
WHERE bc_selection_mode = 'hc_curates';

-- Add new constraint for case table
ALTER TABLE public.case ADD CONSTRAINT case_bc_selection_mode_check 
CHECK (bc_selection_mode IN ('patient_decides', 'clinic_shortlist', 'clinic_approval'));


-- Update existing data in healthcare_company table
UPDATE public.healthcare_company
SET default_bc_selection_mode = 'clinic_shortlist'
WHERE default_bc_selection_mode = 'patient_decides';

UPDATE public.healthcare_company
SET default_bc_selection_mode = 'clinic_approval'
WHERE default_bc_selection_mode = 'hc_curates';

-- Add constraint for healthcare_company table if we ever want to strictly enforce it
ALTER TABLE public.healthcare_company DROP CONSTRAINT IF EXISTS hc_default_bc_selection_mode_check;
ALTER TABLE public.healthcare_company ADD CONSTRAINT hc_default_bc_selection_mode_check
CHECK (default_bc_selection_mode IN ('patient_decides', 'clinic_shortlist', 'clinic_approval') OR default_bc_selection_mode IS NULL);
