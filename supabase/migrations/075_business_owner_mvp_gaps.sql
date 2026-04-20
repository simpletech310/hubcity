-- 075_business_owner_mvp_gaps.sql
-- Closes four gaps in the business-owner MVP:
--   1. Customer email receipts (track receipt_sent_at to avoid double-send)
--   2. Multi-image gallery for menu items (image_urls alongside existing
--      image_url + gallery_urls; populated automatically from existing data)
--   3. "Our story" long-form copy on businesses for the public profile
--   4. Featured-review flag for the public profile
--
-- Idempotent: safe to re-run.

-- ── Orders / Bookings: receipt timestamps ──────────────────────────────
alter table public.orders
  add column if not exists receipt_sent_at timestamptz;

alter table public.bookings
  add column if not exists receipt_sent_at timestamptz;

create index if not exists orders_receipt_sent_at_idx
  on public.orders (receipt_sent_at)
  where receipt_sent_at is null;

create index if not exists bookings_receipt_sent_at_idx
  on public.bookings (receipt_sent_at)
  where receipt_sent_at is null;

comment on column public.orders.receipt_sent_at is
  'Timestamp the customer email receipt was sent. NULL means a receipt is still owed. Used as an idempotency guard so we never double-send.';
comment on column public.bookings.receipt_sent_at is
  'Timestamp the customer booking confirmation receipt was sent. NULL means a receipt is still owed.';

-- ── Menu items: multi-image gallery ────────────────────────────────────
-- The codebase already has `image_url` (single hero) and `gallery_urls`
-- (extra photos). We add `image_urls` as a normalized array view that
-- callers can use uniformly. It is materialized via a generated column so
-- existing rows automatically expose [image_url, ...gallery_urls] without
-- a backfill step.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'menu_items'
      and column_name = 'image_urls'
  ) then
    execute $sql$
      alter table public.menu_items
        add column image_urls text[]
        generated always as (
          case
            when image_url is null and (gallery_urls is null or array_length(gallery_urls, 1) is null)
              then array[]::text[]
            when image_url is null
              then gallery_urls
            when gallery_urls is null or array_length(gallery_urls, 1) is null
              then array[image_url]
            else array_prepend(image_url, gallery_urls)
          end
        ) stored
    $sql$;
  end if;
end
$$;

comment on column public.menu_items.image_urls is
  'Normalized read-only view: [image_url, ...gallery_urls]. Use image_url + gallery_urls when writing.';

-- ── Businesses: "Our story" long-form copy ─────────────────────────────
alter table public.businesses
  add column if not exists story text;

comment on column public.businesses.story is
  'Long-form narrative shown on the public business profile in the Our Story section. Optional; falls back to description.';

-- ── Business reviews: featured flag ────────────────────────────────────
alter table public.business_reviews
  add column if not exists is_featured boolean not null default false;

create index if not exists business_reviews_featured_idx
  on public.business_reviews (business_id, is_featured)
  where is_featured = true;

comment on column public.business_reviews.is_featured is
  'When true, the review is highlighted in the Featured Reviews block on the public profile.';

-- ── Storage bucket for business + menu galleries ───────────────────────
insert into storage.buckets (id, name, public)
values ('business-images', 'business-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('menu-item-images', 'menu-item-images', true)
on conflict (id) do nothing;

-- Public read for both buckets
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can read business-images'
  ) then
    create policy "Public can read business-images"
      on storage.objects for select
      to public
      using (bucket_id = 'business-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Public can read menu-item-images'
  ) then
    create policy "Public can read menu-item-images"
      on storage.objects for select
      to public
      using (bucket_id = 'menu-item-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can write business-images'
  ) then
    create policy "Authenticated can write business-images"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'business-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can write menu-item-images'
  ) then
    create policy "Authenticated can write menu-item-images"
      on storage.objects for insert
      to authenticated
      with check (bucket_id = 'menu-item-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can delete business-images'
  ) then
    create policy "Authenticated can delete business-images"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'business-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Authenticated can delete menu-item-images'
  ) then
    create policy "Authenticated can delete menu-item-images"
      on storage.objects for delete
      to authenticated
      using (bucket_id = 'menu-item-images');
  end if;
end
$$;
