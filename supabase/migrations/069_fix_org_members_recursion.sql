-- 069_fix_org_members_recursion.sql
-- Fix an infinite-recursion RLS policy on organization_members.
--
-- The original policy (migration 050) queried organization_members inside
-- its own SELECT policy to support "members of org X can see each other",
-- which Postgres rejects with error 42P17 ("infinite recursion detected
-- in policy for relation"). The error cascades into any other policy that
-- does `EXISTS (SELECT 1 FROM organization_members …)` — killing reads on
-- museum_exhibits, gallery_items, resources, and any culture content.
--
-- Simplification: users see their own membership rows only. The broader
-- "team roster" view can be served via a SECURITY DEFINER function later
-- if it's needed; RLS is the wrong layer for that query.

drop policy if exists "organization_members_select_self_or_same_org"
  on public.organization_members;

create policy "organization_members_select_own"
  on public.organization_members for select
  using (auth.uid() = user_id);

-- Any RLS on culture tables that does EXISTS against organization_members
-- still works because the subquery is filtered by m.user_id = auth.uid() —
-- that matches rows the new simpler policy permits.
