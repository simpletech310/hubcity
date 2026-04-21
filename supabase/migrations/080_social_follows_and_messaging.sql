-- 080_social_follows_and_messaging.sql
--
-- Social layer: user-to-user follows + 1:1 direct messages.
-- Adds Realtime publication for follows + messages + post_reactions +
-- comments so feeds and threads update without polling.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_follows — symmetric "X follows Y" graph
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_follows_no_self_follow check (follower_id <> followed_id),
  constraint user_follows_unique_pair unique (follower_id, followed_id)
);

create index if not exists idx_user_follows_follower on public.user_follows(follower_id, created_at desc);
create index if not exists idx_user_follows_followed on public.user_follows(followed_id, created_at desc);

alter table public.user_follows enable row level security;

drop policy if exists user_follows_read_all on public.user_follows;
create policy user_follows_read_all on public.user_follows for select using (true);

drop policy if exists user_follows_insert_self on public.user_follows;
create policy user_follows_insert_self on public.user_follows
  for insert to authenticated
  with check (follower_id = auth.uid());

drop policy if exists user_follows_delete_self on public.user_follows;
create policy user_follows_delete_self on public.user_follows
  for delete to authenticated
  using (follower_id = auth.uid());

-- Denormalized counts on profiles for fast reads
alter table public.profiles
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

create or replace function public.bump_follow_counts() returns trigger
language plpgsql security definer as $$
begin
  if (tg_op = 'INSERT') then
    update public.profiles set follower_count = follower_count + 1 where id = new.followed_id;
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.followed_id;
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_user_follows_count on public.user_follows;
create trigger trg_user_follows_count
  after insert or delete on public.user_follows
  for each row execute function public.bump_follow_counts();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. conversations + conversation_participants — 1:1 DMs (extensible to group)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- For 1:1 DMs we hash the (lower, higher) participant pair into pair_key so we
  -- can upsert/lookup an existing thread cheaply without a Cartesian self-join.
  pair_key text unique,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversations_last_message on public.conversations(last_message_at desc nulls last);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  is_archived boolean not null default false,
  primary key (conversation_id, user_id)
);

create index if not exists idx_cp_user on public.conversation_participants(user_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  gif_url text,
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_has_content check (
    coalesce(length(body), 0) > 0 or gif_url is not null or image_url is not null
  )
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index if not exists idx_messages_sender on public.messages(sender_id, created_at desc);

-- ── RLS ──
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

drop policy if exists conv_read_participants on public.conversations;
create policy conv_read_participants on public.conversations
  for select to authenticated using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  );

drop policy if exists conv_insert_authenticated on public.conversations;
create policy conv_insert_authenticated on public.conversations
  for insert to authenticated with check (true);

drop policy if exists conv_update_participants on public.conversations;
create policy conv_update_participants on public.conversations
  for update to authenticated using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = id and p.user_id = auth.uid()
    )
  );

drop policy if exists cp_read_self on public.conversation_participants;
create policy cp_read_self on public.conversation_participants
  for select to authenticated using (
    user_id = auth.uid()
    or exists (
      select 1 from public.conversation_participants p2
      where p2.conversation_id = conversation_id and p2.user_id = auth.uid()
    )
  );

drop policy if exists cp_insert_self_or_via_creator on public.conversation_participants;
create policy cp_insert_self_or_via_creator on public.conversation_participants
  for insert to authenticated with check (true);

drop policy if exists cp_update_self on public.conversation_participants;
create policy cp_update_self on public.conversation_participants
  for update to authenticated using (user_id = auth.uid());

drop policy if exists msg_read_participants on public.messages;
create policy msg_read_participants on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

drop policy if exists msg_insert_participants on public.messages;
create policy msg_insert_participants on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants p
      where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()
    )
  );

-- Trigger: when a message is sent, bump conversations.last_message_at + preview.
create or replace function public.touch_conversation_on_message() returns trigger
language plpgsql security definer as $$
begin
  update public.conversations
    set last_message_at = new.created_at,
        last_message_preview = case
          when new.body is not null and length(new.body) > 0 then left(new.body, 140)
          when new.gif_url is not null then '🎞️ GIF'
          when new.image_url is not null then '📷 Image'
          else 'New message'
        end
    where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists trg_messages_touch_conv on public.messages;
create trigger trg_messages_touch_conv
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Realtime publication — opt these tables in so client subscriptions work
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  -- Add to default supabase_realtime publication. ADD silently no-ops if the
  -- table is already in the publication.
  execute 'alter publication supabase_realtime add table public.user_follows';
exception when duplicate_object then null; end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.messages';
exception when duplicate_object then null; end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.conversations';
exception when duplicate_object then null; end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.post_reactions';
exception when duplicate_object then null; end $$;

do $$
begin
  execute 'alter publication supabase_realtime add table public.comments';
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Helper RPC: find_or_create_dm(other_user_id) — atomic DM start
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.find_or_create_dm(other_user_id uuid)
returns uuid
language plpgsql security definer as $$
declare
  me uuid := auth.uid();
  pk text;
  conv_id uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if me = other_user_id then raise exception 'cannot DM self'; end if;

  -- Stable pair key: lower:higher uuid as text
  pk := least(me::text, other_user_id::text) || ':' || greatest(me::text, other_user_id::text);

  select id into conv_id from public.conversations where pair_key = pk;
  if conv_id is null then
    insert into public.conversations (pair_key) values (pk) returning id into conv_id;
    insert into public.conversation_participants (conversation_id, user_id) values (conv_id, me);
    insert into public.conversation_participants (conversation_id, user_id) values (conv_id, other_user_id);
  end if;
  return conv_id;
end $$;

grant execute on function public.find_or_create_dm(uuid) to authenticated;
