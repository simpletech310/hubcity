-- Migration 090: Schedule event-reminder edge function via pg_cron
--
-- This migration sets up a pg_cron job that fires every 15 minutes and calls
-- the `send-event-reminders` edge function. The function sends:
--   • a "24h" reminder notification to confirmed RSVPs ~24 hours before the event
--   • a "1h"  reminder notification to confirmed RSVPs ~1 hour  before the event
--
-- Deduplication is handled inside the function via the event_reminder_logs table,
-- so running every 15 minutes is safe and idempotent.
--
-- Prerequisites:
--   1. The pg_cron extension must be enabled on this project.
--      (Available on Supabase Pro tier; enable via Dashboard → Database → Extensions)
--   2. The send-event-reminders function must be deployed:
--      supabase functions deploy send-event-reminders --project-ref <ref>
--   3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as function secrets:
--      supabase secrets set SUPABASE_URL=https://<ref>.supabase.co
--      supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
--
-- To verify the cron job after running this migration:
--   SELECT * FROM cron.job WHERE jobname = 'send-event-reminders';

-- Enable pg_cron if available (no-op on Free tier; remove the DO block if you
-- prefer to error loudly when the extension is missing).
do $$
begin
  create extension if not exists pg_cron schema pg_catalog;
exception when others then
  raise notice 'pg_cron extension not available — skipping cron schedule setup. '
    'Enable pg_cron in the Supabase dashboard and re-run this migration.';
end;
$$;

-- Only create the job when pg_cron was successfully enabled
do $$
declare
  v_project_ref text;
  v_url         text;
  v_key         text;
begin
  -- Resolve project ref from the current database URL
  -- Fallback: replace the placeholder with your project ref if this auto-detect fails
  v_project_ref := current_setting('app.settings.supabase_project_ref', true);
  if v_project_ref is null or v_project_ref = '' then
    -- Derive from the service_role JWT iss claim stored as a setting, if available
    v_project_ref := 'fahqtnwwikvocpvvfgqi'; -- Hub City project ref (safe to hardcode)
  end if;

  v_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-event-reminders';
  -- The service role key is read from vault/settings at runtime inside the function
  -- itself; we just need any valid key here to trigger the function.
  -- Using pg_net requires the service_role key — store it in app.settings or vault.
  v_key := current_setting('app.settings.service_role_key', true);

  -- Schedule the job if pg_cron is present and we have a key
  if v_key is not null and v_key <> '' then
    perform cron.schedule(
      'send-event-reminders',          -- job name (idempotent — updates if exists)
      '*/15 * * * *',                  -- every 15 minutes
      format(
        $$select net.http_post(
            url    := %L,
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || %L
            ),
            body   := '{}'::jsonb
          )$$,
        v_url, v_key
      )
    );
    raise notice 'Cron job send-event-reminders scheduled (every 15 min).';
  else
    raise notice 'No service_role_key in app.settings — cron job NOT scheduled. '
      'Set app.settings.service_role_key via Supabase dashboard → Settings → Database → Configuration '
      'and re-run, or schedule manually.';
  end if;

exception when undefined_function then
  raise notice 'pg_cron or net extension not available. Skipping cron setup. '
    'Deploy the function and schedule it manually in the Supabase dashboard.';
end;
$$;
