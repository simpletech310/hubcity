-- 049_cities.sql
-- Multi-city foundation. Every content table eventually gets a city_id FK.
-- Seeded with the 4 launch cities. Additional cities are added by inserting
-- rows; no code change required.

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  state text not null default 'CA',
  timezone text not null default 'America/Los_Angeles',
  default_zip_codes text[] not null default '{}',
  mapbox_center_lng numeric,
  mapbox_center_lat numeric,
  mapbox_bounds jsonb,                   -- [[swLng,swLat],[neLng,neLat]]
  districts jsonb,                       -- per-city district definitions
  launch_status text not null default 'coming_soon'
    check (launch_status in ('live','coming_soon','hidden')),
  theme jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cities_slug_idx on public.cities (slug);

alter table public.cities enable row level security;

-- Cities are public reference data. Everyone can read; only admins can write.
create policy "cities_select_all" on public.cities for select using (true);

-- Seed the 4 launch cities.
insert into public.cities (slug, name, state, timezone, default_zip_codes,
  mapbox_center_lng, mapbox_center_lat, launch_status, districts)
values
  (
    'compton', 'Compton', 'CA', 'America/Los_Angeles',
    array['90220','90221','90222','90223','90224'],
    -118.2201, 33.8958,
    'live',
    jsonb_build_object(
      '1', jsonb_build_object('name','District 1','zip_codes',array['90222']),
      '2', jsonb_build_object('name','District 2','zip_codes',array['90221']),
      '3', jsonb_build_object('name','District 3','zip_codes',array['90220']),
      '4', jsonb_build_object('name','District 4','zip_codes',array['90223','90224'])
    )
  ),
  (
    'inglewood', 'Inglewood', 'CA', 'America/Los_Angeles',
    array['90301','90302','90303','90304','90305'],
    -118.3531, 33.9617,
    'coming_soon',
    null
  ),
  (
    'hawthorne', 'Hawthorne', 'CA', 'America/Los_Angeles',
    array['90250','90251','90260'],
    -118.3526, 33.9164,
    'coming_soon',
    null
  ),
  (
    'south-gate', 'South Gate', 'CA', 'America/Los_Angeles',
    array['90280'],
    -118.2120, 33.9547,
    'coming_soon',
    null
  )
on conflict (slug) do nothing;

comment on table public.cities is
  'Launch cities + per-city config (bounds, districts, theme). Content scopes by city_id FK.';
