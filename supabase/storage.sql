-- Create 'avatars' bucket (Public)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create 'documents' bucket (Private)
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- RLS Policies for 'avatars'
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and owner = auth.uid() );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and owner = auth.uid() );

-- RLS Policies for 'documents'
-- Structure: documents/{business_id}/{filename}

create policy "Business members can view documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$' -- Ensure it's a UUID
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Business members can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Business members can update documents"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Business members can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and public.is_business_member(((storage.foldername(name))[1])::uuid)
  );
