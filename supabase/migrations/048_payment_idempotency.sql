-- 048_payment_idempotency.sql
-- Belt-and-suspenders idempotency for Stripe PaymentIntent creation.
-- Client sends an `Idempotency-Key` header; we cache the resulting PaymentIntent
-- so duplicate submits (network retries, double-clicks) return the cached
-- intent instead of creating a new one and double-charging.

create table if not exists public.payment_intents (
  idempotency_key text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null check (resource_type in ('booking','order','ticket')),
  resource_id uuid,
  stripe_payment_intent_id text not null,
  amount_cents integer not null,
  currency text not null default 'usd',
  client_secret text,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

create index if not exists payment_intents_stripe_idx
  on public.payment_intents (stripe_payment_intent_id);

create index if not exists payment_intents_user_created_idx
  on public.payment_intents (user_id, created_at desc);

alter table public.payment_intents enable row level security;

-- Owners can read their own intent records (useful for debug / retry clients).
create policy "payment_intents_select_own"
  on public.payment_intents
  for select
  using (auth.uid() = user_id);

-- Writes happen only via the server (service-role or server-signed request).
-- No insert/update policies for authenticated users.

comment on table public.payment_intents is
  'Idempotency cache for Stripe PaymentIntent creation. Keyed by (user_id, idempotency_key). Server writes only.';
