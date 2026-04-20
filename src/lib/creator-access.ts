import type { SupabaseClient } from "@supabase/supabase-js";

// Platform takes 10% of subscription / PPV gross.
// Single source of truth — overridable via env so finance can dial it in
// without a code deploy.
export const CREATOR_PLATFORM_FEE_PERCENT = Number(
  process.env.STRIPE_CREATOR_PLATFORM_FEE_PERCENT || "10"
);

export function calculateCreatorPlatformFee(amountCents: number): number {
  return Math.round(amountCents * (CREATOR_PLATFORM_FEE_PERCENT / 100));
}

export type AccessDecision =
  | { allowed: true; reason: "free" | "owner" | "subscription" | "ppv" | "admin" }
  | {
      allowed: false;
      reason: "auth_required" | "subscription_required" | "ppv_required";
      ppv_price_cents?: number | null;
      subscription_price_cents?: number | null;
      currency?: string;
      channel_id?: string;
    };

interface VideoAccessRow {
  id: string;
  channel_id: string;
  access_type: "free" | "subscribers" | "ppv" | null;
  is_premium: boolean | null;
  price_cents: number | null;
}

interface ChannelAccessRow {
  id: string;
  owner_id: string | null;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
}

/**
 * Resolve whether `userId` is allowed to play `video`.
 * Caller is expected to have already loaded the video + its channel; we keep
 * the function pure so it's trivial to unit test and to use anywhere a
 * playback decision is needed (player gate, list filtering, server pages).
 */
export async function resolveVideoAccess(
  supabase: SupabaseClient,
  video: VideoAccessRow,
  channel: ChannelAccessRow,
  userId: string | null
): Promise<AccessDecision> {
  const accessType = video.access_type ?? (video.is_premium ? "ppv" : "free");

  // Free always wins.
  if (accessType === "free") {
    return { allowed: true, reason: "free" };
  }

  // Anonymous viewers can never see paid content.
  if (!userId) {
    return {
      allowed: false,
      reason: "auth_required",
      ppv_price_cents: video.price_cents,
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
      channel_id: channel.id,
    };
  }

  // The creator who owns the channel always has access to their own work.
  if (channel.owner_id && channel.owner_id === userId) {
    return { allowed: true, reason: "owner" };
  }

  // Admins / city officials get a free pass for moderation purposes.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role === "admin" || profile?.role === "city_official") {
    return { allowed: true, reason: "admin" };
  }

  // Subscriber-gated: any active sub to the channel unlocks the video.
  if (accessType === "subscribers") {
    const { data: sub } = await supabase
      .from("channel_subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("channel_id", channel.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    const isLive =
      sub &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

    if (isLive) {
      return { allowed: true, reason: "subscription" };
    }

    return {
      allowed: false,
      reason: "subscription_required",
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
      channel_id: channel.id,
    };
  }

  // PPV: subscribers also unlocks (best-of-both-worlds), else require purchase.
  if (accessType === "ppv") {
    // Honour an active channel sub if present.
    const { data: sub } = await supabase
      .from("channel_subscriptions")
      .select("status")
      .eq("user_id", userId)
      .eq("channel_id", channel.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    if (sub) return { allowed: true, reason: "subscription" };

    const { data: purchase } = await supabase
      .from("video_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("video_id", video.id)
      .maybeSingle();
    if (purchase) return { allowed: true, reason: "ppv" };

    return {
      allowed: false,
      reason: "ppv_required",
      ppv_price_cents: video.price_cents,
      subscription_price_cents: channel.subscription_price_cents,
      currency: channel.subscription_currency ?? "usd",
      channel_id: channel.id,
    };
  }

  // Should be unreachable because access_type is constrained.
  return { allowed: true, reason: "free" };
}
