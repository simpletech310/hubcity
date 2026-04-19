-- 066_culture_org_rls.sql
-- Replace the old "admin/city_official only" RLS on culture tables with
-- organization-member-scoped policies. Owners/admins/curators of the owning
-- org can write; public reads published content.
--
-- Note: existing rows already have organization_id set (migration 053) —
-- defaulted to The Compton Museum for legacy content.

-- Enforce organization_id NOT NULL going forward.
alter table public.museum_exhibits alter column organization_id set not null;
alter table public.gallery_items   alter column organization_id set not null;
alter table public.notable_people  alter column organization_id set not null;
alter table public.library_items   alter column organization_id set not null;

-- Drop old role-based policies and rewrite as org-member-scoped.
-- Table-by-table, since each can have slightly different policy names from legacy migrations.

do $$
declare
  tbl text;
  pol record;
  culture_tables text[] := array['museum_exhibits','gallery_items','notable_people','library_items'];
begin
  foreach tbl in array culture_tables loop
    -- Drop any existing policies on the table so we can redefine cleanly.
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;

    -- Public can read rows that are published (is_published=true) OR rows that
    -- belong to an org the user is a member of.
    execute format($f$
      create policy "%1$s_select_published_or_org_member"
        on public.%1$s for select
        using (
          coalesce(is_published, true) = true
          or exists (
            select 1 from public.organization_members m
            where m.org_id = %1$I.organization_id
              and m.user_id = auth.uid()
          )
        )
    $f$, tbl);

    -- Insert requires org membership with role ≥ curator (or platform admin).
    execute format($f$
      create policy "%1$s_insert_org_curator"
        on public.%1$s for insert
        with check (
          exists (
            select 1 from public.organization_members m
            where m.org_id = %1$I.organization_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin','curator')
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    $f$, tbl);

    -- Update — same gate.
    execute format($f$
      create policy "%1$s_update_org_curator"
        on public.%1$s for update
        using (
          exists (
            select 1 from public.organization_members m
            where m.org_id = %1$I.organization_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin','curator')
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    $f$, tbl);

    -- Delete — owner/admin only (more restrictive than update).
    execute format($f$
      create policy "%1$s_delete_org_admin"
        on public.%1$s for delete
        using (
          exists (
            select 1 from public.organization_members m
            where m.org_id = %1$I.organization_id
              and m.user_id = auth.uid()
              and m.role in ('owner','admin')
          )
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
          )
        )
    $f$, tbl);
  end loop;
end $$;

comment on column public.museum_exhibits.organization_id is
  'Owning organization (e.g. The Compton Museum). Write access requires membership role >= curator.';
