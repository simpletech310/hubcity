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
 * Direct-download audio URL for Mux audio-only assets. Requires the
 * asset to have a static rendition enabled (POST /assets/:id/static-renditions
 * with resolution: "audio-only"). Mux serves it as `audio.m4a`. This
 * URL plays natively in `<audio>` across Chrome / Safari / Firefox so
 * we don't need hls.js for the standard playback path.
 */
export const muxAudioStreamUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}/audio.m4a`;

/** HLS fallback (Safari only without hls.js). */
export const muxAudioHlsUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}.m3u8`;
