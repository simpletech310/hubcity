-- 058_jobs_columns.sql
-- Job board parity: extend job_listings with fields Indeed/LinkedIn-class
-- boards expose (benefits, experience level, category, employment type,
-- explicit salary period, expiration, remote flag) plus a full-text search
-- column and supporting indexes for feed queries.
--
-- Safe to re-run: every ADD COLUMN uses IF NOT EXISTS, and generated /
-- index creation guards check for prior state. Most columns are new in
-- this migration; is_remote already ships in 007_jobs.sql but we keep
-- a guard for clarity.

-- ── New columns ────────────────────────────────────────────────────────
alter table public.job_listings
  add column if not exists benefits text[];

alter table public.job_listings
  add column if not exists experience_level text
    check (experience_level in ('entry','mid','senior','executive'));

alter table public.job_listings
  add column if not exists category text;

alter table public.job_listings
  add column if not exists employment_type text
    check (employment_type in ('full_time','part_time','contract','internship','seasonal','temporary'));

-- salary_period sits alongside the legacy salary_type column so existing
-- data is untouched. New writes should populate both for the transition.
alter table public.job_listings
  add column if not exists salary_period text
    check (salary_period in ('hour','week','month','year','commission','tips'));

alter table public.job_listings
  add column if not exists expires_at timestamptz;

alter table public.job_listings
  add column if not exists is_remote boolean default false;

comment on column public.job_listings.benefits is
  'Array of benefit tags, e.g. {health_insurance,401k,pto,remote_ok}. Display-only.';
comment on column public.job_listings.experience_level is
  'Target seniority: entry | mid | senior | executive.';
comment on column public.job_listings.category is
  'Free-text taxonomy (e.g. "Food Service", "Retail"). Used for filtering.';
comment on column public.job_listings.employment_type is
  'Standard employment classification mirrored from Indeed/LinkedIn taxonomy. Prefer this over legacy job_type for new integrations.';
comment on column public.job_listings.salary_period is
  'Period for salary_min/salary_max: hour | week | month | year | commission | tips.';
comment on column public.job_listings.expires_at is
  'When the listing auto-deactivates. The jobs-expire cron flips is_active=false after this timestamp.';

-- ── Full-text search ───────────────────────────────────────────────────
-- Postgres generated stored tsvector so we never need a trigger.
alter table public.job_listings
  add column if not exists fts tsvector
    generated always as (
      to_tsvector(
        'english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(requirements, '')
      )
    ) stored;

create index if not exists job_listings_fts_idx
  on public.job_listings using gin (fts);

-- ── Feed index ─────────────────────────────────────────────────────────
-- Most feed queries look like:
--   where city_id = :x and is_active and (expires_at is null or expires_at > now())
-- Composite index lets Postgres short-circuit without scanning stale rows.
create index if not exists job_listings_city_active_expires_idx
  on public.job_listings (city_id, is_active, expires_at);
