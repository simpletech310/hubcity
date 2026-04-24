-- Table to track which reminders have been sent
create table if not exists event_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h', '1h')),
  sent_at timestamptz not null default now(),
  unique (event_id, user_id, reminder_type)
);

-- Index for the cron query
create index if not exists idx_reminder_logs_event_user
  on event_reminder_logs(event_id, user_id);

-- In-app notifications table (if it doesn't already exist)
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_unread
  on notifications(user_id, is_read) where not is_read;

-- RLS
alter table event_reminder_logs enable row level security;
alter table notifications enable row level security;

create policy "Users see own reminder logs" on event_reminder_logs
  for select using (auth.uid() = user_id);

create policy "Users see own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "Users can mark notifications read" on notifications
  for update using (auth.uid() = user_id);

-- Service role can insert notifications (for the cron/edge function)
create policy "Service role can insert notifications" on notifications
  for insert with check (true);

create policy "Service role can insert reminder logs" on event_reminder_logs
  for insert with check (true);
