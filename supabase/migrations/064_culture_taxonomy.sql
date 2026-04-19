-- 064_culture_taxonomy.sql
-- Shared culture taxonomy so users can express interests and get a
-- personalized culture feed across multiple cultural organizations.

create table if not exists public.culture_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.culture_categories enable row level security;
create policy "culture_categories_select_all"
  on public.culture_categories for select using (true);

insert into public.culture_categories (slug, name, icon, sort_order) values
  ('visual-art',    'Visual Art',         'Palette',    10),
  ('music',         'Music',              'Music',      20),
  ('performance',   'Performance',        'Theater',    30),
  ('history',       'History',            'Scroll',     40),
  ('literature',    'Literature & Poetry','BookOpen',   50),
  ('film-video',    'Film & Video',       'Film',       60),
  ('photography',   'Photography',        'Camera',     70),
  ('fashion',       'Fashion',            'Shirt',      80),
  ('food-culinary', 'Food & Culinary',    'ChefHat',    90),
  ('community',     'Community Stories',  'Users',     100)
on conflict (slug) do nothing;

-- Attach categories + tags to culture content. Already have organization_id from 053.
alter table public.museum_exhibits add column if not exists category_id uuid references public.culture_categories(id);
alter table public.museum_exhibits add column if not exists tags text[] not null default '{}';
alter table public.gallery_items   add column if not exists category_id uuid references public.culture_categories(id);
alter table public.gallery_items   add column if not exists tags text[] not null default '{}';
alter table public.notable_people  add column if not exists category_id uuid references public.culture_categories(id);
alter table public.notable_people  add column if not exists tags text[] not null default '{}';
alter table public.library_items   add column if not exists category_id uuid references public.culture_categories(id);
alter table public.library_items   add column if not exists tags text[] not null default '{}';

create index if not exists museum_exhibits_category_idx on public.museum_exhibits (category_id);
create index if not exists gallery_items_category_idx   on public.gallery_items   (category_id);
create index if not exists notable_people_category_idx  on public.notable_people  (category_id);
create index if not exists library_items_category_idx   on public.library_items   (category_id);

-- Culture events — cross-org cultural events (gallery openings, performances, etc.)
create table if not exists public.culture_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete restrict,
  title text not null,
  description text,
  category_id uuid references public.culture_categories(id),
  tags text[] not null default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  image_url text,
  rsvp_url text,
  is_published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists culture_events_city_starts_idx on public.culture_events (city_id, starts_at desc);
create index if not exists culture_events_org_starts_idx  on public.culture_events (organization_id, starts_at desc);
create index if not exists culture_events_cat_idx         on public.culture_events (category_id);

alter table public.culture_events enable row level security;

create policy "culture_events_select_published_or_own_org"
  on public.culture_events for select
  using (
    is_published
    or exists (
      select 1 from public.organization_members m
      where m.org_id = culture_events.organization_id
        and m.user_id = auth.uid()
    )
  );

create policy "culture_events_insert_org_member"
  on public.culture_events for insert
  with check (
    exists (
      select 1 from public.organization_members m
      where m.org_id = culture_events.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin','curator')
    )
  );

create policy "culture_events_update_org_member"
  on public.culture_events for update
  using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = culture_events.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin','curator')
    )
  );

create policy "culture_events_delete_org_admin"
  on public.culture_events for delete
  using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = culture_events.organization_id
        and m.user_id = auth.uid()
        and m.role in ('owner','admin')
    )
  );
