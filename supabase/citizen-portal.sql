-- Run after supabase/cmo-dashboard.sql to enable Citizen tracking and feedback.

alter table public.grievances
  add column if not exists citizen_category text;

alter table public.grievances
  drop constraint if exists grievances_citizen_category_check,
  add constraint grievances_citizen_category_check check (
    citizen_category is null or citizen_category in (
      'Roads and public works',
      'Health and family welfare',
      'School education',
      'Higher education',
      'Local self-government services',
      'Land and revenue',
      'Police and public safety',
      'Water supply',
      'Electricity',
      'Public transport',
      'Agriculture',
      'Food and civil supplies',
      'Social justice',
      'Women and child development',
      'Other'
    )
  );

grant insert (citizen_category) on public.grievances to authenticated;

drop policy if exists "Citizens can read public workflow history"
  on public.grievance_workflow_events;
create policy "Citizens can read public workflow history"
  on public.grievance_workflow_events
  for select
  to authenticated
  using (
    event_type in (
      'cmo_routed',
      'officer_progress',
      'department_report',
      'department_forwarded',
      'cmo_reviewed'
    )
    and exists (
      select 1
      from public.grievances as grievance
      where grievance.id = grievance_workflow_events.grievance_id
        and grievance.citizen_id = (select auth.uid())
    )
  );

create table if not exists public.citizen_grievance_feedback (
  id uuid primary key default gen_random_uuid(),
  grievance_id uuid not null unique references public.grievances (id) on delete cascade,
  citizen_id uuid not null references auth.users (id) on delete cascade,
  feedback text not null check (char_length(btrim(feedback)) between 3 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists citizen_grievance_feedback_citizen_created_idx
  on public.citizen_grievance_feedback (citizen_id, created_at desc);

alter table public.citizen_grievance_feedback enable row level security;
revoke all on table public.citizen_grievance_feedback from anon, authenticated;
grant select, insert on table public.citizen_grievance_feedback to authenticated;

drop policy if exists "Citizens can read their own grievance feedback"
  on public.citizen_grievance_feedback;
create policy "Citizens can read their own grievance feedback"
  on public.citizen_grievance_feedback
  for select
  to authenticated
  using (citizen_id = (select auth.uid()));

drop policy if exists "Citizens can leave feedback on their resolved grievances"
  on public.citizen_grievance_feedback;
create policy "Citizens can leave feedback on their resolved grievances"
  on public.citizen_grievance_feedback
  for insert
  to authenticated
  with check (
    citizen_id = (select auth.uid())
    and exists (
      select 1
      from public.grievances as grievance
      where grievance.id = citizen_grievance_feedback.grievance_id
        and grievance.citizen_id = (select auth.uid())
        and grievance.status = 'resolved'
    )
  );
