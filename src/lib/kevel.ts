/**
 * Kevel Ad Server Integration
 *
 * Kevel (formerly Adzerk) Decision API for serving ads across Hub City
 * Network ID, Site ID, and Zone IDs are configured via env vars
 *
 * Zones:
 * - podcast_preroll: 15-30s audio ad before podcast episodes
 * - podcast_midroll: 15-30s audio ad during podcast episodes
 * - video_preroll: 15-30s video ad before on-demand videos
 * - live_overlay: banner overlay during live streams
 * - feed_banner: native ad cards in Pulse feed
 * - event_banner: sponsored banner on event pages
 */

const KEVEL_NETWORK_ID = process.env.KEVEL_NETWORK_ID;
const KEVEL_SITE_ID = process.env.KEVEL_SITE_ID;
const KEVEL_API_KEY = process.env.KEVEL_API_KEY;
const KEVEL_DECISION_URL = "https://e-1.adzerk.net/api/v2";

// Zone ID mapping - configure these in Kevel dashboard
export type AdZone = "podcast_preroll" | "podcast_midroll" | "video_preroll" | "live_overlay" | "feed_banner" | "event_banner";

const VALID_ZONES = new Set<string>([
  "podcast_preroll", "podcast_midroll", "video_preroll",
  "live_overlay", "feed_banner", "event_banner",
]);

export function isValidAdZone(zone: string): zone is AdZone {
  return VALID_ZONES.has(zone);
}

const ZONE_MAP: Record<string, number> = {
  podcast_preroll: parseInt(process.env.KEVEL_ZONE_PODCAST_PREROLL || "0"),
  podcast_midroll: parseInt(process.env.KEVEL_ZONE_PODCAST_MIDROLL || "0"),
  video_preroll: parseInt(process.env.KEVEL_ZONE_VIDEO_PREROLL || "0"),
  live_overlay: parseInt(process.env.KEVEL_ZONE_LIVE_OVERLAY || "0"),
  feed_banner: parseInt(process.env.KEVEL_ZONE_FEED_BANNER || "0"),
  event_banner: parseInt(process.env.KEVEL_ZONE_EVENT_BANNER || "0"),
};

export interface KevelDecision {
  adId: number;
  creativeId: number;
  flightId: number;
  campaignId: number;
  advertiserId: number;
  clickUrl: string;
  impressionUrl: string;
  contents: Array<{
    type: string;
    body: string;
    data: Record<string, unknown>;
    customData?: string;
  }>;
  // Extracted for easy use
  title?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  ctaText?: string;
  duration?: number;
}

export interface AdDecisionRequest {
  zone: string;
  userId?: string;
  keywords?: string[];
  district?: number;
  contentId?: string;
}

/**
 * Request an ad decision from Kevel for a specific zone
 * Falls back to local DB if Kevel is not configured
 */
export async function getAdDecision(
  req: AdDecisionRequest
): Promise<KevelDecision | null> {
  // If Kevel is configured, use their Decision API
  if (KEVEL_NETWORK_ID && KEVEL_SITE_ID && ZONE_MAP[req.zone]) {
    return getKevelDecision(req);
  }

  // Fallback: serve ads from local DB
  return getLocalAdDecision(req);
}

async function getKevelDecision(
  req: AdDecisionRequest
): Promise<KevelDecision | null> {
  try {
    const zoneId = ZONE_MAP[req.zone];
    if (!zoneId) return null;

    const body = {
      placements: [
        {
          divName: `hubcity-${req.zone}`,
          networkId: parseInt(KEVEL_NETWORK_ID!),
          siteId: parseInt(KEVEL_SITE_ID!),
          adTypes: [getAdTypeForZone(req.zone)],
          zoneIds: [zoneId],
          properties: {
            district: req.district,
            contentId: req.contentId,
          },
          eventIds: [17, 20], // impression + viewable
        },
      ],
      user: req.userId ? { key: req.userId } : undefined,
      keywords: req.keywords || [],
    };

    const res = await fetch(KEVEL_DECISION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(KEVEL_API_KEY ? { "X-Adzerk-ApiKey": KEVEL_API_KEY } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const decision = data.decisions?.[`hubcity-${req.zone}`];

    if (!decision || decision.length === 0) return null;

    const d = decision[0];
    const customData = d.contents?.[0]?.customData
      ? JSON.parse(d.contents[0].customData)
      : {};

    return {
      adId: d.adId,
      creativeId: d.creativeId,
      flightId: d.flightId,
      campaignId: d.campaignId,
      advertiserId: d.advertiserId,
      clickUrl: d.clickUrl,
      impressionUrl: d.impressionUrl,
      contents: d.contents || [],
      title: customData.title,
      imageUrl: customData.imageUrl || d.contents?.[0]?.data?.imageUrl,
      videoUrl: customData.videoUrl,
      audioUrl: customData.audioUrl,
      ctaText: customData.ctaText || "Learn More",
      duration: customData.duration,
    };
  } catch (error) {
    console.error("Kevel ad decision error:", error);
    return null;
  }
}

/**
 * Local fallback ad serving from the database
 * Used when Kevel is not configured (dev, testing, or self-hosted mode)
 */
async function getLocalAdDecision(
  req: AdDecisionRequest
): Promise<KevelDecision | null> {
  try {
    // Dynamic import to avoid circular deps
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const adTypeMap: Record<string, string[]> = {
      podcast_preroll: ["audio_spot", "pre_roll"],
      podcast_midroll: ["audio_spot", "mid_roll"],
      video_preroll: ["pre_roll"],
      live_overlay: ["overlay", "banner"],
      feed_banner: ["banner"],
      event_banner: ["banner"],
    };

    const types = adTypeMap[req.zone] || ["banner"];

    const { data: creatives } = await supabase
      .from("ad_creatives")
      .select("*, campaign:ad_campaigns!inner(*)")
      .in("ad_type", types)
      .filter("campaign.status", "eq", "active")
      .limit(5);

    if (!creatives || creatives.length === 0) return null;

    // Simple random selection (Kevel handles this with optimization)
    const creative = creatives[Math.floor(Math.random() * creatives.length)];

    return {
      adId: 0,
      creativeId: 0,
      flightId: 0,
      campaignId: 0,
      advertiserId: 0,
      clickUrl: creative.click_url,
      impressionUrl: "",
      contents: [],
      title: creative.title,
      imageUrl: creative.image_url,
      videoUrl: creative.video_url,
      audioUrl: creative.audio_url,
      ctaText: creative.body || "Learn More",
      duration: creative.duration_seconds,
    };
  } catch {
    return null;
  }
}

function getAdTypeForZone(zone: string): number {
  // Kevel ad type IDs (configured in dashboard)
  const map: Record<string, number> = {
    podcast_preroll: 5, // audio
    podcast_midroll: 5,
    video_preroll: 4, // video
    live_overlay: 3, // image
    feed_banner: 3,
    event_banner: 3,
  };
  return map[zone] || 3;
}

/**
 * Record an ad impression (fire-and-forget)
 */
export async function recordImpression(params: {
  creativeId?: string;
  campaignId?: string;
  userId?: string;
  zone: string;
  contentId?: string;
  impressionUrl?: string;
}): Promise<void> {
  try {
    // Fire Kevel impression pixel if available
    if (params.impressionUrl) {
      fetch(params.impressionUrl).catch(() => {});
    }

    // Also log locally
    if (params.creativeId && params.campaignId) {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      await supabase.from("ad_impressions").insert({
        creative_id: params.creativeId,
        campaign_id: params.campaignId,
        user_id: params.userId || null,
        zone: params.zone,
        content_id: params.contentId || null,
      });
    }
  } catch {
    // Fire and forget
  }
}

/**
 * Record an ad click
 */
export async function recordClick(impressionId: string): Promise<void> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    await supabase
      .from("ad_impressions")
      .update({ clicked: true, clicked_at: new Date().toISOString() })
      .eq("id", impressionId);
  } catch {
    // Fire and forget
  }
}
