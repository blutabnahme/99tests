-- 018_rls_testing_fixes.sql

-- 1. Healthcare Company Registration Blockers
-- Allow HCs to insert their own records during the signup flow
create policy "Users can insert own HC profile" on healthcare_company for insert with check (auth.uid() = id);

-- 2. Patient RLS Blockers (Affects Case Creation)
-- HCs must be able to insert new patients linked to their hc_id
create policy "HCs can insert patients" on patient for insert with check (
  hc_id = (select id from healthcare_company where id = auth.uid())
);

-- HCs must be able to update their own patients
create policy "HCs can update their patients" on patient for update using (
  hc_id = (select id from healthcare_company where id = auth.uid())
);

-- 3. Match / Case Applications (Registration & Flow)
-- If not fully permissive, ensure HCs can read their cases' matches
create policy "HCs can select matches for their cases" on match for select using (
  case_id in (select id from "case" where hc_id = auth.uid())
);

-- 4. Bc Availability
-- BCs must be able to insert their own availabile slots
create policy "BCs can insert own availability" on bc_availability for insert with check (
  bc_id = auth.uid()
);
create policy "BCs can update own availability" on bc_availability for update using (
  bc_id = auth.uid()
);
create policy "BCs can delete own availability" on bc_availability for delete using (
  bc_id = auth.uid()
);
