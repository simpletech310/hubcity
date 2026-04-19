-- 051_user_cities.sql
-- Users can have one verified "home" city (where their address lives) and
-- follow any number of other live cities to see their base content. Follower
-- rows are opt-in; home rows are created by the verify-address flow.

create table if not exists public.user_cities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  role text not null default 'follower'
    check (role in ('home','follower')),
  verified_at timestamptz,                  -- set only when role='home'
  created_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

create index if not exists user_cities_city_idx on public.user_cities (city_id);

-- Only one 'home' city per user.
create unique index if not exists user_cities_one_home_per_user
  on public.user_cities (user_id) where role = 'home';

alter table public.user_cities enable row level security;

create policy "user_cities_select_own"
  on public.user_cities for select using (auth.uid() = user_id);

create policy "user_cities_insert_own"
  on public.user_cities for insert with check (auth.uid() = user_id);

create policy "user_cities_delete_own"
  on public.user_cities for delete using (auth.uid() = user_id);

-- Home-city rows must be written by the server (verify-address route) using
-- the service role; no direct-client update policy for role/verified_at.

comment on table public.user_cities is
  'User <-> city many-to-many. One home city (verified residency) + any number of followed cities.';
