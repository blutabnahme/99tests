-- Fix infinite recursion by bypassing RLS on case and match when querying each other

DROP POLICY IF EXISTS "BCs can read booked cases" ON "case";
CREATE POLICY "BCs can read booked cases" ON "case" FOR SELECT USING (
  exists (
    select 1 from appointment
    where case_id = "case".id and bc_id = auth.uid()
  ) or exists (
    select 1 from match
    where case_id = "case".id and bc_id = auth.uid()
  )
);

-- Actually, we can use a security definer function to check matched cases without triggering RLS
CREATE OR REPLACE FUNCTION is_bc_matched_to_case(c_id text, b_id uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM match WHERE case_id = c_id AND bc_id = b_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_hc_owner_of_case(c_id text, h_id uuid) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM "case" WHERE id = c_id AND hc_id = h_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate BC policy on case:
DROP POLICY IF EXISTS "BCs can read booked cases" ON "case";
CREATE POLICY "BCs can read booked cases" ON "case" FOR SELECT USING (
  exists (
    select 1 from appointment
    where case_id = "case".id and bc_id = auth.uid()
  ) or is_bc_matched_to_case("case".id, auth.uid())
);

-- Recreate HC policy on match:
DROP POLICY IF EXISTS "HCs can select matches for their cases" ON match;
CREATE POLICY "HCs can select matches for their cases" ON match FOR SELECT USING (
  is_hc_owner_of_case(match.case_id, auth.uid())
);

-- Add the missing policy for BCs to view their matches:
DROP POLICY IF EXISTS "BCs can select own matches" ON match;
CREATE POLICY "BCs can select own matches" ON match FOR SELECT USING (
  bc_id = auth.uid()
);
