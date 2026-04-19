-- 062_couriers_deliveries.sql
-- In-house courier model with manual vendor assignment. NO GPS tracking —
-- customers see text-based status updates via Supabase Realtime on the
-- deliveries.status column (see OrderTracker + /dashboard/courier pages).
--
-- Explicitly excluded: a delivery_location_pings table. This is a product
-- decision (privacy + complexity), not a TODO.
--
-- Applied as part of Phase P5: Food + Delivery Parity.

-- Register 'courier' on the user_role enum so dashboards can gate by role.
alter type public.user_role add value if not exists 'courier';

-- ── couriers ───────────────────────────────────────────────────────────
create table if not exists public.couriers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  display_name text,
  phone text,
  vehicle_type text,
  license_plate text,
  stripe_account_id text,
  status text not null default 'offline'
    check (status in ('offline','available','on_delivery','suspended')),
  city_id uuid references public.cities(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists couriers_user_idx on public.couriers (user_id);
create index if not exists couriers_city_status_idx
  on public.couriers (city_id, status)
  where active = true;

alter table public.couriers enable row level security;

-- Courier reads own row
create policy "couriers_self_read"
  on public.couriers for select
  using (user_id = auth.uid());

-- Courier updates own row (status toggle, contact info)
create policy "couriers_self_update"
  on public.couriers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins + city officials manage all couriers
create policy "couriers_admin_all"
  on public.couriers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin','city_official')
    )
  );

-- Business owners in the same city can read available couriers for assignment
create policy "couriers_business_read"
  on public.couriers for select
  using (
    exists (
      select 1 from public.businesses b
      where b.owner_id = auth.uid()
        and b.city_id = couriers.city_id
    )
  );

-- ── deliveries ─────────────────────────────────────────────────────────
create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.orders(id) on delete cascade,
  courier_id uuid references public.couriers(id),
  status text not null default 'pending'
    check (status in ('pending','assigned','picked_up','delivered','failed','cancelled')),
  assigned_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  pickup_eta timestamptz,
  dropoff_eta timestamptz,
  tip_cents int not null default 0,
  proof_photo_url text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deliveries_courier_idx
  on public.deliveries (courier_id, status);
create index if not exists deliveries_order_idx
  on public.deliveries (order_id);
create index if not exists deliveries_status_idx
  on public.deliveries (status);

alter table public.deliveries enable row level security;

-- Courier reads own deliveries
create policy "deliveries_courier_read"
  on public.deliveries for select
  using (
    exists (
      select 1 from public.couriers c
      where c.id = deliveries.courier_id
        and c.user_id = auth.uid()
    )
  );

-- Courier updates own delivery (status transitions)
create policy "deliveries_courier_update"
  on public.deliveries for update
  using (
    exists (
      select 1 from public.couriers c
      where c.id = deliveries.courier_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.couriers c
      where c.id = deliveries.courier_id
        and c.user_id = auth.uid()
    )
  );

-- Business owner reads deliveries for their orders
create policy "deliveries_business_read"
  on public.deliveries for select
  using (
    exists (
      select 1 from public.orders o
      join public.businesses b on b.id = o.business_id
      where o.id = deliveries.order_id
        and b.owner_id = auth.uid()
    )
  );

-- Business owner creates/updates deliveries for their orders (assignment UI)
create policy "deliveries_business_manage"
  on public.deliveries for all
  using (
    exists (
      select 1 from public.orders o
      join public.businesses b on b.id = o.business_id
      where o.id = deliveries.order_id
        and b.owner_id = auth.uid()
    )
  );

-- Customer reads delivery for their own order
create policy "deliveries_customer_read"
  on public.deliveries for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = deliveries.order_id
        and o.customer_id = auth.uid()
    )
  );

-- Admins manage all deliveries
create policy "deliveries_admin_all"
  on public.deliveries for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin','city_official')
    )
  );

-- ── delivery_audit_log ─────────────────────────────────────────────────
-- Append-only audit trail for every state transition on a delivery.
create table if not exists public.delivery_audit_log (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.deliveries(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists delivery_audit_log_delivery_idx
  on public.delivery_audit_log (delivery_id, created_at desc);

alter table public.delivery_audit_log enable row level security;

-- Courier reads audit for own deliveries
create policy "delivery_audit_log_courier_read"
  on public.delivery_audit_log for select
  using (
    exists (
      select 1 from public.deliveries d
      join public.couriers c on c.id = d.courier_id
      where d.id = delivery_audit_log.delivery_id
        and c.user_id = auth.uid()
    )
  );

-- Business owner reads audit for deliveries on their orders
create policy "delivery_audit_log_business_read"
  on public.delivery_audit_log for select
  using (
    exists (
      select 1 from public.deliveries d
      join public.orders o on o.id = d.order_id
      join public.businesses b on b.id = o.business_id
      where d.id = delivery_audit_log.delivery_id
        and b.owner_id = auth.uid()
    )
  );

-- Admins read all audit
create policy "delivery_audit_log_admin_read"
  on public.delivery_audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin','city_official')
    )
  );

-- Writes happen server-side; no INSERT/UPDATE/DELETE policies for authenticated
-- users. The /api/deliveries/[id]/status route uses the authed client but the
-- actor_id is pulled from auth.uid() and the admin client is preferred for
-- tight audit writes.

comment on table public.couriers is
  'In-house couriers. status drives available-pool lookups for vendor assignment. NO GPS tracking — see OrderTracker for text-based status updates.';
comment on table public.deliveries is
  'One row per delivery order. Manually created when a vendor assigns a courier. Mirrors order lifecycle with its own status enum.';
comment on table public.delivery_audit_log is
  'Append-only audit for delivery state transitions and courier actions.';
