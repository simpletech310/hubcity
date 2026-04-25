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

export const muxAudioStreamUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}.m4a`;

export const muxAudioHlsUrl = (playbackId: string) =>
  `https://stream.mux.com/${playbackId}.m3u8`;
