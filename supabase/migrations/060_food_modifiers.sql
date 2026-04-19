-- 060_food_modifiers.sql
-- Menu item modifier groups (e.g. "Size", "Toppings") and modifiers within each
-- group. Orders snapshot the chosen modifier name + price delta at the time of
-- purchase so historical orders survive later menu edits.
--
-- Also adds allergens + prep_time_minutes to menu_items for P5 parity.
--
-- Applied as part of Phase P5: Food + Delivery Parity.

-- ── food_item_modifier_groups ──────────────────────────────────────────
create table if not exists public.food_item_modifier_groups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  min_select int not null default 0,
  max_select int not null default 1,
  required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists food_item_modifier_groups_item_idx
  on public.food_item_modifier_groups (item_id, sort_order);

alter table public.food_item_modifier_groups enable row level security;

-- Public reads modifier groups for published businesses
create policy "food_item_modifier_groups_public_read"
  on public.food_item_modifier_groups for select
  using (
    exists (
      select 1 from public.menu_items mi
      join public.businesses b on b.id = mi.business_id
      where mi.id = food_item_modifier_groups.item_id
        and b.is_published = true
    )
  );

-- Business owner manages modifier groups on their menu
create policy "food_item_modifier_groups_owner_all"
  on public.food_item_modifier_groups for all
  using (
    exists (
      select 1 from public.menu_items mi
      join public.businesses b on b.id = mi.business_id
      where mi.id = food_item_modifier_groups.item_id
        and b.owner_id = auth.uid()
    )
  );

-- ── food_item_modifiers ────────────────────────────────────────────────
create table if not exists public.food_item_modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.food_item_modifier_groups(id) on delete cascade,
  name text not null,
  price_delta_cents int not null default 0,
  sort_order int not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists food_item_modifiers_group_idx
  on public.food_item_modifiers (group_id, sort_order);

alter table public.food_item_modifiers enable row level security;

-- Public reads only available modifiers for published businesses
create policy "food_item_modifiers_public_read"
  on public.food_item_modifiers for select
  using (
    is_available = true
    and exists (
      select 1 from public.food_item_modifier_groups g
      join public.menu_items mi on mi.id = g.item_id
      join public.businesses b on b.id = mi.business_id
      where g.id = food_item_modifiers.group_id
        and b.is_published = true
    )
  );

-- Business owner manages modifiers on their menu
create policy "food_item_modifiers_owner_all"
  on public.food_item_modifiers for all
  using (
    exists (
      select 1 from public.food_item_modifier_groups g
      join public.menu_items mi on mi.id = g.item_id
      join public.businesses b on b.id = mi.business_id
      where g.id = food_item_modifiers.group_id
        and b.owner_id = auth.uid()
    )
  );

-- ── order_item_modifiers ───────────────────────────────────────────────
-- Snapshot fields preserve historical accuracy even if the underlying
-- modifier row is renamed or re-priced after the order is placed.
create table if not exists public.order_item_modifiers (
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  modifier_id uuid references public.food_item_modifiers(id),
  name_snapshot text,
  price_delta_cents int not null default 0,
  primary key (order_item_id, modifier_id)
);

create index if not exists order_item_modifiers_order_item_idx
  on public.order_item_modifiers (order_item_id);

alter table public.order_item_modifiers enable row level security;

-- Customer reads own order's modifier selections
create policy "order_item_modifiers_customer_read"
  on public.order_item_modifiers for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and o.customer_id = auth.uid()
    )
  );

-- Business owner reads modifiers on their orders
create policy "order_item_modifiers_owner_read"
  on public.order_item_modifiers for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      join public.businesses b on b.id = o.business_id
      where oi.id = order_item_modifiers.order_item_id
        and b.owner_id = auth.uid()
    )
  );

-- Customer can insert modifier rows for their own orders (during checkout)
create policy "order_item_modifiers_customer_insert"
  on public.order_item_modifiers for insert
  with check (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = order_item_modifiers.order_item_id
        and o.customer_id = auth.uid()
    )
  );

-- ── menu_items additions ───────────────────────────────────────────────
alter table public.menu_items
  add column if not exists allergens text[] not null default '{}';

alter table public.menu_items
  add column if not exists prep_time_minutes int not null default 10;

comment on column public.menu_items.allergens is
  'Allergen tags (e.g. gluten, dairy, nuts, shellfish). Free-form text[] to stay flexible across regions.';
comment on column public.menu_items.prep_time_minutes is
  'Estimated prep time in minutes. Used by vendor dashboards to show ETA to customers.';

comment on table public.food_item_modifier_groups is
  'Groupings of modifiers attached to a menu item (e.g. "Size", "Toppings"). Drives the customer-facing customization UI.';
comment on table public.food_item_modifiers is
  'Individual modifier options within a group. price_delta_cents is added to the base menu item price when selected.';
comment on table public.order_item_modifiers is
  'Customer selections snapshotted at order time. Snapshots preserve history if the modifier is later renamed / deleted / re-priced.';
