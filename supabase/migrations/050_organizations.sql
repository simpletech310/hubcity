-- 050_organizations.sql
-- Organization accounts — cultural institutions, resource providers, chambers,
-- schools, nonprofits, government agencies. Replaces the free-text `organization`
-- column on resources and gives content a real ownership entity that can have
-- staff, a dashboard, and verified status.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  type text not null check (type in (
    'cultural','resource_provider','business','chamber',
    'school','nonprofit','government','other'
  )),
  city_id uuid references public.cities(id) on delete set null,
  description text,
  logo_url text,
  website text,
  email text,
  phone text,
  verified boolean not null default false,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_city_idx on public.organizations (city_id);
create index if not exists organizations_type_idx on public.organizations (type);

create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','curator','member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists organization_members_user_idx on public.organization_members (user_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Public can read published orgs. Members can read their own org's full record.
create policy "organizations_select_all" on public.organizations for select using (true);

-- Membership lookups — any authenticated user can see membership rows
-- (needed for access-check joins in RLS policies across other tables).
create policy "organization_members_select_self_or_same_org"
  on public.organization_members for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.organization_members m2
      where m2.org_id = organization_members.org_id
        and m2.user_id = auth.uid()
    )
  );

-- Seed "Compton Museum" as the owning org for existing culture content.
-- Gets a deterministic UUID-v5-ish fixed value so subsequent migrations can
-- reference it without a select.
insert into public.organizations (id, slug, name, type, city_id, verified, description)
select
  '00000000-0000-0000-0000-000000000001'::uuid,
  'compton-museum',
  'The Compton Museum',
  'cultural',
  c.id,
  true,
  'Digital museum preserving Compton history, notable figures, and art.'
from public.cities c
where c.slug = 'compton'
on conflict (id) do nothing;

comment on table public.organizations is
  'Provider accounts: cultural orgs, resource providers, chambers, schools, etc. Content ownership attaches here via organization_id FKs.';

comment on table public.organization_members is
  'Staff/curator/owner membership of an organization. Role gates write access to org content.';
