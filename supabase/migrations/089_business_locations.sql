create table if not exists business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,           -- e.g. "Downtown LA" or "Compton"
  address text,
  city_id uuid references cities(id),
  phone text,
  hours jsonb default '{}'::jsonb,  -- { mon: "9am-5pm", ... }
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table business_locations enable row level security;

create policy "Owners manage their locations" on business_locations
  for all using (auth.uid() = owner_id);

-- Index for city-based discovery
create index if not exists idx_business_locations_city
  on business_locations(city_id) where is_active = true;
