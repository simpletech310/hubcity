-- 079_auto_channel_for_non_business.sql
-- Auto-create a channel for every profile whose role is NOT business_owner.
-- Business accounts intentionally don't get a channel by default; creators,
-- ambassadors, residents, officials, etc. do. Users can still delete their
-- channel (idempotent opt-out).
--
-- Runs on INSERT OR UPDATE of profiles.role so it catches both fresh
-- signups (where role is NULL on insert and set later) and role changes.
-- Skips if the profile already owns a channel.

-- ── 1. Trigger function ────────────────────────────────────────────────
create or replace function public.ensure_channel_for_profile()
returns trigger
language plpgsql
security definer
as $$
declare
  existing_channel uuid;
  target_slug text;
  candidate_slug text;
  attempt int := 0;
begin
  -- Business owners: do nothing.
  if new.role = 'business_owner' then
    return new;
  end if;

  -- Skip if this profile already owns a channel.
  select id into existing_channel from public.channels where owner_id = new.id limit 1;
  if existing_channel is not null then
    return new;
  end if;

  -- Build a unique slug from handle, display_name, or id.
  target_slug := coalesce(
    nullif(new.handle, ''),
    regexp_replace(lower(coalesce(new.display_name, '')), '[^a-z0-9]+', '-', 'g'),
    substr(new.id::text, 1, 8)
  );
  target_slug := regexp_replace(target_slug, '^-+|-+$', '', 'g');
  if target_slug = '' then
    target_slug := substr(new.id::text, 1, 8);
  end if;

  candidate_slug := target_slug;
  loop
    exit when not exists (select 1 from public.channels where slug = candidate_slug);
    attempt := attempt + 1;
    candidate_slug := target_slug || '-' || attempt;
    if attempt > 25 then
      candidate_slug := target_slug || '-' || substr(new.id::text, 1, 6);
      exit;
    end if;
  end loop;

  insert into public.channels (
    owner_id, name, slug, description, avatar_url, is_active, scope, type, city_id
  ) values (
    new.id,
    coalesce(new.display_name, 'Channel'),
    candidate_slug,
    new.bio,
    new.avatar_url,
    true,
    'local',
    'community',
    new.city_id
  );

  return new;
end
$$;

-- ── 2. Trigger ─────────────────────────────────────────────────────────
drop trigger if exists ensure_channel_for_profile_ins on public.profiles;
create trigger ensure_channel_for_profile_ins
  after insert on public.profiles
  for each row execute function public.ensure_channel_for_profile();

drop trigger if exists ensure_channel_for_profile_upd on public.profiles;
create trigger ensure_channel_for_profile_upd
  after update of role on public.profiles
  for each row
  when (old.role is distinct from new.role)
  execute function public.ensure_channel_for_profile();

-- ── 3. Back-fill existing non-business profiles without a channel ─────
do $$
declare
  p record;
  target_slug text;
  candidate_slug text;
  attempt int;
begin
  for p in
    select pr.id, pr.handle, pr.display_name, pr.bio, pr.avatar_url, pr.city_id
    from public.profiles pr
    where (pr.role is null or pr.role <> 'business_owner')
      and not exists (select 1 from public.channels c where c.owner_id = pr.id)
  loop
    target_slug := coalesce(
      nullif(p.handle, ''),
      regexp_replace(lower(coalesce(p.display_name, '')), '[^a-z0-9]+', '-', 'g'),
      substr(p.id::text, 1, 8)
    );
    target_slug := regexp_replace(target_slug, '^-+|-+$', '', 'g');
    if target_slug = '' then
      target_slug := substr(p.id::text, 1, 8);
    end if;

    candidate_slug := target_slug;
    attempt := 0;
    loop
      exit when not exists (select 1 from public.channels where slug = candidate_slug);
      attempt := attempt + 1;
      candidate_slug := target_slug || '-' || attempt;
      if attempt > 25 then
        candidate_slug := target_slug || '-' || substr(p.id::text, 1, 6);
        exit;
      end if;
    end loop;

    insert into public.channels (
      owner_id, name, slug, description, avatar_url, is_active, scope, type, city_id
    ) values (
      p.id,
      coalesce(p.display_name, 'Channel'),
      candidate_slug,
      p.bio,
      p.avatar_url,
      true,
      'local',
      'community',
      p.city_id
    );
  end loop;
end
$$;
