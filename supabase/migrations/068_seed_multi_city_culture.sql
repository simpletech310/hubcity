-- 068_seed_multi_city_culture.sql
-- Flip Inglewood, Hawthorne, and South Gate to `live` and seed one cultural
-- organization + a handful of exhibits/gallery rows each so users can actually
-- browse culture content for cities other than Compton.
--
-- This is SEED data for demo/dev. Real content will be added by the orgs
-- themselves through the dashboard once they're onboarded.

-- 1. Flip cities live
update public.cities set launch_status = 'live'
 where slug in ('inglewood','hawthorne','south-gate');

-- 2. Seed one cultural org per city
insert into public.organizations (id, slug, name, type, city_id, verified, description, logo_url)
select
  '00000000-0000-0000-0000-000000000011'::uuid,
  'inglewood-cultural-center',
  'Inglewood Cultural Arts',
  'cultural',
  c.id, true,
  'Celebrating the art, music, and stories of Inglewood — from the Forum era to today''s SoFi renaissance.',
  null
from public.cities c where c.slug = 'inglewood'
on conflict (id) do nothing;

insert into public.organizations (id, slug, name, type, city_id, verified, description, logo_url)
select
  '00000000-0000-0000-0000-000000000012'::uuid,
  'hawthorne-heritage',
  'Hawthorne Heritage Society',
  'cultural',
  c.id, true,
  'Preserving Hawthorne''s aerospace legacy, Beach Boys roots, and small-town charm.',
  null
from public.cities c where c.slug = 'hawthorne'
on conflict (id) do nothing;

insert into public.organizations (id, slug, name, type, city_id, verified, description, logo_url)
select
  '00000000-0000-0000-0000-000000000013'::uuid,
  'south-gate-cultural-alliance',
  'South Gate Cultural Alliance',
  'cultural',
  c.id, true,
  'Honoring South Gate''s industrial roots and its vibrant Latino cultural present.',
  null
from public.cities c where c.slug = 'south-gate'
on conflict (id) do nothing;

-- 3. Resolve local vars for city ids and category ids
do $$
declare
  inglewood_id uuid;
  hawthorne_id uuid;
  south_gate_id uuid;
  music_cat uuid;
  perf_cat uuid;
  history_cat uuid;
  visual_cat uuid;
  photo_cat uuid;
begin
  select id into inglewood_id   from public.cities where slug = 'inglewood';
  select id into hawthorne_id   from public.cities where slug = 'hawthorne';
  select id into south_gate_id  from public.cities where slug = 'south-gate';

  select id into music_cat   from public.culture_categories where slug = 'music';
  select id into perf_cat    from public.culture_categories where slug = 'performance';
  select id into history_cat from public.culture_categories where slug = 'history';
  select id into visual_cat  from public.culture_categories where slug = 'visual-art';
  select id into photo_cat   from public.culture_categories where slug = 'photography';

  ------------------------------------------------------------------
  -- Inglewood exhibits + gallery
  ------------------------------------------------------------------
  insert into public.museum_exhibits (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000011', inglewood_id,
     'The Forum & The Sound', 'forum-and-the-sound',
     'From Showtime Lakers to sold-out concerts — the Forum''s half-century as Inglewood''s amplifier.',
     history_cat, array['forum','music','sports'], true, now()),
    ('00000000-0000-0000-0000-000000000011', inglewood_id,
     'SoFi Rising', 'sofi-rising',
     'Inglewood reborn: a photo survey of the SoFi Stadium era, from groundbreaking to Super Bowl LVI.',
     photo_cat, array['sofi','2020s','renewal'], true, now()),
    ('00000000-0000-0000-0000-000000000011', inglewood_id,
     'Market Street Murals', 'market-street-murals',
     'Inglewood''s outdoor gallery — thirty years of Black and Latino muralists on Market Street walls.',
     visual_cat, array['murals','market-street'], true, now())
  on conflict (slug) do nothing;

  insert into public.gallery_items (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000011', inglewood_id,
     'Showtime at the Forum', 'showtime-forum-print',
     'Limited-edition print commemorating the 1985 championship banner raising.',
     perf_cat, array['lakers','1985'], true, now()),
    ('00000000-0000-0000-0000-000000000011', inglewood_id,
     'Market Street Mural #12', 'market-st-mural-12',
     'Large-scale portrait mural on Market Street, 2018.',
     visual_cat, array['mural'], true, now())
  on conflict (slug) do nothing;

  ------------------------------------------------------------------
  -- Hawthorne exhibits + gallery
  ------------------------------------------------------------------
  insert into public.museum_exhibits (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000012', hawthorne_id,
     'Beach Boys: Hawthorne Roots', 'beach-boys-roots',
     'The Wilson brothers'' childhood home, 119th Street, and the sound that rewrote California.',
     music_cat, array['beach-boys','1960s','pop'], true, now()),
    ('00000000-0000-0000-0000-000000000012', hawthorne_id,
     'Aerospace City', 'aerospace-city',
     'From Northrop to SpaceX — seventy years of Hawthorne''s aerospace backbone.',
     history_cat, array['aerospace','northrop','spacex'], true, now()),
    ('00000000-0000-0000-0000-000000000012', hawthorne_id,
     'Ed Ruscha''s Hawthorne', 'ruscha-hawthorne',
     'Photographs and ephemera from Ed Ruscha''s Hawthorne-adjacent series of the 1960s.',
     photo_cat, array['ruscha','photography'], true, now())
  on conflict (slug) do nothing;

  insert into public.gallery_items (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000012', hawthorne_id,
     'In My Room (45 sleeve)', 'in-my-room-sleeve',
     'Original 1963 single sleeve from the Beach Boys'' early catalog.',
     music_cat, array['beach-boys'], true, now()),
    ('00000000-0000-0000-0000-000000000012', hawthorne_id,
     'Falcon 9 First Stage', 'falcon-9-first-stage',
     'Photograph of a recovered Falcon 9 first stage, SpaceX Hawthorne HQ.',
     photo_cat, array['spacex','aerospace'], true, now())
  on conflict (slug) do nothing;

  ------------------------------------------------------------------
  -- South Gate exhibits + gallery
  ------------------------------------------------------------------
  insert into public.museum_exhibits (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000013', south_gate_id,
     'Firestone & Ford: The Industrial Era', 'firestone-ford',
     'The factories that built South Gate — Firestone tires, Ford assembly, and the middle-class boom they anchored.',
     history_cat, array['industry','1950s'], true, now()),
    ('00000000-0000-0000-0000-000000000013', south_gate_id,
     'Banda & the Boulevard', 'banda-and-the-boulevard',
     'South Gate''s banda renaissance — Tweedy Boulevard dance halls, quinceañera DJs, and the sound of the new south LA.',
     music_cat, array['banda','latin','dance'], true, now()),
    ('00000000-0000-0000-0000-000000000013', south_gate_id,
     'Tweedy Street Gallery', 'tweedy-street-gallery',
     'Storefront murals and community portraiture along Tweedy Boulevard.',
     visual_cat, array['murals','tweedy'], true, now())
  on conflict (slug) do nothing;

  insert into public.gallery_items (organization_id, city_id, title, slug, description, category_id, tags, is_published, created_at)
  values
    ('00000000-0000-0000-0000-000000000013', south_gate_id,
     'Firestone Plant, 1957', 'firestone-plant-1957',
     'Archival photograph of the Firestone Rubber plant at shift change.',
     photo_cat, array['firestone','archival'], true, now()),
    ('00000000-0000-0000-0000-000000000013', south_gate_id,
     'Tweedy Boulevard Saturday Night', 'tweedy-saturday-night',
     'Street photography series, 2022.',
     photo_cat, array['tweedy','photography'], true, now())
  on conflict (slug) do nothing;
end $$;

-- 4. Sanity: make sure every seeded row has a city_id (belt-and-suspenders
-- for the 052 backfill on brand-new rows).
update public.museum_exhibits set city_id = o.city_id
  from public.organizations o
 where museum_exhibits.organization_id = o.id
   and museum_exhibits.city_id is null;

update public.gallery_items set city_id = o.city_id
  from public.organizations o
 where gallery_items.organization_id = o.id
   and gallery_items.city_id is null;
