-- 076_multi_city_foundation.sql
-- Foundational multi-city expansion:
--   1. Seeds two additional CA cities (Long Beach, Carson) as `coming_soon`
--      so the CityPicker has more than one option out of the box. Inglewood,
--      Hawthorne, and South Gate were already seeded in 049.
--   2. Promotes the previously hardcoded Compton history timeline into a
--      `city_history` table keyed by city_id and seeds the existing 13
--      entries for Compton.
--   3. Adds a `city_art_features` table that supersedes the in-code
--      `art-spotlight.ts` rotation — features a piece of art / heritage
--      object on the city's home page.
--
-- Re-runnable: ON CONFLICT DO NOTHING on every insert; CREATE TABLE IF NOT
-- EXISTS for new tables.

-- ── 1. Additional cities ──────────────────────────────────────────────────
insert into public.cities
  (slug, name, state, timezone, default_zip_codes,
   mapbox_center_lng, mapbox_center_lat, launch_status, districts)
values
  (
    'long-beach', 'Long Beach', 'CA', 'America/Los_Angeles',
    array['90802','90803','90804','90805','90806','90807','90808','90810','90813','90814','90815'],
    -118.1937, 33.7701,
    'coming_soon',
    null
  ),
  (
    'carson', 'Carson', 'CA', 'America/Los_Angeles',
    array['90745','90746','90747','90810','90895'],
    -118.2820, 33.8317,
    'coming_soon',
    null
  )
on conflict (slug) do nothing;


-- ── 2. city_history table ────────────────────────────────────────────────
create table if not exists public.city_history (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  year text not null,            -- e.g. "1867", "1920s"
  sort_year integer not null,    -- numeric sort key (1867, 1920, etc.)
  title text not null,
  description text not null,
  color text,
  category text not null check (category in (
    'founding','civil_rights','music','sports','politics','renaissance','culture','industry'
  )),
  created_at timestamptz not null default now()
);

create index if not exists city_history_city_idx
  on public.city_history (city_id, sort_year);

alter table public.city_history enable row level security;

drop policy if exists "city_history_select_all" on public.city_history;
create policy "city_history_select_all"
  on public.city_history for select using (true);

comment on table public.city_history is
  'Per-city history timeline. Used by /culture/history pages and city museum.';


-- Seed Compton history (mirrors the original src/lib/compton-history.ts)
do $$
declare
  compton_id uuid;
begin
  select id into compton_id from public.cities where slug = 'compton';
  if compton_id is null then
    raise notice 'Compton city missing — skipping history seed';
    return;
  end if;

  insert into public.city_history
    (city_id, year, sort_year, title, description, color, category)
  values
    (compton_id, '1867', 1867, 'Griffith D. Compton Founds the Settlement',
     'A group of 30 pioneering families led by Griffith Dickenson Compton settled the area after trekking from Northern California. They established a farming community on land purchased from the Dominguez Rancho, planting the roots of what would become one of America''s most culturally significant cities.',
     '#8B7355', 'founding'),
    (compton_id, '1888', 1888, 'City of Compton Incorporated',
     'Compton officially incorporated as a city, becoming one of the oldest cities in the region. Agriculture and dairy farming drove the early economy, with the Pacific Electric Railway connecting Compton to Los Angeles and Long Beach.',
     '#8B7355', 'founding'),
    (compton_id, '1920s', 1920, 'A Growing Agricultural Hub',
     'Compton grew as a thriving agricultural community. Japanese-American farmers cultivated strawberry fields and nurseries throughout the area. The city''s central location between LA and Long Beach earned it the name ''Hub City'' — a name that endures today.',
     '#6B8E23', 'founding'),
    (compton_id, '1940s', 1940, 'The Great Migration Reshapes the City',
     'African Americans migrating from the South settled in Compton, drawn by wartime jobs and the promise of homeownership. The city''s demographics began a historic transformation that would define its cultural identity for generations to come.',
     '#4169E1', 'civil_rights'),
    (compton_id, '1969', 1969, 'Douglas F. Dollarhide Makes History',
     'Douglas F. Dollarhide became the first African American mayor of Compton, marking a turning point in the city''s political landscape. His election reflected the growing civic power of Black residents and set the stage for decades of community-led governance.',
     '#7C3AED', 'politics'),
    (compton_id, '1973', 1973, 'Doris Davis — First Black Woman Mayor',
     'Doris Davis was elected mayor of Compton, becoming the first Black woman to lead a major metropolitan city in the United States. Her groundbreaking leadership proved that Compton was a city of firsts, paving the way for women of color in politics nationwide.',
     '#7C3AED', 'politics'),
    (compton_id, '1986', 1986, 'N.W.A and the Birth of Gangsta Rap',
     'Eazy-E, Dr. Dre, Ice Cube, MC Ren, and DJ Yella formed N.W.A in Compton. Their raw, unfiltered documentation of street life created an entirely new genre and put Compton on the global cultural map forever. ''Straight Outta Compton'' became a defining album of a generation.',
     '#EF4444', 'music'),
    (compton_id, '1990s', 1990, 'The Golden Era of West Coast Hip-Hop',
     'DJ Quik, MC Eiht, Compton''s Most Wanted, and The Game carried the torch. Compton producers and MCs refined G-funk and West Coast gangsta rap into a global art form. The city''s name became synonymous with authentic, boundary-pushing music.',
     '#F59E0B', 'music'),
    (compton_id, '1995', 1995, 'Venus & Serena Williams Rise from Compton Courts',
     'Venus and Serena Williams, trained on the public courts of Compton by their father Richard, burst onto the professional tennis scene. They would go on to become two of the greatest athletes in history, forever linked to their Compton roots.',
     '#10B981', 'sports'),
    (compton_id, '2012', 2012, 'Kendrick Lamar — Good Kid, M.A.A.D City',
     'Kendrick Lamar released ''good kid, m.A.A.d city,'' a vivid portrait of growing up in Compton that earned critical acclaim worldwide. He would go on to win a Pulitzer Prize for Music — the first non-classical, non-jazz artist to do so — cementing Compton''s place in global culture.',
     '#C5A04E', 'music'),
    (compton_id, '2015', 2015, 'Straight Outta Compton — The Film',
     'The biographical film about N.W.A grossed over $200 million worldwide, introducing Compton''s story to a new generation. The movie reignited global interest in the city''s cultural impact and sparked renewed pride among residents.',
     '#EF4444', 'music'),
    (compton_id, '2020s', 2020, 'The Compton Renaissance',
     'A new generation of creators, entrepreneurs, and civic leaders are reshaping Compton. Knect TV amplifies local voices, new businesses are opening, murals are transforming neighborhoods, and the Compton Art & History Museum preserves the culture for future generations. The Hub City''s best chapter is being written now.',
     '#C5A04E', 'renaissance')
  on conflict do nothing;
end $$;


-- ── 3. city_art_features table ───────────────────────────────────────────
create table if not exists public.city_art_features (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  slug text not null,
  title text not null,
  artist text not null,
  artist_bio text,
  medium text,
  year text,
  location text,
  location_address text,
  description text,
  image_url text,
  artist_image_url text,
  artist_website text,
  artist_instagram text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

create index if not exists city_art_features_city_idx
  on public.city_art_features (city_id, display_order);

alter table public.city_art_features enable row level security;

drop policy if exists "city_art_features_select_all" on public.city_art_features;
create policy "city_art_features_select_all"
  on public.city_art_features for select using (true);

comment on table public.city_art_features is
  'Featured art pieces shown as the homepage hero per city. Replaces the in-code art-spotlight.ts list.';


-- Seed Compton art features (mirrors src/lib/art-spotlight.ts)
do $$
declare
  compton_id uuid;
begin
  select id into compton_id from public.cities where slug = 'compton';
  if compton_id is null then return; end if;

  insert into public.city_art_features
    (city_id, slug, title, artist, artist_bio, medium, year, location,
     location_address, description, image_url, tags, is_featured, display_order)
  values
    (compton_id, 'compton-museum', 'Compton Museum',
     'Compton Art & History Museum',
     'The Compton Art & History Museum preserves and celebrates the rich cultural heritage of Compton, California — showcasing local art, history, and community stories for residents and visitors alike.',
     'Photography', '2026', 'Compton, CA',
     '106 W Compton Blvd, Compton',
     'A striking photograph from the Compton Art & History Museum, capturing the spirit and cultural legacy of one of Compton''s most important cultural institutions.',
     '/images/compton-museum-hero.jpg',
     array['museum','compton','culture','history','photography'],
     true, 0),
    (compton_id, 'compton-hub-city-mural', 'Compton Hub City',
     'Unknown Compton Artist',
     'A vibrant mural celebrating the identity of Compton as the Hub City, where major freeways 110, 710, 91, and 105 converge. The piece captures the city''s rich culture — from its music roots to its vision for the future with the Hotel, Convention Center, and Casino — all centered around an eye on the world.',
     'Mural / Mixed Media', '2024', 'Compton, CA',
     'Compton, CA 90220',
     'This iconic mural represents Compton at the crossroads — literally and figuratively. Featuring the interstate highways that make Compton the ''Hub City'', the artwork weaves together the Airport Air Show, music heritage, Martin Luther King Jr.''s legacy, and the city''s bold future plans. The central eye symbolizes Compton watching the world while the world watches Compton.',
     '/images/art/compton-hub-city-mural.jpg',
     array['mural','compton','culture','heritage','community'],
     false, 1)
  on conflict (city_id, slug) do nothing;
end $$;
