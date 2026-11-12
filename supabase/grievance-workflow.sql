-- Run after supabase/grievances.sql to enable the staff case workflow.

alter table public.grievances
  add column if not exists assigned_officer_id uuid references public.profiles (id) on delete set null;

alter table public.grievances
  drop constraint if exists grievances_status_check;

alter table public.grievances
  add constraint grievances_status_check
  check (status in (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'action_report_submitted',
    'resolved',
    'rejected'
  ));

create table if not exists public.grievance_workflow_events (
  id uuid primary key default gen_random_uuid(),
  grievance_id uuid not null references public.grievances (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  event_type text not null check (event_type in (
    'cmo_routed',
    'officer_progress',
    'department_report',
    'department_forwarded',
    'cmo_reviewed',
    'cmo_remark',
    'cmo_escalated'
  )),
  note text check (note is null or char_length(note) <= 3000),
  from_department text check (from_department is null or from_department in (
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
  )),
  to_department text check (to_department is null or to_department in (
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
  )),
  status_after text not null check (status_after in (
    'submitted',
    'under_review',
    'assigned',
    'in_progress',
    'action_report_submitted',
    'resolved',
    'rejected'
  )),
  attachment_path text,
  attachment_name text,
  created_at timestamptz not null default now(),
  constraint grievance_workflow_attachment_consistent check (
    (attachment_path is null and attachment_name is null)
    or (
      attachment_path is not null
      and attachment_name is not null
      and attachment_path like '%.pdf'
    )
  )
);

create index if not exists grievance_workflow_events_case_created_idx
  on public.grievance_workflow_events (grievance_id, created_at desc, id desc);

alter table public.grievance_workflow_events enable row level security;
revoke all on table public.grievance_workflow_events from anon, authenticated;
grant select on table public.grievance_workflow_events to authenticated;

drop policy if exists "CMO and assigned officers can read workflow events"
  on public.grievance_workflow_events;
create policy "CMO and assigned officers can read workflow events"
  on public.grievance_workflow_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.grievances as grievance
      where grievance.id = grievance_workflow_events.grievance_id
        and (
          exists (
            select 1
            from public.profiles as profile
            where profile.id = (select auth.uid())
              and profile.role = 'cmo_admin'
          )
          or (
            grievance.assigned_department = (
              select profile.department
              from public.profiles as profile
              where profile.id = (select auth.uid())
                and profile.role = 'department_officer'
            )
          )
        )
    )
  );

-- Workflow writes go through the checked, transactional function below.
revoke update on table public.grievances from authenticated;
revoke update (status, assigned_department)
  on table public.grievances from authenticated;

create or replace function public.apply_grievance_workflow_action(
  p_grievance_id uuid,
  p_action text,
  p_note text,
  p_department text,
  p_decision text,
  p_attachment_path text,
  p_attachment_name text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_profile_department text;
  v_current_department text;
  v_current_officer uuid;
  v_current_status text;
  v_created_at timestamptz;
  v_reference_id text;
  v_next_status text;
  v_event_type text;
begin
  if v_user_id is null then
    raise exception 'Sign in before updating a grievance.';
  end if;

  select profile.role, profile.department
  into v_role, v_profile_department
  from public.profiles as profile
  where profile.id = v_user_id;

  if not found then
    raise exception 'Could not verify your account role.';
  end if;

  select grievance.reference_id, grievance.assigned_department,
    grievance.assigned_officer_id, grievance.status, grievance.created_at
  into v_reference_id, v_current_department, v_current_officer, v_current_status, v_created_at
  from public.grievances as grievance
  where grievance.id = p_grievance_id
  for update;

  if not found then
    raise exception 'The selected grievance does not exist.';
  end if;

  if p_note is not null and char_length(btrim(p_note)) > 3000 then
    raise exception 'Notes must be 3000 characters or fewer.';
  end if;

  if p_action in ('remark', 'escalate') then
    if v_role <> 'cmo_admin' then
      raise exception 'Only CMO Admins can add administrative remarks or escalate grievances.';
    end if;
    if p_note is null or char_length(btrim(p_note)) < 3 then
      raise exception 'Add a note of at least 3 characters.';
    end if;
    if v_current_status in ('resolved', 'rejected') then
      raise exception 'Closed grievances cannot be remarked or escalated.';
    end if;
    if p_action = 'escalate' and v_created_at >= now() - interval '7 days' then
      raise exception 'Only grievances open for more than 7 days can be escalated.';
    end if;
    v_next_status := v_current_status;
    v_event_type := case when p_action = 'remark' then 'cmo_remark' else 'cmo_escalated' end;
  elsif p_action = 'route' then
    if v_role <> 'cmo_admin' then
      raise exception 'Only CMO Admins can route grievances.';
    end if;
    if p_department is null or p_department not in (
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
    ) then
      raise exception 'Choose a valid department.';
    end if;
    if v_current_status not in ('submitted', 'under_review', 'assigned', 'in_progress') then
      raise exception 'This grievance cannot be routed in its current status.';
    end if;
    v_next_status := 'assigned';
    v_event_type := 'cmo_routed';
  elsif p_action = 'progress' then
    if v_role <> 'department_officer'
      or v_profile_department is null
      or v_profile_department is distinct from v_current_department
      or (v_current_officer is not null and v_current_officer <> v_user_id) then
      raise exception 'Only the currently assigned Department Officer can update progress.';
    end if;
    if v_current_status not in ('assigned', 'in_progress') then
      raise exception 'Progress cannot be updated in the current grievance status.';
    end if;
    if p_note is null or char_length(btrim(p_note)) < 3 then
      raise exception 'Add an investigation note of at least 3 characters.';
    end if;
    if p_attachment_path is not null and (
      p_attachment_name is null
      or p_attachment_path not like v_user_id::text || '/' || p_grievance_id::text || '/%.pdf'
    ) then
      raise exception 'The investigation attachment is invalid.';
    end if;
    v_next_status := 'in_progress';
    v_event_type := 'officer_progress';
  elsif p_action = 'report' then
    if v_role <> 'department_officer'
      or v_profile_department is null
      or v_profile_department is distinct from v_current_department
      or (v_current_officer is not null and v_current_officer <> v_user_id) then
      raise exception 'Only the currently assigned Department Officer can submit an action report.';
    end if;
    if v_current_status not in ('assigned', 'in_progress') then
      raise exception 'An action report cannot be submitted in the current grievance status.';
    end if;
    if p_note is null or char_length(btrim(p_note)) < 3 then
      raise exception 'Add an action-taken report of at least 3 characters.';
    end if;
    v_next_status := 'action_report_submitted';
    v_event_type := 'department_report';
  elsif p_action = 'forward' then
    if v_role <> 'department_officer'
      or v_profile_department is null
      or v_profile_department is distinct from v_current_department
      or (v_current_officer is not null and v_current_officer <> v_user_id) then
      raise exception 'Only the currently assigned Department Officer can forward this grievance.';
    end if;
    if v_current_status not in ('assigned', 'in_progress') then
      raise exception 'This grievance cannot be forwarded in its current status.';
    end if;
    if p_note is null or char_length(btrim(p_note)) < 3 then
      raise exception 'Add a forwarding note of at least 3 characters.';
    end if;
    if p_department is null or p_department = v_current_department or p_department not in (
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
    ) then
      raise exception 'Choose a different valid department to forward this grievance.';
    end if;
    v_next_status := 'assigned';
    v_event_type := 'department_forwarded';
  elsif p_action = 'review' then
    if v_role <> 'cmo_admin' then
      raise exception 'Only CMO Admins can review department action reports.';
    end if;
    if v_current_status <> 'action_report_submitted' then
      raise exception 'This grievance has no action report awaiting review.';
    end if;
    if p_decision is null or p_decision not in ('resolved', 'in_progress') then
      raise exception 'Choose whether to resolve the grievance or request further action.';
    end if;
    if p_note is null or char_length(btrim(p_note)) < 3 then
      raise exception 'Add a CMO review note of at least 3 characters.';
    end if;
    v_next_status := p_decision;
    v_event_type := 'cmo_reviewed';
  else
    raise exception 'Unknown grievance workflow action.';
  end if;

  if p_action <> 'progress' and (
    p_attachment_path is not null or p_attachment_name is not null
  ) then
    raise exception 'Attachments are only accepted with an investigation progress update.';
  end if;

  update public.grievances as grievance
  set
    status = v_next_status,
    assigned_department = case
      when p_action in ('route', 'forward') then p_department
      else grievance.assigned_department
    end,
    assigned_officer_id = case
      when p_action in ('route', 'forward') then null
      else grievance.assigned_officer_id
    end
  where grievance.id = p_grievance_id;

  insert into public.grievance_workflow_events (
    grievance_id,
    actor_id,
    event_type,
    note,
    from_department,
    to_department,
    status_after,
    attachment_path,
    attachment_name
  )
  values (
    p_grievance_id,
    v_user_id,
    v_event_type,
    nullif(btrim(p_note), ''),
    case when p_action in ('route', 'forward') then v_current_department else null end,
    case when p_action in ('route', 'forward') then p_department else v_current_department end,
    v_next_status,
    p_attachment_path,
    p_attachment_name
  );

  return v_reference_id;
end;
$$;

revoke all on function public.apply_grievance_workflow_action(
  uuid, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.apply_grievance_workflow_action(
  uuid, text, text, text, text, text, text
) to authenticated;

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

drop policy if exists "Department officers can upload investigation PDFs"
  on storage.objects;
create policy "Department officers can upload investigation PDFs"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'grievance-documents'
    and storage.extension(name) = 'pdf'
    and exists (
      select 1
      from public.grievances as grievance
      join public.profiles as profile
        on profile.id = (select auth.uid())
      where grievance.id::text = (storage.foldername(name))[2]
        and profile.role = 'department_officer'
        and profile.department = grievance.assigned_department
        and (storage.foldername(name))[1] = profile.id::text
    )
  );

drop policy if exists "Officers can remove unlinked investigation PDFs"
  on storage.objects;
create policy "Officers can remove unlinked investigation PDFs"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'grievance-documents'
    and storage.extension(name) = 'pdf'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.grievances as grievance
      join public.profiles as profile
        on profile.id = (select auth.uid())
      where grievance.id::text = (storage.foldername(name))[2]
        and profile.role = 'department_officer'
        and profile.department = grievance.assigned_department
        and not exists (
          select 1
          from public.grievance_workflow_events as workflow_event
          where workflow_event.attachment_path = storage.objects.name
        )
    )
  );

drop policy if exists "Grievance owners and assigned staff can read documents"
  on storage.objects;
create policy "Grievance owners and assigned staff can read documents"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'grievance-documents'
    and (
      exists (
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
      or exists (
        select 1
        from public.grievance_workflow_events as workflow_event
        join public.grievances as grievance
          on grievance.id = workflow_event.grievance_id
        where workflow_event.attachment_path = storage.objects.name
          and (
            exists (
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
    )
  );

notify pgrst, 'reload schema';
