-- Set up Storage for Verification Documents
insert into storage.buckets (id, name, public)
values ('verification_documents', 'verification_documents', false)
on conflict (id) do nothing;

-- Set up access controls for storage
-- HCs and BCs can upload their own verification documents
create policy "Authenticated users can upload own documents"
  on storage.objects for insert
  with check ( bucket_id = 'verification_documents' and auth.uid()::text = (storage.foldername(name))[1] );

-- Users can view their own documents
create policy "Users can view own documents"
  on storage.objects for select
  using ( bucket_id = 'verification_documents' and auth.uid()::text = (storage.foldername(name))[1] );

-- Admins can view all documents (requires proper admin role check, simplified here)
create policy "Admins can view all documents"
  on storage.objects for select
  using ( bucket_id = 'verification_documents' and (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
