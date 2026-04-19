-- 054_address_verification.sql
-- Real address verification: extend profiles with verification metadata, and
-- add an audit table (address_verifications) for every submission attempt.
--
-- The verify-address API (src/app/api/verification/verify-address/route.ts)
-- writes one row here per attempt. Outcomes:
--   verified   -> automated ZIP match (or manual/admin override)
--   rejected   -> ZIP not in any supported city
--   ambiguous  -> ZIP matches multiple live cities; queued for manual review
--   pending    -> awaiting manual review for any other reason
-- Verified rows are the source of truth; the mirror columns on profiles are a
-- denormalized cache for fast reads.

-- ── profiles: verification metadata ────────────────────────────────────
alter table public.profiles
  add column if not exists address_verified_at timestamptz;

alter table public.profiles
  add column if not exists verification_method text
    check (verification_method in ('automated','manual','admin_override'));

alter table public.profiles
  add column if not exists verification_source text;

alter table public.profiles
  add column if not exists verification_confidence numeric;

comment on column public.profiles.address_verified_at is
  'Timestamp of the most recent successful address verification. Null if the profile has never been verified.';
comment on column public.profiles.verification_method is
  'How the current verification was established: automated (system ZIP/address match), manual (human reviewer), admin_override (forced by admin).';
comment on column public.profiles.verification_source is
  'Free-form source tag, e.g. zip_match, smartystreets, admin.';
comment on column public.profiles.verification_confidence is
  'Optional confidence score [0..1] from the verification source.';

-- ── address_verifications: per-attempt audit trail ─────────────────────
create table if not exists public.address_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  submitted_address text not null,
  normalized_address text,
  zip text,
  city_id uuid references public.cities(id),
  method text check (method in ('automated','manual','admin_override')),
  source text,
  outcome text not null check (outcome in ('verified','rejected','ambiguous','pending')),
  confidence numeric,
  reviewer_id uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists address_verifications_user_idx
  on public.address_verifications (user_id);
create index if not exists address_verifications_outcome_idx
  on public.address_verifications (outcome);
create index if not exists address_verifications_created_idx
  on public.address_verifications (created_at desc);

alter table public.address_verifications enable row level security;

-- Owner can read their own verification history.
create policy "address_verifications_select_own"
  on public.address_verifications for select
  using (auth.uid() = user_id);

-- Admins and city officials can read every row (for manual-review dashboards).
create policy "address_verifications_select_admin"
  on public.address_verifications for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','city_official')
    )
  );

-- Admins and city officials can update outcome / notes / reviewer_id during
-- manual review. The verify-address route uses the service role to bypass RLS
-- for the initial insert.
create policy "address_verifications_update_admin"
  on public.address_verifications for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','city_official')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin','city_official')
    )
  );

comment on table public.address_verifications is
  'Audit trail of every address-verification attempt. Source of truth for verification history; profiles table mirrors the latest verified outcome.';
