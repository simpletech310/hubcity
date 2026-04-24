create table if not exists resource_outcomes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references grant_applications(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('housed', 'employed', 'enrolled', 'other', 'no_update')),
  notes text,
  follow_up_date date,
  created_at timestamptz not null default now()
);

alter table resource_outcomes enable row level security;

create policy "Resource providers manage outcomes" on resource_outcomes
  for all using (
    exists (select 1 from resources r where r.id = resource_id and r.created_by = auth.uid())
  );
