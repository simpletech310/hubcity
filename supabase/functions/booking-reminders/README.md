# booking-reminders

Scheduled Supabase Edge Function that sends email reminders for upcoming
confirmed bookings.

## What it does

For every row in `bookings` where:

- `status = 'confirmed'`
- `reminder_24h_sent_at IS NULL`
- the booking's `(date, start_time)` falls roughly 24 hours from now
  (the function uses a ±1h fuzz window so it works with any cron cadence
  up to every hour)

…it:

1. Atomically claims the booking by setting `reminder_24h_sent_at` to
   `now()`.
2. Looks up the customer's email via the Supabase auth admin API.
3. Sends a reminder email via SendGrid.
4. Appends a `reminder_24h_sent` row to `booking_audit_log`.

On SendGrid failure the claim is rolled back so the next run can retry.

A matching 1-hour reminder path (`reminder_1h_sent_at`) is scaffolded but
not yet enabled — it's the obvious next increment once the 24h path is
proving stable.

## Deploy

```bash
supabase functions deploy booking-reminders
```

## Schedule

Suggested cadence: every 15 minutes. Supabase dashboard → Database →
Cron Jobs, or via SQL:

```sql
select cron.schedule(
  'booking-reminders-15m',
  '*/15 * * * *',        -- every 15 minutes
  $$
    select net.http_post(
      url := current_setting('app.functions_url') || '/booking-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);
```

## Environment

The function reads:

- `SUPABASE_URL` — auto-injected
- `SUPABASE_SERVICE_ROLE_KEY` — auto-injected
- `SENDGRID_API_KEY` — **must be set** (function logs and skips otherwise)
- `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` — optional, with defaults
- `NEXT_PUBLIC_APP_URL` — used for booking deep links in email bodies

## Local test

```bash
supabase functions serve booking-reminders --env-file supabase/.env.local
curl http://localhost:54321/functions/v1/booking-reminders \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Response:

```json
{
  "ran_at": "2026-04-19T00:00:00.000Z",
  "sent": 3,
  "skipped": 0,
  "failures_count": 0,
  "failures": []
}
```

## Follow-ups

- Wire the 1h-before path (reuse the same structure, narrower window).
- Once SMS is live, duplicate the send loop through `sendSms` for users
  who opted in to SMS reminders.
- Consider SELECT … FOR UPDATE SKIP LOCKED if concurrency across regions
  grows — the current timestamp-claim is adequate for MVP volume.
