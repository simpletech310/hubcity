/**
 * Demo / seed audio asset for the FREQUENCY hub.
 * Every demo album track and podcast episode references this single
 * Mux audio asset so listeners can actually hear audio everywhere
 * during the demo phase. Replace with per-track playback IDs once
 * creators upload real content.
 */
export const FREQUENCY_SEED = {
  asset_id: "6oiu6KqRc02Vzf01atPwwAvDUFNMQ7vgW9h79a02R35hUM",
  playback_id: "ZdRWJFV5IB02aoBhdXIniuB4GIvKkR9ybA6R00xDkHRC4",
  duration_seconds: 186,
} as const;

/**
 * Mux audio playback URL.
 *
 * - iOS / iPadOS Safari: serve the HLS playlist directly. Safari has native
 *   HLS support, and the static-rendition `audio.m4a` URL has been flaky on
 *   iOS after a `<audio>.src` swap (the second play() never starts even
 *   though the gesture chain looks intact). HLS streams keep playing across
 *   src swaps reliably.
 * - Everywhere else: use the static-rendition `audio.m4a`. iOS-style HLS
 *   doesn't play natively in `<audio>` on Chrome/Firefox/Android without
 *   hls.js, but the m4a URL plays everywhere out of the box.
 */
export const muxAudioStreamUrl = (playbackId: string) => {
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent;
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua) ||
      (/Macintosh/.test(ua) && "ontouchend" in document); // iPadOS reports as Mac
    if (isAppleMobile) {
      return `https://stream.mux.com/${playbackId}.m3u8`;
    }
  }
  return `https://stream.mux.com/${playbackId}/audio.m4a`;
};

/** HLS fallback (Safari only without hls.js). */
export const muxAudioHlsUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}.m3u8`;

/**
 * Coerce any Mux-served audio URL to the platform-friendly form. The DB
 * stores ad creatives as `audio.m4a`; on iOS we want `.m3u8` instead so
 * the swap from ad → content stays inside the gesture-unlocked HLS state.
 */
export function resolveMuxAudioUrl(url: string): string {
  if (typeof navigator === "undefined") return url;
  const ua = navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
  if (!isAppleMobile) return url;
  // m4a → m3u8: drop the `/audio.m4a` suffix, append `.m3u8`.
  const m = /^(https:\/\/stream\.mux\.com\/[^./?]+)\/audio\.m4a$/.exec(url);
  if (m) return `${m[1]}.m3u8`;
  return url;
}
