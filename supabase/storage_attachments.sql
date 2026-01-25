-- Create 'attachments' bucket (Public)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- RLS Policies for 'attachments'
-- Anyone can view (Public)
create policy "Attachments are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'attachments' );

-- Authenticated users can upload (Standard user)
create policy "Authenticated users can upload attachments"
  on storage.objects for insert
  with check ( bucket_id = 'attachments' and auth.role() = 'authenticated' );

-- Users can delete their own uploads (or Business Owners)
create policy "Users can delete their own attachments"
  on storage.objects for delete
  using ( bucket_id = 'attachments' and owner = auth.uid() );
