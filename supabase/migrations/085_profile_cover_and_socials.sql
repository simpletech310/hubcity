alter table profiles
  add column if not exists cover_url text,
  add column if not exists website_url text,
  add column if not exists social_links jsonb default '{}'::jsonb;
