-- 067_hardening_audit_and_dlq.sql
-- Cross-cutting production hardening:
--   1. Stripe webhook dead-letter queue so unrecoverable handler errors
--      are captured for replay instead of lost to logs.
--   2. Generic order/content audit tables used by code that doesn't already
--      get one from a phase-specific migration.

create table if not exists public.stripe_webhook_failures (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  event_type text,
  received_at timestamptz not null default now(),
  error_message text,
  raw_payload jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  resolution_notes text
);

create index if not exists stripe_webhook_failures_received_idx
  on public.stripe_webhook_failures (received_at desc);
create index if not exists stripe_webhook_failures_unresolved_idx
  on public.stripe_webhook_failures (received_at desc) where resolved_at is null;

alter table public.stripe_webhook_failures enable row level security;

-- Only platform admins see the DLQ.
create policy "stripe_webhook_failures_select_admin"
  on public.stripe_webhook_failures for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "stripe_webhook_failures_update_admin"
  on public.stripe_webhook_failures for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Content audit log — cultural content edits, org membership changes, etc.
-- Booking/order/job audit logs are created in their phase-specific migrations
-- (057, 063, etc.); this one is for everything else.
create table if not exists public.content_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_audit_entity_idx
  on public.content_audit_log (entity_type, entity_id, created_at desc);
create index if not exists content_audit_actor_idx
  on public.content_audit_log (actor_id, created_at desc);

alter table public.content_audit_log enable row level security;

create policy "content_audit_select_admin"
  on public.content_audit_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Append-only: no update / no delete policies. Inserts happen via service role.

comment on table public.stripe_webhook_failures is
  'Unrecoverable Stripe webhook handler errors. Admin dashboard polls unresolved rows and allows replay.';
comment on table public.content_audit_log is
  'Generic append-only audit of content / membership / config changes. Domain-specific audit logs live next to their data (booking_audit_log, order_audit_log, etc.).';
