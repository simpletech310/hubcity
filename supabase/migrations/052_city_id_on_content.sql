-- 052_city_id_on_content.sql
-- Spread city_id across every content table that needs multi-city scoping.
-- Backfills existing rows to Compton (the only city currently with content).
--
-- Safe to re-run: uses IF NOT EXISTS on column adds and a where-clause on the
-- UPDATE so re-running after backfill is a no-op.

do $$
declare
  compton_id uuid;
  tbl text;
  feed_tbls text[] := array[
    'profiles','businesses','events','job_listings','resources',
    'health_resources','parks','schools','community_groups','channels',
    'live_streams','podcasts','museum_exhibits','gallery_items',
    'notable_people','library_items','murals','posts','city_highlights',
    'civic_officials','city_issues','polls','surveys','city_meetings',
    'city_alerts','coupons','menu_items','bookings','orders','ticket_orders',
    'district_posts','trustee_area_posts','group_posts'
  ];
begin
  select id into compton_id from public.cities where slug = 'compton';
  if compton_id is null then
    raise exception 'Compton city row missing; run 049_cities.sql first';
  end if;

  foreach tbl in array feed_tbls loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=tbl) then
      execute format(
        'alter table public.%I add column if not exists city_id uuid references public.cities(id);',
        tbl
      );
      execute format(
        'update public.%I set city_id = %L where city_id is null;',
        tbl, compton_id
      );
      execute format(
        'create index if not exists %I_city_idx on public.%I (city_id);',
        tbl, tbl
      );
    end if;
  end loop;
end $$;

-- Feed tables sort by recency within a city — composite index speeds the
-- common WHERE city_id = :x ORDER BY created_at DESC pattern.
do $$
declare
  tbl text;
  feed_order_tbls text[] := array[
    'events','posts','businesses','job_listings','resources',
    'city_highlights','museum_exhibits','gallery_items'
  ];
begin
  foreach tbl in array feed_order_tbls loop
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name=tbl and column_name='created_at')
    and exists (select 1 from information_schema.columns
                where table_schema='public' and table_name=tbl and column_name='city_id') then
      execute format(
        'create index if not exists %I_city_created_idx on public.%I (city_id, created_at desc);',
        tbl, tbl
      );
    end if;
  end loop;
end $$;

comment on column public.profiles.city_id is
  'Home city (set by verify-address flow). Overrides the legacy text `city` column.';
