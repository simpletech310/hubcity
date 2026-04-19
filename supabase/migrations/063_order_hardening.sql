-- 063_order_hardening.sql
-- Add audit + lifecycle columns to orders plus an append-only order_audit_log.
-- idempotency_key mirrors the Stripe PaymentIntent key for cross-referencing
-- (the authoritative cache lives in public.payment_intents from migration 048).
--
-- Applied as part of Phase P5: Food + Delivery Parity.

-- ── orders: lifecycle + audit columns ──────────────────────────────────
alter table public.orders
  add column if not exists idempotency_key text;

alter table public.orders
  add column if not exists cancellation_reason text;

alter table public.orders
  add column if not exists cancelled_at timestamptz;

alter table public.orders
  add column if not exists partial_refund_reason text;

alter table public.orders
  add column if not exists receipt_url text;

alter table public.orders
  add column if not exists store_accepted_at timestamptz;

alter table public.orders
  add column if not exists prep_ready_at timestamptz;

create index if not exists orders_idempotency_key_idx
  on public.orders (idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'Mirrors the Stripe PaymentIntent idempotency key. The authoritative cache lives in payment_intents.';
comment on column public.orders.cancellation_reason is
  'Free-form reason captured when status transitions to cancelled (either by customer within window, or vendor/admin).';
comment on column public.orders.partial_refund_reason is
  'Reason text for a partial refund. Full refunds use cancellation_reason.';
comment on column public.orders.receipt_url is
  'Stripe-hosted receipt URL pulled from charges.data[0].receipt_url on payment_intent.succeeded. No PDF generation — just reuse the Stripe-hosted link.';
comment on column public.orders.store_accepted_at is
  'Timestamp when the vendor accepted/confirmed the order (status -> confirmed).';
comment on column public.orders.prep_ready_at is
  'Timestamp when the kitchen marked the order ready (status -> ready).';

-- ── order_audit_log ────────────────────────────────────────────────────
-- Append-only: who did what to an order, with structured metadata.
create table if not exists public.order_audit_log (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_audit_log_order_idx
  on public.order_audit_log (order_id, created_at desc);

alter table public.order_audit_log enable row level security;

-- Business owner reads audit for their orders
create policy "order_audit_log_owner_read"
  on public.order_audit_log for select
  using (
    exists (
      select 1 from public.orders o
      join public.businesses b on b.id = o.business_id
      where o.id = order_audit_log.order_id
        and b.owner_id = auth.uid()
    )
  );

-- Customer reads audit for own orders
create policy "order_audit_log_customer_read"
  on public.order_audit_log for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_audit_log.order_id
        and o.customer_id = auth.uid()
    )
  );

-- Admins read all
create policy "order_audit_log_admin_read"
  on public.order_audit_log for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role in ('admin','city_official')
    )
  );

-- Server-side only writes: no INSERT/UPDATE/DELETE policies for authenticated users.

comment on table public.order_audit_log is
  'Append-only audit trail for order lifecycle events. Written by server routes (payment intent, webhook, status, refund, cancel).';
