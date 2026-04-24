-- Collab splits on content
create table if not exists content_collabs (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('reel', 'video', 'post')),
  content_id uuid not null,
  initiator_id uuid not null references auth.users(id) on delete cascade,
  collaborator_id uuid not null references auth.users(id) on delete cascade,
  initiator_split_pct int not null default 50 check (initiator_split_pct between 1 and 99),
  collaborator_split_pct int not null generated always as (100 - initiator_split_pct) stored,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (content_type, content_id, collaborator_id)
);

alter table content_collabs enable row level security;

create policy "Participants can view their collabs" on content_collabs
  for select using (auth.uid() = initiator_id or auth.uid() = collaborator_id);

create policy "Initiator can create collabs" on content_collabs
  for insert with check (auth.uid() = initiator_id);

create policy "Collaborator can accept/decline" on content_collabs
  for update using (auth.uid() = collaborator_id);

create policy "Initiator can delete pending collabs" on content_collabs
  for delete using (auth.uid() = initiator_id and status = 'pending');
