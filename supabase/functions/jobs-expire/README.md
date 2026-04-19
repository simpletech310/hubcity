# jobs-expire

Nightly Supabase Edge Function that deactivates expired job listings.

## What it does

For every row in `job_listings` where:

- `is_active = true`
- `expires_at < now()`

…it sets `is_active = false`. Slugs and applications are preserved; the
listing simply stops appearing in feeds and search results.

## Deploy

```bash
supabase functions deploy jobs-expire
```

## Schedule

Supabase dashboard → Database → Cron Jobs, or via SQL:

```sql
select cron.schedule(
  'jobs-expire-nightly',
  '0 9 * * *',           -- 09:00 UTC every day (02:00 PT / 05:00 ET)
  $$
    select net.http_post(
      url := current_setting('app.functions_url') || '/jobs-expire',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);
```

## Environment

The function reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, both of
which Supabase injects automatically into Edge Functions.

## Local test

```bash
supabase functions serve jobs-expire --env-file supabase/.env.local
curl http://localhost:54321/functions/v1/jobs-expire \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Response:

```json
{ "deactivated": 3, "ran_at": "2026-04-19T09:00:00.000Z" }
```
