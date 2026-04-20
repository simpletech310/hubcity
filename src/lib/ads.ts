// ---------------------------------------------------------------------------
// Ad types & shared utilities for Culture ad system
// ---------------------------------------------------------------------------

export interface AdDecision {
  id: string;
  business_name: string;
  headline: string;
  body_text?: string;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  cta_text: string;
  cta_url: string;
  duration: number; // seconds
  impression_url: string;
  click_url: string;
}

/**
 * Fetch an ad decision from the ad server.
 * Returns null if no ad is available.
 */
export async function fetchAd(
  zone: string,
  contentId?: string
): Promise<AdDecision | null> {
  try {
    const params = new URLSearchParams({ zone });
    if (contentId) params.set("contentId", contentId);

    const res = await fetch(`/api/ads/decision?${params.toString()}`);
    if (!res.ok) return null;

    const data = await res.json();
    return (data.ad as AdDecision) ?? null;
  } catch {
    return null;
  }
}

/**
 * Fire an impression or click tracking pixel (Kevel pixel URL).
 * Also records to local DB for analytics.
 */
export function fireTracking(url: string) {
  if (!url) return;
  try {
    // Fire the Kevel tracking pixel
    const img = new Image();
    img.src = url;
  } catch {
    // Tracking failures are silent
  }
}

/**
 * Record an ad impression to the local database for revenue tracking.
 * Call this in addition to fireTracking() for the Kevel pixel.
 */
export function recordImpression(ad: AdDecision, zone: string, contentId?: string) {
  try {
    fetch("/api/ads/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creative_id: ad.id,
        campaign_id: ad.id, // same ID since local ads use creative as campaign
        zone,
        content_id: contentId || null,
      }),
    }).catch(() => {});
  } catch {
    // Fire and forget
  }
}

/**
 * Record an ad click to the local database.
 * Call this when the user clicks the CTA button.
 */
export function recordClick(impressionId: string) {
  try {
    fetch("/api/ads/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ impression_id: impressionId }),
    }).catch(() => {});
  } catch {
    // Fire and forget
  }
}
