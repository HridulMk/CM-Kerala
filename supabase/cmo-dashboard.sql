-- Run after supabase/grievance-workflow.sql to enable CMO dashboard features.

alter table public.grievances
  add column if not exists district text,
  add column if not exists category text,
  add column if not exists priority text,
  add column if not exists assigned_officer_id uuid references public.profiles (id) on delete set null;

alter table public.grievances
  drop constraint if exists grievances_district_check,
  add constraint grievances_district_check check (
    district is null or district in (
      'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
      'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
      'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
    )
  ),
  drop constraint if exists grievances_category_check,
  add constraint grievances_category_check check (
    category is null or char_length(category) between 2 and 100
  ),
  drop constraint if exists grievances_priority_check,
  add constraint grievances_priority_check check (
    priority is null or priority in ('Low', 'Medium', 'High')
  );

create index if not exists grievances_dashboard_district_status_idx
  on public.grievances (district, status, created_at desc);
create index if not exists grievances_dashboard_category_priority_idx
  on public.grievances (category, priority, created_at desc);
create index if not exists grievances_assigned_officer_idx
  on public.grievances (assigned_officer_id, created_at desc)
  where assigned_officer_id is not null;

alter table public.grievance_workflow_events
  add column if not exists to_officer_id uuid references public.profiles (id) on delete set null;

alter table public.grievance_workflow_events
  drop constraint if exists grievance_workflow_events_event_type_check,
  add constraint grievance_workflow_events_event_type_check check (
    event_type in (
      'cmo_routed',
      'officer_progress',
      'department_report',
      'department_forwarded',
      'cmo_reviewed',
      'cmo_remark',
      'cmo_escalated',
      'cmo_assigned_officer'
    )
  );

drop policy if exists "Citizens and authorized staff can read grievances"
  on public.grievances;
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
      assigned_department = (
        select profile.department
        from public.profiles as profile
        where profile.id = (select auth.uid())
          and profile.role = 'department_officer'
      )
      and (
        assigned_officer_id is null
        or assigned_officer_id = (select auth.uid())
      )
    )
  );

drop policy if exists "CMO and assigned officers can update grievances"
  on public.grievances;
create policy "CMO can update AI classifications"
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
  )
  with check (
    exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'cmo_admin'
    )
  );
grant update (category, priority, status, assigned_department, assigned_officer_id)
  on public.grievances to authenticated;
grant insert (district) on public.grievances to authenticated;

drop policy if exists "CMO can record dashboard workflow events"
  on public.grievance_workflow_events;
create policy "CMO can record dashboard workflow events"
  on public.grievance_workflow_events
  for insert
  to authenticated
  with check (
    actor_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = (select auth.uid())
        and profile.role = 'cmo_admin'
    )
  );
grant insert (
  grievance_id,
  actor_id,
  event_type,
  note,
  from_department,
  to_department,
  to_officer_id,
  status_after
) on public.grievance_workflow_events to authenticated;

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
            and (
              grievance.assigned_officer_id is null
              or grievance.assigned_officer_id = (select auth.uid())
            )
            and grievance_workflow_events.event_type not in ('cmo_remark', 'cmo_escalated')
          )
        )
    )
  );

drop policy if exists "CMO can read department officer profiles" on public.profiles;
create or replace function private.current_user_is_cmo_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles as profile
      where profile.id = auth.uid()
        and profile.role = 'cmo_admin'
    );
$$;
revoke all on function private.current_user_is_cmo_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_user_is_cmo_admin() to authenticated;

create policy "CMO can read department officer profiles"
  on public.profiles
  for select
  to authenticated
  using (
    role = 'department_officer'
    and (select private.current_user_is_cmo_admin())
  );

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
        and (
          grievance.assigned_officer_id is null
          or grievance.assigned_officer_id = profile.id
        )
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
        and (
          grievance.assigned_officer_id is null
          or grievance.assigned_officer_id = profile.id
        )
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
            or (
              grievance.assigned_department = (
                select profile.department
                from public.profiles as profile
                where profile.id = (select auth.uid())
                  and profile.role = 'department_officer'
              )
              and (
                grievance.assigned_officer_id is null
                or grievance.assigned_officer_id = (select auth.uid())
              )
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
            or (
              grievance.assigned_department = (
                select profile.department
                from public.profiles as profile
                where profile.id = (select auth.uid())
                  and profile.role = 'department_officer'
              )
              and (
                grievance.assigned_officer_id is null
                or grievance.assigned_officer_id = (select auth.uid())
              )
              and workflow_event.event_type not in ('cmo_remark', 'cmo_escalated')
            )
          )
      )
    )
  );

create or replace function public.route_grievance_to_department(
  p_grievance_id uuid,
  p_department text,
  p_officer_id uuid,
  p_note text
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_reference_id text;
  v_current_department text;
  v_current_status text;
begin
  select profile.role into v_role
  from public.profiles as profile
  where profile.id = v_user_id;
  if v_role is distinct from 'cmo_admin' then
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
  if p_note is not null and char_length(btrim(p_note)) > 3000 then
    raise exception 'Routing notes must be 3000 characters or fewer.';
  end if;

  select grievance.reference_id, grievance.assigned_department, grievance.status
  into v_reference_id, v_current_department, v_current_status
  from public.grievances as grievance
  where grievance.id = p_grievance_id
  for update;
  if not found then
    raise exception 'The selected grievance does not exist.';
  end if;
  if v_current_status not in ('submitted', 'under_review', 'assigned', 'in_progress') then
    raise exception 'This grievance cannot be routed in its current status.';
  end if;

  if p_officer_id is not null and not exists (
    select 1
    from public.profiles as officer
    where officer.id = p_officer_id
      and officer.role = 'department_officer'
      and officer.department = p_department
  ) then
    raise exception 'The selected officer is not registered in the selected department.';
  end if;

  update public.grievances
  set status = 'assigned',
      assigned_department = p_department,
      assigned_officer_id = p_officer_id
  where id = p_grievance_id;

  insert into public.grievance_workflow_events (
    grievance_id, actor_id, event_type, note, from_department,
    to_department, to_officer_id, status_after
  )
  values (
    p_grievance_id, v_user_id, 'cmo_routed', nullif(btrim(p_note), ''),
    v_current_department, p_department, p_officer_id, 'assigned'
  );

  if p_officer_id is not null then
    insert into public.grievance_workflow_events (
      grievance_id, actor_id, event_type, note, to_department,
      to_officer_id, status_after
    )
    values (
      p_grievance_id, v_user_id, 'cmo_assigned_officer',
      'Assigned to a Department Officer.', p_department,
      p_officer_id, 'assigned'
    );
  end if;

  return v_reference_id;
end;
$$;

revoke all on function public.route_grievance_to_department(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.route_grievance_to_department(uuid, text, uuid, text)
  to authenticated;

create or replace function public.get_cmo_grievance_dashboard_metrics()
returns table (metric_group text, metric_name text, total bigint)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = 'cmo_admin'
  ) then
    raise exception 'Only CMO Admins can view dashboard metrics.';
  end if;

  return query
  select 'summary'::text, 'total'::text, count(*)::bigint
  from public.grievances
  union all
  select 'summary', 'pending', count(*)::bigint
  from public.grievances
  where status not in ('resolved', 'rejected')
  union all
  select 'summary', 'resolved', count(*)::bigint
  from public.grievances
  where status = 'resolved'
  union all
  select 'summary', 'overdue', count(*)::bigint
  from public.grievances
  where status not in ('resolved', 'rejected')
    and created_at < now() - interval '7 days'
  union all
  select 'district', coalesce(district, 'Not specified'), count(*)::bigint
  from public.grievances
  group by district
  union all
  select 'department', coalesce(assigned_department, 'Awaiting assignment'), count(*)::bigint
  from public.grievances
  group by assigned_department
  union all
  select 'category', coalesce(category, 'Awaiting AI analysis'), count(*)::bigint
  from public.grievances
  group by category
  union all
  select 'priority', coalesce(priority, 'Awaiting AI analysis'), count(*)::bigint
  from public.grievances
  group by priority;
end;
$$;

revoke all on function public.get_cmo_grievance_dashboard_metrics()
  from public, anon, authenticated;
grant execute on function public.get_cmo_grievance_dashboard_metrics()
  to authenticated;

notify pgrst, 'reload schema';
