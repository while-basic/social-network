-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their own images" on storage.objects;
drop policy if exists "Users can delete their own images" on storage.objects;
drop policy if exists "Admin Access" on storage.buckets;

-- Create admin role if it doesn't exist
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'admin') then
    create role admin;
  end if;
end
$$;

-- Grant admin role to the authenticated user
grant admin to authenticated;

-- Allow admin to manage buckets
create policy "Admin Access"
on storage.buckets for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Allow public access to images bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'images' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload images"
on storage.objects for insert
with check (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
);

-- Allow users to update their own images
create policy "Users can update their own images"
on storage.objects for update
using (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Create bucket if it doesn't exist (this needs to be done by admin/service role)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880, -- 5MB
  array['image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg'];

-- Enable RLS on storage.buckets
alter table storage.buckets enable row level security; 