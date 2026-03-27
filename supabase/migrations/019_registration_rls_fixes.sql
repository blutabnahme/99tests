-- 019_registration_rls_fixes.sql

-- Allow authenticated users to insert their own verification documents
create policy "Users can insert own verification docs" on verification_document for insert with check (auth.uid() = user_id);

-- Wait, the HC insertion failed. Let me verify the HC policy. We did:
-- create policy "Users can insert own HC profile" on healthcare_company for insert with check (auth.uid() = id);
-- This should work, IF the user is authenticated. 

-- Let's also add update policies just in case it's an upsert
create policy "Users can update own HC profile" on healthcare_company for update using (auth.uid() = id);

-- Actually, looking at the logs, it might be the storage bucket missing RLS policies!
-- We'll add storage policies too, just to be safe.
-- But wait, the error specifically said: `new row violates row-level security policy for table "healthcare_company"`
-- Let's make sure the role they are granted actually has access. Usually it's `authenticated`.
