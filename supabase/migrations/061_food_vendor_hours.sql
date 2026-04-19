-- 061_food_vendor_hours.sql
-- Per-weekday open/close hours for food businesses. Used by the
-- create-payment-intent route to block orders placed outside business hours.
-- Empty table means "no hours configured" — grandfather businesses that
-- haven't filled in hours yet (explicit flag-off for the enforcement path).
--
-- Applied as part of Phase P5: Food + Delivery Parity.

create table if not exists public.food_vendor_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists food_vendor_hours_business_idx
  on public.food_vendor_hours (business_id);

create index if not exists food_vendor_hours_business_day_idx
  on public.food_vendor_hours (business_id, day_of_week)
  where active = true;

alter table public.food_vendor_hours enable row level security;

-- Anyone can read hours (public storefront needs them for "closed today" UI)
create policy "food_vendor_hours_public_read"
  on public.food_vendor_hours for select
  using (true);

-- Business owner manages their own hours
create policy "food_vendor_hours_owner_all"
  on public.food_vendor_hours for all
  using (
    exists (
      select 1 from public.businesses
      where id = food_vendor_hours.business_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses
      where id = food_vendor_hours.business_id
        and owner_id = auth.uid()
    )
  );

-- Admins can manage all hours
create policy "food_vendor_hours_admin_all"
  on public.food_vendor_hours for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin','city_official')
    )
  );

comment on table public.food_vendor_hours is
  'Weekly open/close schedule for food businesses. Rows are per day_of_week (0 = Sunday). Empty for a business = unrestricted (grandfathered); see create-payment-intent store-hours enforcement.';
