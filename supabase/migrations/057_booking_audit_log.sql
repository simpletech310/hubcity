-- 057_booking_audit_log.sql
-- Booking parity (P3): append-only audit log for every state change that
-- affects a booking. Writes happen from the server (admin client). Business
-- owners can read their own bookings' logs; platform admins can read all.

create table if not exists public.booking_audit_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_audit_log_booking_idx
  on public.booking_audit_log (booking_id, created_at desc);

create index if not exists booking_audit_log_actor_idx
  on public.booking_audit_log (actor_id);

-- Block updates/deletes at the DB level — this table is append-only.
create or replace function public.booking_audit_log_block_mutations()
returns trigger
language plpgsql
as $$
begin
  raise exception 'booking_audit_log is append-only';
end;
$$;

drop trigger if exists booking_audit_log_no_update on public.booking_audit_log;
create trigger booking_audit_log_no_update
  before update or delete on public.booking_audit_log
  for each row execute function public.booking_audit_log_block_mutations();

alter table public.booking_audit_log enable row level security;

-- Business owners can read logs for bookings attached to their businesses.
drop policy if exists "booking_audit_log_owner_read" on public.booking_audit_log;
create policy "booking_audit_log_owner_read"
  on public.booking_audit_log for select
  using (
    exists (
      select 1 from public.bookings bk
      join public.businesses b on b.id = bk.business_id
      where bk.id = booking_audit_log.booking_id
        and b.owner_id = auth.uid()
    )
  );

-- Platform admins can read all logs.
drop policy if exists "booking_audit_log_admin_read" on public.booking_audit_log;
create policy "booking_audit_log_admin_read"
  on public.booking_audit_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Writes: server-only via service role. No insert policy for authenticated.

comment on table public.booking_audit_log is
  'Append-only record of state changes for a booking (created, confirmed, cancelled, refunded, reminder_sent, etc). Server writes only.';
