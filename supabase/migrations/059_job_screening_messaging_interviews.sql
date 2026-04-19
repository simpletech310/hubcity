-- 059_job_screening_messaging_interviews.sql
-- Job board parity phase 2: screening questionnaires, applicant <-> employer
-- messaging, interview scheduling, saved jobs, job alerts, and EEO capture.
--
-- EEO data is stored in a dedicated table (job_eeo_responses) rather than on
-- job_applications so that RLS can hard-block the employer from ever reading
-- it. The applicant owns the row; only the applicant and platform admins can
-- see it.
--
-- All tables have RLS enabled.

-- ── Screening questions ────────────────────────────────────────────────
create table if not exists public.job_screening_questions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_listings(id) on delete cascade,
  question text not null,
  type text not null check (type in ('yes_no','short_text','long_text','multiple_choice','number')),
  options jsonb,
  required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists job_screening_questions_job_idx
  on public.job_screening_questions (job_id, sort_order);

alter table public.job_screening_questions enable row level security;

-- Anyone can read questions for a listing they can see (mirrors job_listings
-- visibility: active listings are public).
create policy "screening_questions_select_public"
  on public.job_screening_questions for select
  using (
    exists (
      select 1 from public.job_listings jl
      where jl.id = job_id and jl.is_active = true
    )
  );

-- Poster (or admin) can manage the question bank for their own listing.
create policy "screening_questions_write_poster"
  on public.job_screening_questions for all
  using (
    exists (
      select 1 from public.job_listings jl
      where jl.id = job_id
        and (jl.posted_by = auth.uid()
             or exists (
               select 1 from public.profiles p
               where p.id = auth.uid() and p.role = 'admin'
             ))
    )
  )
  with check (
    exists (
      select 1 from public.job_listings jl
      where jl.id = job_id
        and (jl.posted_by = auth.uid()
             or exists (
               select 1 from public.profiles p
               where p.id = auth.uid() and p.role = 'admin'
             ))
    )
  );

-- ── Screening answers (one row per question per application) ───────────
create table if not exists public.job_application_answers (
  application_id uuid not null references public.job_applications(id) on delete cascade,
  question_id uuid not null references public.job_screening_questions(id) on delete cascade,
  answer text,
  created_at timestamptz not null default now(),
  primary key (application_id, question_id)
);

create index if not exists job_application_answers_question_idx
  on public.job_application_answers (question_id);

alter table public.job_application_answers enable row level security;

-- Applicant can read/write their own answers.
create policy "application_answers_applicant"
  on public.job_application_answers for all
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_id and a.applicant_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_applications a
      where a.id = application_id and a.applicant_id = auth.uid()
    )
  );

-- Poster (and admin) can read answers on applications to their own listings.
create policy "application_answers_poster_read"
  on public.job_application_answers for select
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id
        and (jl.posted_by = auth.uid()
             or exists (
               select 1 from public.profiles p
               where p.id = auth.uid() and p.role = 'admin'
             ))
    )
  );

-- ── Messaging between applicant and employer ───────────────────────────
create table if not exists public.job_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists job_messages_application_idx
  on public.job_messages (application_id, created_at);
create index if not exists job_messages_sender_idx
  on public.job_messages (sender_id);

alter table public.job_messages enable row level security;

-- Both sides of the thread can read every message.
create policy "job_messages_select_thread_parties"
  on public.job_messages for select
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or jl.posted_by = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Either party can send a message; sender_id must equal auth.uid().
create policy "job_messages_insert_thread_parties"
  on public.job_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or jl.posted_by = auth.uid())
    )
  );

-- Recipient can mark messages read (updates read_at). We authorize any thread
-- party to UPDATE; application-level logic restricts to read_at writes.
create policy "job_messages_update_thread_parties"
  on public.job_messages for update
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or jl.posted_by = auth.uid())
    )
  );

-- ── Interview scheduling ───────────────────────────────────────────────
create table if not exists public.job_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.job_applications(id) on delete cascade,
  scheduled_at timestamptz not null,
  location text,
  meeting_url text,
  interviewer_note text,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','cancelled','no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_interviews_application_idx
  on public.job_interviews (application_id, scheduled_at desc);

alter table public.job_interviews enable row level security;

-- Both applicant and poster can read scheduled interviews on the thread.
create policy "job_interviews_select_thread_parties"
  on public.job_interviews for select
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id
        and (a.applicant_id = auth.uid() or jl.posted_by = auth.uid())
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Only the poster (employer) can schedule / update interviews.
create policy "job_interviews_write_poster"
  on public.job_interviews for all
  using (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id and jl.posted_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.job_applications a
      join public.job_listings jl on jl.id = a.job_listing_id
      where a.id = application_id and jl.posted_by = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ── Saved jobs ─────────────────────────────────────────────────────────
create table if not exists public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.job_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists saved_jobs_user_idx
  on public.saved_jobs (user_id, created_at desc);

alter table public.saved_jobs enable row level security;

create policy "saved_jobs_owner"
  on public.saved_jobs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Job alerts (saved search, emailed daily/weekly) ────────────────────
create table if not exists public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  filters jsonb not null,
  frequency text not null default 'weekly'
    check (frequency in ('daily','weekly')),
  last_sent_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists job_alerts_user_idx
  on public.job_alerts (user_id);
create index if not exists job_alerts_active_idx
  on public.job_alerts (active, frequency);

alter table public.job_alerts enable row level security;

create policy "job_alerts_owner"
  on public.job_alerts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── EEO responses (applicant-only; employer has NO access) ─────────────
-- Isolated in a separate table with zero employer-facing RLS policies, so
-- even a misbehaving query joining against job_applications cannot leak
-- these fields. Admin access is intentionally scoped to compliance review.
create table if not exists public.job_eeo_responses (
  application_id uuid primary key references public.job_applications(id) on delete cascade,
  gender text,
  race text,
  veteran_status text,
  disability text,
  created_at timestamptz not null default now()
);

alter table public.job_eeo_responses enable row level security;

-- Applicant can insert / read / update their own row.
create policy "job_eeo_applicant"
  on public.job_eeo_responses for all
  using (
    exists (
      select 1 from public.job_applications a
      where a.id = application_id and a.applicant_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_applications a
      where a.id = application_id and a.applicant_id = auth.uid()
    )
  );

-- Admins (compliance) can read all rows. No UPDATE/INSERT/DELETE policy for
-- admins so the applicant remains the source of truth.
create policy "job_eeo_admin_read"
  on public.job_eeo_responses for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.job_eeo_responses is
  'Equal Employment Opportunity demographic data. Collected per US federal guidance. NEVER shown to employers. Separate-table isolation is the enforcement mechanism — do not add columns to job_applications instead.';
