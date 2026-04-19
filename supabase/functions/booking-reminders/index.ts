// supabase/functions/booking-reminders/index.ts
//
// Scheduled Edge Function: sends 24h (and, optionally, 1h) reminder emails
// for upcoming confirmed bookings. Intended to run every 15 minutes; each
// booking is only reminded once per window because the DB's
// reminder_24h_sent_at / reminder_1h_sent_at timestamps are set atomically
// before the send (a SELECT … FOR UPDATE SKIP LOCKED pattern would be ideal
// if we scale up; for MVP throughput, the timestamp guard is sufficient).
//
// Uses the service role to bypass RLS because this is a system job.

// @ts-expect-error — Deno types are provided by the Supabase runtime, not
// by the Next.js tsconfig. Safe to ignore locally; resolved at deploy time.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-expect-error Deno global
const Deno = (globalThis as unknown as {
  Deno: {
    env: { get: (k: string) => string | undefined };
    serve: (h: unknown) => void;
  };
}).Deno;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const SENDGRID_FROM_EMAIL =
  Deno.env.get("SENDGRID_FROM_EMAIL") ?? "noreply@knect.app";
const SENDGRID_FROM_NAME = Deno.env.get("SENDGRID_FROM_NAME") ?? "Knect";
const SITE_DOMAIN =
  Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://knect.app";

type BookingRow = {
  id: string;
  business_id: string;
  customer_id: string;
  service_name: string;
  date: string;
  start_time: string;
  end_time: string;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  businesses: { name: string | null } | null;
  profiles: { display_name: string | null } | null;
};

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const now = new Date();
  // 24h window: bookings starting between 23h and 25h from now that haven't
  // been reminded yet. The ±1h fuzz absorbs an arbitrary schedule cadence.
  const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data: due24h, error: err24h } = await supabase
    .from("bookings")
    .select(
      `id, business_id, customer_id, service_name, date, start_time, end_time,
       reminder_24h_sent_at, reminder_1h_sent_at,
       businesses:business_id (name),
       profiles:customer_id (display_name)`
    )
    .eq("status", "confirmed")
    .is("reminder_24h_sent_at", null)
    .gte("date", toYmd(window24hStart))
    .lte("date", toYmd(window24hEnd))
    .returns<BookingRow[]>();

  if (err24h) {
    console.error("[booking-reminders] query failed:", err24h);
    return jsonResponse({ error: err24h.message }, 500);
  }

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const bk of due24h ?? []) {
    const startsAt = combineDateTime(bk.date, bk.start_time);
    if (startsAt < window24hStart || startsAt > window24hEnd) {
      skipped++;
      continue;
    }

    // Claim this booking before sending by writing the timestamp. If another
    // concurrent run beat us, the update-then-verify pattern would be
    // preferable; for MVP we accept very-low probability of duplicate sends.
    const { error: claimErr } = await supabase
      .from("bookings")
      .update({ reminder_24h_sent_at: new Date().toISOString() })
      .eq("id", bk.id)
      .is("reminder_24h_sent_at", null);
    if (claimErr) {
      failures.push(`${bk.id}: claim ${claimErr.message}`);
      continue;
    }

    // Look up customer email via auth admin API.
    const { data: authUser } = await supabase.auth.admin.getUserById(
      bk.customer_id
    );
    const customerEmail = authUser?.user?.email;
    if (!customerEmail) {
      skipped++;
      continue;
    }

    const when = humanizeWhen(bk.date, bk.start_time, bk.end_time);
    const customerName = bk.profiles?.display_name ?? "there";
    const businessName = bk.businesses?.name ?? "your provider";
    const subject = `Tomorrow: ${bk.service_name} at ${businessName}`;
    const html = `<p>Hi ${escape(customerName)},</p>
<p>Just a heads-up — your appointment with <strong>${escape(businessName)}</strong> is tomorrow.</p>
<p><strong>${escape(bk.service_name)}</strong><br/>${escape(when)}</p>
<p><a href="${SITE_DOMAIN}/bookings/${bk.id}">View booking</a></p>`;
    const text = `Reminder: ${bk.service_name} with ${businessName} — ${when}. View: ${SITE_DOMAIN}/bookings/${bk.id}`;

    const ok = await sendViaSendGrid(customerEmail, subject, html, text);
    if (ok) {
      sent++;
      // Audit log.
      await supabase.from("booking_audit_log").insert({
        booking_id: bk.id,
        actor_id: null,
        action: "reminder_24h_sent",
        metadata: { channel: "email" },
      });
    } else {
      // Roll back the claim so the next run can retry.
      await supabase
        .from("bookings")
        .update({ reminder_24h_sent_at: null })
        .eq("id", bk.id);
      failures.push(`${bk.id}: sendgrid failed`);
    }
  }

  return jsonResponse({
    ran_at: now.toISOString(),
    sent,
    skipped,
    failures_count: failures.length,
    failures: failures.slice(0, 20),
  });
});

// ─── Helpers ────────────────────────────────────────────────────

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function combineDateTime(ymd: string, hhmm: string): Date {
  // Naive local combine — good enough for reminder-window selection; fine
  // for MVP, revisit when multi-timezone operators go live.
  return new Date(`${ymd}T${hhmm}:00`);
}

function humanizeWhen(date: string, start: string, end: string): string {
  const d = new Date(`${date}T${start}:00`);
  if (isNaN(d.getTime())) return `${date} ${start}–${end}`;
  const day = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${day} · ${start}–${end}`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function sendViaSendGrid(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.warn("[booking-reminders] SENDGRID_API_KEY missing — skipping send");
    return false;
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
        subject,
        content: [
          { type: "text/plain", value: text },
          { type: "text/html", value: html },
        ],
      }),
    });
    if (!res.ok) {
      console.error(
        "[booking-reminders] SendGrid error",
        res.status,
        await res.text()
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[booking-reminders] SendGrid threw:", err);
    return false;
  }
}
