-- 078_post_video_url.sql
-- Adds Supabase-hosted video support to posts (non-Mux path).
--
-- Context: posts.media_type already supports 'video', but there's no column
-- for a plain Supabase Storage URL — only Mux fields. Add video_url + a
-- path-for-deletion column and create the post-videos bucket with public
-- read + authenticated write/delete policies (same shape as 075's
-- business-images / menu-item-images).
--
-- Idempotent: safe to re-run.

-- ── Columns ────────────────────────────────────────────────────────────
alter table public.posts
  add column if not exists video_url  text,
  add column if not exists video_path text;

comment on column public.posts.video_url is
  'Public URL of a Supabase-hosted video (post-videos bucket). Populated when media_type=''video'' and no Mux asset is used.';
comment on column public.posts.video_path is
  'Storage path for deletion. Mirrors the pattern used in the reels table.';

-- ── Storage bucket ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('post-videos', 'post-videos', true)
on conflict (id) do nothing;

-- ── RLS policies ───────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can read post-videos'
  ) then
    create policy "Public can read post-videos"
      on storage.objects for select
      to public
      using (bucket_id = 'post-videos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can write post-videos'
  ) then
    create policy "Authenticated can write post-videos"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'post-videos');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can delete post-videos'
  ) then
    create policy "Authenticated can delete post-videos"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'post-videos');
  end if;
end
$$;
