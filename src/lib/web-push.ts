/**
 * Web Push dispatch helper. Wraps the `web-push` npm package so callers
 * just hand us a user_id + payload and we fan out to every subscription
 * that user has, honoring `notification_preferences`.
 *
 * Env required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 * Run once in Vercel env: `npx web-push generate-vapid-keys`.
 *
 * NOTE: the `web-push` package needs to be installed:
 *   npm install web-push
 *   npm install --save-dev @types/web-push
 */
import { createAdminClient } from "@/lib/supabase/admin";

type Channel =
  | "follows"
  | "dms"
  | "events"
  | "broadcasts"
  | "ticket";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  tag?: string;
}

export interface DispatchOpts {
  userId: string;
  channel: Channel;
  payload: PushPayload;
}

interface WebPushModule {
  setVapidDetails: (subject: string, pub: string, priv: string) => void;
  sendNotification: (
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
  ) => Promise<unknown>;
}

let configured = false;
async function getWebPush(): Promise<WebPushModule | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (await import("web-push" as any)) as WebPushModule & {
      default?: WebPushModule;
    };
    const wp = (mod.default ?? mod) as WebPushModule;
    if (!configured) {
      const pub = process.env.VAPID_PUBLIC_KEY;
      const priv = process.env.VAPID_PRIVATE_KEY;
      const subject = process.env.VAPID_SUBJECT || "mailto:hello@culture.app";
      if (!pub || !priv) return null;
      wp.setVapidDetails(subject, pub, priv);
      configured = true;
    }
    return wp;
  } catch {
    // Package not installed yet — fail soft so the rest of the app still
    // works (push just no-ops until ops runs `npm install web-push`).
    return null;
  }
}

export async function dispatchPush(opts: DispatchOpts): Promise<void> {
  const wp = await getWebPush();
  if (!wp) return;

  const admin = createAdminClient();

  // Honor per-user channel preference.
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select(
      "follows_push, dms_push, events_push, broadcasts_push, ticket_push",
    )
    .eq("user_id", opts.userId)
    .maybeSingle();
  const flag = `${opts.channel}_push` as const;
  if (prefs && prefs[flag] === false) return;

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys")
    .eq("user_id", opts.userId);

  if (!subs || subs.length === 0) return;

  const body = JSON.stringify(opts.payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await wp.sendNotification(
          {
            endpoint: s.endpoint,
            keys: s.keys as { p256dh: string; auth: string },
          },
          body,
        );
        await admin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", s.id);
      } catch (err: unknown) {
        // 410 / 404 → endpoint expired, prune.
        const status =
          typeof err === "object" && err !== null && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : null;
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("web-push send failed:", err);
        }
      }
    }),
  );
}
