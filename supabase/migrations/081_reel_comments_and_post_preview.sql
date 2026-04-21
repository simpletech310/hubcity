-- 081_reel_comments_and_post_preview.sql
--
-- Engagement parity: reels get their own comment table + counts. Posts already
-- have `comments`; we add a lightweight SQL function to surface the two most
-- recent top-level comments per post so the Pulse feed can render an
-- Instagram-style inline preview without N+1 queries.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. reel_comments — mirror the posts `comments` shape but scoped to reels
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.reel_comments (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  parent_id uuid references public.reel_comments(id) on delete cascade,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_reel_comments_reel on public.reel_comments(reel_id, created_at desc);
create index if not exists idx_reel_comments_author on public.reel_comments(author_id);
create index if not exists idx_reel_comments_parent on public.reel_comments(parent_id);

alter table public.reel_comments enable row level security;

drop policy if exists reel_comments_read_public on public.reel_comments;
create policy reel_comments_read_public on public.reel_comments
  for select using (is_published = true);

drop policy if exists reel_comments_insert_self on public.reel_comments;
create policy reel_comments_insert_self on public.reel_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists reel_comments_update_self on public.reel_comments;
create policy reel_comments_update_self on public.reel_comments
  for update to authenticated using (author_id = auth.uid());

drop policy if exists reel_comments_delete_self on public.reel_comments;
create policy reel_comments_delete_self on public.reel_comments
  for delete to authenticated using (author_id = auth.uid());

-- Keep reels.comment_count in sync
create or replace function public.bump_reel_comment_count() returns trigger
language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' and new.is_published then
    update public.reels set comment_count = comment_count + 1 where id = new.reel_id;
    return new;
  elsif tg_op = 'DELETE' and old.is_published then
    update public.reels set comment_count = greatest(comment_count - 1, 0) where id = old.reel_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_reel_comments_count on public.reel_comments;
create trigger trg_reel_comments_count
  after insert or delete on public.reel_comments
  for each row execute function public.bump_reel_comment_count();

-- Realtime publication for live-updating reel reactions + comments
do $$ begin
  execute 'alter publication supabase_realtime add table public.reel_comments';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'alter publication supabase_realtime add table public.reel_reactions';
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. post_recent_comments view — newest top-level comment per post
--    (used by Pulse feed for inline comment preview — Instagram style)
--
-- We surface two rows per post using a window function, joined to the author
-- profile. Client passes a list of post_ids and filters client-side.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace view public.post_recent_comments as
select
  c.id,
  c.post_id,
  c.author_id,
  c.body,
  c.created_at,
  c.parent_id,
  p.display_name as author_display_name,
  p.handle as author_handle,
  p.avatar_url as author_avatar_url,
  p.verification_status as author_verification_status,
  row_number() over (partition by c.post_id order by c.created_at desc) as rank
from public.comments c
join public.profiles p on p.id = c.author_id
where c.is_published = true and c.parent_id is null;

grant select on public.post_recent_comments to anon, authenticated;
