create table if not exists ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('boost', 'featured')),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  title text not null,
  budget_cents int not null default 0,
  spent_cents int not null default 0,
  start_date date,
  end_date date,
  target_city_id uuid references cities(id),
  target_interests text[],
  impression_count int not null default 0,
  click_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table ad_campaigns enable row level security;
create policy "Business owners manage own campaigns" on ad_campaigns
  for all using (auth.uid() = owner_id);
