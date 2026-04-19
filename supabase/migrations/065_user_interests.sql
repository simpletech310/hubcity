-- 065_user_interests.sql
-- Per-user culture interests. Drives personalized culture feed ranking.
-- Intentionally NOT a replacement for the generic `profile_tags` (those are
-- tied to posts/hashtags) — this is a dedicated, small, culture-only signal.

create table if not exists public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.culture_categories(id) on delete cascade,
  weight smallint not null default 1 check (weight between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index if not exists user_interests_cat_idx on public.user_interests (category_id);

alter table public.user_interests enable row level security;

create policy "user_interests_select_own"
  on public.user_interests for select using (auth.uid() = user_id);

create policy "user_interests_upsert_own"
  on public.user_interests for insert with check (auth.uid() = user_id);

create policy "user_interests_update_own"
  on public.user_interests for update using (auth.uid() = user_id);

create policy "user_interests_delete_own"
  on public.user_interests for delete using (auth.uid() = user_id);

comment on table public.user_interests is
  'User culture interest weights (1-5). Joined with culture_categories for personalized feed ranking.';
