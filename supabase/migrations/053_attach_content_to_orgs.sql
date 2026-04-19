-- 053_attach_content_to_orgs.sql
-- Resources gain an organization_id FK (replacing the free-text
-- `organization` column during a grace period).
-- Culture tables get organization_id pointing at The Compton Museum for
-- existing content.

-- Resources: add organization_id; backfill one organization per distinct free-text value.
alter table public.resources
  add column if not exists organization_id uuid references public.organizations(id);

do $$
declare
  compton_id uuid;
  r record;
  new_org_id uuid;
begin
  select id into compton_id from public.cities where slug = 'compton';

  -- One resource_provider organization per unique non-null organization string.
  for r in
    select distinct trim(organization) as org_name
    from public.resources
    where organization is not null
      and trim(organization) <> ''
      and organization_id is null
  loop
    insert into public.organizations (slug, name, type, city_id, verified, description)
    values (
      lower(regexp_replace(r.org_name, '[^a-zA-Z0-9]+', '-', 'g')),
      r.org_name,
      'resource_provider',
      compton_id,
      false,
      'Auto-created from legacy resources.organization text value. Claim via admin dashboard.'
    )
    on conflict (slug) do update set name = excluded.name
    returning id into new_org_id;

    update public.resources
       set organization_id = new_org_id
     where organization = r.org_name
       and organization_id is null;
  end loop;
end $$;

create index if not exists resources_org_idx on public.resources (organization_id);

-- Culture tables: attach existing rows to The Compton Museum (org id from 050).
alter table public.museum_exhibits
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.gallery_items
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.notable_people
  add column if not exists organization_id uuid references public.organizations(id);
alter table public.library_items
  add column if not exists organization_id uuid references public.organizations(id);

update public.museum_exhibits
   set organization_id = '00000000-0000-0000-0000-000000000001'::uuid
 where organization_id is null;
update public.gallery_items
   set organization_id = '00000000-0000-0000-0000-000000000001'::uuid
 where organization_id is null;
update public.notable_people
   set organization_id = '00000000-0000-0000-0000-000000000001'::uuid
 where organization_id is null;
update public.library_items
   set organization_id = '00000000-0000-0000-0000-000000000001'::uuid
 where organization_id is null;

create index if not exists museum_exhibits_org_idx on public.museum_exhibits (organization_id);
create index if not exists gallery_items_org_idx on public.gallery_items (organization_id);
create index if not exists notable_people_org_idx on public.notable_people (organization_id);
create index if not exists library_items_org_idx on public.library_items (organization_id);

comment on column public.resources.organization_id is
  'Owning organization. Legacy resources.organization text column kept during transition; will be dropped after the dashboard flow is updated.';
