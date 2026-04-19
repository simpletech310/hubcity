-- 056_booking_columns.sql
-- Booking parity (P3): per-service buffers, cancellation windows, timezone;
-- bookings get staff_id/resource_id FKs, idempotency key, cancellation
-- fields, reminder timestamps. Also a partial UNIQUE index that prevents
-- DB-level double-booking of the same staff in the same slot.
--
-- The services table (migration 017) already exists. We don't rename — it's
-- `services`, not `service_listings`.

-- ─── services: buffers / cancellation / timezone ──────────────────────

alter table public.services
  add column if not exists buffer_before_minutes integer not null default 0,
  add column if not exists buffer_after_minutes integer not null default 0,
  add column if not exists cancellation_window_hours integer not null default 24,
  add column if not exists cancellation_fee_cents integer not null default 0,
  add column if not exists timezone text not null default 'America/Los_Angeles';

-- ─── bookings: staff/resource/idempotency/cancellation/reminders ──────

alter table public.bookings
  add column if not exists staff_id uuid references public.business_staff(id) on delete set null,
  add column if not exists resource_id uuid references public.booking_resources(id) on delete set null,
  add column if not exists idempotency_key text,
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists reminder_24h_sent_at timestamptz,
  add column if not exists reminder_1h_sent_at timestamptz;

create index if not exists bookings_staff_idx on public.bookings (staff_id);
create index if not exists bookings_resource_idx on public.bookings (resource_id);

-- Partial UNIQUE index: for non-cancelled bookings, the tuple
-- (business, date, start_time, end_time, staff) must be unique. This is
-- the last line of defense against race-condition double-bookings even if
-- the API's conflict check misses. NULL staff_id is treated as distinct by
-- Postgres, so walk-in/no-staff bookings don't collide with each other
-- here — that shape is still protected by the overlap check in the API.
create unique index if not exists bookings_staff_slot_unique
  on public.bookings (business_id, date, start_time, end_time, staff_id)
  where status <> 'cancelled';

-- Index to make the reminder-scheduler query cheap.
create index if not exists bookings_reminder_24h_idx
  on public.bookings (date, start_time)
  where reminder_24h_sent_at is null and status = 'confirmed';

create index if not exists bookings_reminder_1h_idx
  on public.bookings (date, start_time)
  where reminder_1h_sent_at is null and status = 'confirmed';

comment on column public.services.buffer_before_minutes is
  'Padding before a booking where no other booking can start (clean-up / prep for the provider).';
comment on column public.services.buffer_after_minutes is
  'Padding after a booking where no other booking can start.';
comment on column public.services.cancellation_window_hours is
  'Hours before the booking start when customer can cancel without fee. Default 24h.';
comment on column public.services.timezone is
  'IANA timezone for interpreting this service''s schedule. Default America/Los_Angeles.';

comment on column public.bookings.idempotency_key is
  'Mirrors the Stripe idempotency key used to create this booking''s payment intent.';
comment on index public.bookings_staff_slot_unique is
  'DB-level double-booking guard: one non-cancelled booking per (business, date, time, staff) tuple.';
