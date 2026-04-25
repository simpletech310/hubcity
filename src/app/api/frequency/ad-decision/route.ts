import { NextResponse } from "next/server";
import { getAdDecision, isValidAdZone } from "@/lib/kevel";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a single audio ad decision for the FREQUENCY player.
 *
 * - Subscribers to the content's channel (channel_subscriptions.status='active')
 *   never get ads — return { ad: null }.
 * - Otherwise, ask Kevel (or fall back to local DB) for a decision in the
 *   requested zone. Skip if no audio_url is attached.
 *
 * Query: zone=podcast_preroll | podcast_midroll
 *        item_id=<track or episode id>   (optional, for keyword targeting)
 *        channel_id=<channel uuid>       (optional, used for sub gate)
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const zone = url.searchParams.get("zone") ?? "podcast_preroll";
  const itemId = url.searchParams.get("item_id") ?? undefined;
  const channelId = url.searchParams.get("channel_id") ?? undefined;

  if (!isValidAdZone(zone)) {
    return NextResponse.json({ ad: null, reason: "invalid_zone" });
  }

  // Subscriber gate — paid subs to the content's channel never see ads.
  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
    if (user && channelId) {
      const { data: sub } = await supabase
        .from("channel_subscriptions")
        .select("status")
        .eq("subscriber_id", user.id)
        .eq("channel_id", channelId)
        .eq("status", "active")
        .maybeSingle();
      if (sub) {
        return NextResponse.json({ ad: null, reason: "subscriber" });
      }
    }
  } catch {
    /* ignore — un-auth listeners proceed to ad */
  }

  const decision = await getAdDecision({
    zone,
    userId,
    contentId: itemId,
  });

  if (!decision || !decision.audioUrl) {
    return NextResponse.json({ ad: null, reason: "no_fill" });
  }

  return NextResponse.json({
    ad: {
      audio_url: decision.audioUrl,
      duration: decision.duration ?? 15,
      title: decision.title ?? "Sponsored",
      body: decision.ctaText ?? "",
      click_url: decision.clickUrl ?? null,
      impression_url: decision.impressionUrl ?? null,
      creative_id: decision.creativeId || null,
      campaign_id: decision.campaignId || null,
      advertiser_id: decision.advertiserId || null,
      ad_id: decision.adId || null,
      skippable_after: 5,
    },
  });
}
