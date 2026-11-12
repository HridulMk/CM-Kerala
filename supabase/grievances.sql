-- Run this after supabase/schema.sql in the Supabase SQL Editor.
-- Grievance documents are stored in a private bucket and served with short-lived signed URLs.

create table if not exists public.grievances (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique default (
    'GRV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  citizen_id uuid not null references auth.users (id) on delete cascade,
  topic text not null check (char_length(topic) between 3 and 120),
  citizen_name text not null check (char_length(citizen_name) between 2 and 150),
  location text not null check (char_length(location) between 2 and 300),
  content text not null check (char_length(content) between 20 and 5000),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected')),
  assigned_department text check (
    assigned_department is null or assigned_department in (
      'Public Works Department (PWD)',
      'Health & Family Welfare',
      'General Education',
      'Higher Education',
      'Local Self Government Department (LSGD)',
      'Revenue Department',
      'Kerala Police',
      'Water Resources',
      'Electricity',
      'Transport',
      'Agriculture',
      'Food and Civil Supplies',
      'Social Justice',
      'Women and Child Development'
    )
  ),
  attachment_path text,
  attachment_name text,
  attachment_mime_type text,
  created_at timestamptz not null default now(),
  constraint grievance_attachment_metadata_consistent check (
    (attachment_path is null and attachment_name is null and attachment_mime_type is null)
    or (
      attachment_path is not null
      and attachment_name is not null
      and attachment_mime_type is not null
      and attachment_mime_type in ('image/jpeg', 'application/pdf')
    )
  )
);

create index if not exists grievances_citizen_created_idx
  on public.grievances (citizen_id, created_at desc, id desc);
create index if not exists grievances_department_created_idx
  on public.grievances (assigned_department, created_at desc, id desc)
  where assigned_department is not null;
create index if not exists grievances_created_idx
  on public.grievances (created_at desc, id desc);
create index if not exists grievances_attachment_path_idx
  on public.grievances (attachment_path)
  where attachment_path is not null;

alter table public.grievances enable row level security;

grant usage on schema public to authenticated;
revoke all on table public.grievances from anon, authenticated;
grant select on table public.grievances to authenticated;
grant insert (
  id,
  citizen_id,
  topic,
  citizen_name,
  location,
  content,
  attachment_path,
  attachment_name,
  attachment_mime_type
) on table public.grievances to authenticated;
grant update (status, assigned_department)
  on table public.grievances to authenticated;

drop policy if exists "Citizens and authorized staff can read grievances" on public.grievances;
create policy "Citizens and authorized staff can read grievances"
  on public.grievances
  for select
  to authenticated
  using (
    citizen_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'cmo_admin'
    )
    or (
      assigned_department is not null
      and assigned_department = (
        select profile.department
        from public.profiles as profile
        where profile.id = (select auth.uid())
          and profile.role = 'department_officer'
      )
    )
  );

drop policy if exists "Citizens can submit their own grievances" on public.grievances;
create policy "Citizens can submit their own grievances"
  on public.grievances
  for insert
  to authenticated
  with check (
    citizen_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'citizen'
    )
    and status = 'submitted'
    and assigned_department is null
    and (
      attachment_path is null
      or (
        split_part(attachment_path, '/', 1) = (select auth.uid())::text
        and split_part(attachment_path, '/', 2) = id::text
      )
    )
  );

drop policy if exists "CMO and assigned officers can update grievances" on public.grievances;
create policy "CMO and assigned officers can update grievances"
  on public.grievances
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'cmo_admin'
    )
    or assigned_department = (
      select profile.department
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'department_officer'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'cmo_admin'
    )
    or exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'department_officer'
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'grievance-documents',
  'grievance-documents',
  false,
  10485760,
  array['image/jpeg', 'application/pdf']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'application/pdf'];

drop policy if exists "Citizens can upload grievance documents to their folder" on storage.objects;
create policy "Citizens can upload grievance documents to their folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'grievance-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'citizen'
    )
  );

drop policy if exists "Grievance owners and assigned staff can read documents" on storage.objects;
create policy "Grievance owners and assigned staff can read documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'grievance-documents'
    and exists (
      select 1
      from public.grievances as grievance
      where grievance.attachment_path = storage.objects.name
        and (
          grievance.citizen_id = (select auth.uid())
          or exists (
            select 1
            from public.profiles as profile
            where profile.id = (select auth.uid())
              and profile.role = 'cmo_admin'
          )
          or grievance.assigned_department = (
            select profile.department
            from public.profiles as profile
            where profile.id = (select auth.uid())
              and profile.role = 'department_officer'
          )
        )
    )
  );

drop policy if exists "Citizens can remove unlinked grievance uploads" on storage.objects;
create policy "Citizens can remove unlinked grievance uploads"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'grievance-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (
      select 1
      from public.grievances as grievance
      where grievance.attachment_path = storage.objects.name
    )
  );

notify pgrst, 'reload schema';
