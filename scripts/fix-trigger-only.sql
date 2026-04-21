-- FIX: ensure_channel_for_profile trigger function
-- Restore user creation / synchronization functionality

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
