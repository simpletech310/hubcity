-- 055_booking_staff_resources.sql
-- Booking parity (P3): staff calendars + bookable resources.
--
-- The live DB already has business_staff and staff_services (added
-- out-of-band — no migration exists in this repo). This migration is
-- defensive: create-if-not-exists for any missing table, add-if-not-exists
-- for any missing column.
--
-- Column naming note: the existing business_staff table uses `is_active` /
-- `avatar_url` / `name`. The spec asks for `active` / `photo_url` /
-- `display_name`. We ADD the new columns alongside the existing ones rather
-- than renaming; the app continues reading the old names and can migrate at
-- its own pace. Same story for staff_services vs booking_service_staff —
-- we keep staff_services as the canonical join table and do not create a
-- second one.

-- ─── business_staff (defensive create + column adds) ──────────────────

create table if not exists public.business_staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  role text not null default 'provider',
  email text,
  phone text,
  avatar_url text,
  specialties text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_staff
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists photo_url text,
  add column if not exists timezone text not null default 'America/Los_Angeles',
  add column if not exists active boolean not null default true,
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create index if not exists business_staff_business_idx
  on public.business_staff (business_id);
create index if not exists business_staff_user_idx
  on public.business_staff (user_id);

alter table public.business_staff enable row level security;

-- Public can read active staff for published businesses (to show on booking UI).
drop policy if exists "business_staff_public_read" on public.business_staff;
create policy "business_staff_public_read"
  on public.business_staff for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.is_published = true
    )
  );

-- Business owner has full access.
drop policy if exists "business_staff_owner_all" on public.business_staff;
create policy "business_staff_owner_all"
  on public.business_staff for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_staff.business_id and b.owner_id = auth.uid()
    )
  );

-- ─── staff_services (defensive create only — keep existing shape) ─────

create table if not exists public.staff_services (
  staff_id uuid not null references public.business_staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create index if not exists staff_services_service_idx
  on public.staff_services (service_id);

alter table public.staff_services enable row level security;

drop policy if exists "staff_services_public_read" on public.staff_services;
create policy "staff_services_public_read"
  on public.staff_services for select
  using (
    exists (
      select 1 from public.business_staff s
      join public.businesses b on b.id = s.business_id
      where s.id = staff_services.staff_id and b.is_published = true
    )
  );

drop policy if exists "staff_services_owner_all" on public.staff_services;
create policy "staff_services_owner_all"
  on public.staff_services for all
  using (
    exists (
      select 1 from public.business_staff s
      join public.businesses b on b.id = s.business_id
      where s.id = staff_services.staff_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.business_staff s
      join public.businesses b on b.id = s.business_id
      where s.id = staff_services.staff_id and b.owner_id = auth.uid()
    )
  );

-- ─── booking_resources ─────────────────────────────────────────────────
-- Physical resources bookable alongside (or instead of) staff: a chair,
-- a table, a treatment room, a vehicle bay. Capacity default 1 (exclusive).

create table if not exists public.booking_resources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  city_id uuid references public.cities(id) on delete set null,
  name text not null,
  type text,
  capacity integer not null default 1 check (capacity >= 1),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_resources_business_idx
  on public.booking_resources (business_id);
create index if not exists booking_resources_city_idx
  on public.booking_resources (city_id);

alter table public.booking_resources enable row level security;

drop policy if exists "booking_resources_public_read" on public.booking_resources;
create policy "booking_resources_public_read"
  on public.booking_resources for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = booking_resources.business_id and b.is_published = true
    )
  );

drop policy if exists "booking_resources_owner_all" on public.booking_resources;
create policy "booking_resources_owner_all"
  on public.booking_resources for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = booking_resources.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = booking_resources.business_id and b.owner_id = auth.uid()
    )
  );

comment on table public.booking_resources is
  'Physical resources bookable alongside staff: rooms, chairs, tables, bays. Capacity >= 1.';
