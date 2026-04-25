import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Audio access gate — mirror of `resolveVideoAccess` but for albums and
 * podcast shows. v1 has no per-episode PPV (schema reserves room); access
 * decisions are channel-level via `channel_subscriptions`.
 *
 * - Album with `access_type='free'` → anyone plays.
 * - Album with `access_type='subscribers'` → must hold an active sub on the
 *   album's `channel_id`.
 * - Podcast (no access_type column yet) → free unless `channel_id` is set
 *   AND that channel sells a subscription, in which case subs-only.
 */

export type AudioAccess =
  | { allowed: true; reason: "free" | "owner" | "subscription" | "admin" }
  | {
      allowed: false;
      reason: "auth_required" | "subscription_required";
      channel_id: string;
      subscription_price_cents: number | null;
      currency: string;
    };

interface AlbumGateRow {
  id: string;
  channel_id: string | null;
  access_type: "free" | "subscribers" | "ppv" | null;
}

interface PodcastShowGateRow {
  /** Any one episode's row works — they all carry the show's channel_id. */
  channel_id: string | null;
}

interface ChannelGateRow {
  id: string;
  owner_id: string | null;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
}

async function checkSub(
  supabase: SupabaseClient,
  userId: string,
  channelId: string
): Promise<boolean> {
  const { data: sub } = await supabase
    .from("channel_subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("channel_id", channelId)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (!sub) return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end) > new Date();
}

async function isAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role === "admin" || profile?.role === "city_official";
}

export async function resolveAlbumAccess(
  supabase: SupabaseClient,
  album: AlbumGateRow,
  channel: ChannelGateRow | null,
  userId: string | null
): Promise<AudioAccess> {
  const accessType = album.access_type ?? "free";

  if (accessType === "free") return { allowed: true, reason: "free" };
  if (!channel) return { allowed: true, reason: "free" }; // no channel → free

  if (!userId) {
    return {
      allowed: false,
      reason: "auth_required",
      channel_id: channel.id,
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
    };
  }
  if (channel.owner_id === userId) return { allowed: true, reason: "owner" };
  if (await isAdmin(supabase, userId)) return { allowed: true, reason: "admin" };

  if (accessType === "subscribers" || accessType === "ppv") {
    if (await checkSub(supabase, userId, channel.id)) {
      return { allowed: true, reason: "subscription" };
    }
    return {
      allowed: false,
      reason: "subscription_required",
      channel_id: channel.id,
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
    };
  }

  return { allowed: true, reason: "free" };
}

/**
 * Podcast shows have no `access_type` column (v1). Treat them as
 * subscribers-only when their channel sells a subscription.
 */
export async function resolvePodcastAccess(
  supabase: SupabaseClient,
  show: PodcastShowGateRow,
  channel: ChannelGateRow | null,
  userId: string | null
): Promise<AudioAccess> {
  if (!show.channel_id || !channel) return { allowed: true, reason: "free" };
  // No paid sub price → public.
  if (!channel.subscription_price_cents) return { allowed: true, reason: "free" };

  if (!userId) {
    return {
      allowed: false,
      reason: "auth_required",
      channel_id: channel.id,
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
    };
  }
  if (channel.owner_id === userId) return { allowed: true, reason: "owner" };
  if (await isAdmin(supabase, userId)) return { allowed: true, reason: "admin" };
  if (await checkSub(supabase, userId, channel.id)) {
    return { allowed: true, reason: "subscription" };
  }
  return {
    allowed: false,
    reason: "subscription_required",
    channel_id: channel.id,
    subscription_price_cents: channel.subscription_price_cents,
    currency: channel.subscription_currency ?? "usd",
  };
}
