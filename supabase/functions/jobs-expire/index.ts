// supabase/functions/jobs-expire/index.ts
//
// Nightly Edge Function: deactivates any job_listings whose expires_at has
// passed. Invoked by a Supabase scheduled trigger (cron: "0 9 * * *" UTC).
//
// Uses the service role to bypass RLS, because this is a system job.

// @ts-expect-error — Deno types are provided by the Supabase runtime, not by
// the Next.js tsconfig. Safe to ignore locally; resolved at deploy time.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error Deno global
const Deno = (globalThis as unknown as { Deno: { env: { get: (k: string) => string | undefined }; serve: (h: unknown) => void } }).Deno;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("job_listings")
    .update({ is_active: false })
    .lt("expires_at", nowIso)
    .eq("is_active", true)
    .select("id");

  if (error) {
    console.error("[jobs-expire] update failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const count = data?.length ?? 0;
  console.log(`[jobs-expire] deactivated ${count} expired listings`);

  return new Response(
    JSON.stringify({ deactivated: count, ran_at: nowIso }),
    { headers: { "content-type": "application/json" } }
  );
});
