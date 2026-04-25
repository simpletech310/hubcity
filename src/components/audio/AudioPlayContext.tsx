"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { muxAudioStreamUrl } from "@/lib/audio/seed";

/**
 * A single playable item — track from an album OR podcast episode.
 * Both shapes share the same playable surface so the mini player
 * doesn't care which kind it's playing.
 */
export interface PlayableItem {
  /** Stable id for analytics and "now playing" markers. */
  id: string;
  kind: "track" | "episode";
  /** Display title in mini player. */
  title: string;
  /** Sub-line in mini player (album title, show title, creator). */
  subtitle?: string | null;
  /** Square cover art URL (album cover, show thumbnail). */
  coverUrl?: string | null;
  /** Mux playback id — required to play. */
  muxPlaybackId: string;
  /** Total length in seconds (for scrubber UI). */
  durationSeconds?: number | null;
  /** Channel that owns this content — used for subscriber ad gate. */
  channelId?: string | null;
  /** Optional album/show context for back-navigation. */
  context?: { kind: "album" | "podcast"; slug: string; title: string } | null;
}

/**
 * Audio ad payload as returned by /api/frequency/ad-decision.
 * Wire-shape mirrors the route response; component code reads only
 * `audio_url`, `duration`, `title`, `body`, `click_url`, `skippable_after`.
 */
export interface AudioAd {
  audio_url: string;
  duration: number;
  title: string;
  body: string;
  click_url: string | null;
  impression_url: string | null;
  creative_id: number | string | null;
  campaign_id: number | string | null;
  advertiser_id: number | string | null;
  ad_id: number | string | null;
  skippable_after: number;
}

interface AudioPlayState {
  current: PlayableItem | null;
  queue: PlayableItem[];
  /** Index in `queue` of the currently playing item, or -1 if nothing. */
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  expanded: boolean;
  /** Are we currently rolling an ad before / between content? */
  mode: "content" | "ad";
  /** Ad metadata for the overlay UI; null when mode === 'content'. */
  ad: AudioAd | null;
}

interface AudioPlayApi extends AudioPlayState {
  play: (item: PlayableItem, queue?: PlayableItem[]) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  /** Tear down the current item completely so the mini player unmounts. */
  stop: () => void;
  setExpanded: (open: boolean) => void;
  /** Skip the running ad after `skippable_after` seconds (otherwise no-op). */
  skipAd: () => void;
  /** Open the ad's click-through URL in a new tab and record the click. */
  clickAd: () => void;
  /** Internal: bind a real <audio> element so the API can drive it. */
  _registerAudio: (el: HTMLAudioElement | null) => void;
  /** Internal: report time updates from the bound element. */
  _onTimeUpdate: (currentTime: number, duration: number) => void;
  /** Internal: report play/pause state from the bound element. */
  _onPlayState: (playing: boolean) => void;
  /** Internal: called when current track ends naturally. */
  _onEnded: () => void;
}

const AudioPlayCtx = createContext<AudioPlayApi | null>(null);

export function AudioPlayProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioPlayState>({
    current: null,
    queue: [],
    index: -1,
    isPlaying: false,
    position: 0,
    duration: 0,
    expanded: false,
    mode: "content",
    ad: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Track which content item the ad is preroll-ing for so _onEnded can swap.
  const pendingContentRef = useRef<PlayableItem | null>(null);
  // Avoid stacking ad fetches in flight.
  const adInFlightRef = useRef<boolean>(false);
  // Mirror of `state.mode` for use in _onEnded — reading state inside a
  // setState updater is synchronous in React 18 but can be coalesced under
  // automatic batching, so we keep an explicit ref to be safe.
  const modeRef = useRef<"content" | "ad">("content");

  const _registerAudio = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  const _onTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setState((s) => ({ ...s, position: currentTime, duration: duration || s.duration }));
  }, []);

  const _onPlayState = useCallback((playing: boolean) => {
    setState((s) => ({ ...s, isPlaying: playing }));
  }, []);

  /**
   * Drive the <audio> element straight to the content track.
   * MUST stay synchronous with the user gesture — no awaits before play().
   * `muted` is used as a "warm" flag during pre-roll fetch — we play silently
   * to consume the gesture, then unmute once the ad / content is committed.
   */
  const driveContent = useCallback((item: PlayableItem, opts?: { muted?: boolean }) => {
    const a = audioRef.current;
    if (!a) return;
    const src = muxAudioStreamUrl(item.muxPlaybackId);
    // Don't call load() after assigning src — that resets the element and
    // breaks the iOS Safari user-gesture chain that the original play() set
    // up. Just assign src and call play(); the element handles loading.
    if (a.src !== src) {
      a.src = src;
    }
    try {
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
    a.muted = !!opts?.muted;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  /**
   * Drive the <audio> element to an ad. Used after a user-gesture-initiated
   * play() chain, so this still needs to be reachable from the original
   * gesture for mobile autoplay rules.
   */
  const driveAd = useCallback((ad: AudioAd) => {
    const a = audioRef.current;
    if (!a) return;
    // Same as driveContent: skip load() so the assignment-only swap keeps the
    // user-gesture chain intact for iOS.
    if (a.src !== ad.audio_url) {
      a.src = ad.audio_url;
    }
    try {
      a.currentTime = 0;
    } catch {
      /* ignore */
    }
    a.muted = false;
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});

    // Fire impression best-effort.
    if (ad.impression_url) {
      fetch(ad.impression_url).catch(() => {});
    }
  }, []);

  /**
   * Fetch a pre-roll ad for the given item and either swap to the ad
   * (mode='ad', stash content as pending) or fall through to content.
   * Runs after the user-gesture-driven content `play()` already started —
   * we cancel the content via the swap, which is fine on desktop. For
   * mobile this still works because the audio element is already "unlocked"
   * by the prior synchronous play().
   */
  const tryPreRoll = useCallback(
    async (item: PlayableItem): Promise<boolean> => {
      if (adInFlightRef.current) return false;
      adInFlightRef.current = true;
      try {
        const params = new URLSearchParams({
          zone: "podcast_preroll",
          item_id: item.id,
        });
        if (item.channelId) params.set("channel_id", item.channelId);
        const r = await fetch(`/api/frequency/ad-decision?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) return false;
        const data = (await r.json()) as { ad: AudioAd | null };
        const ad = data.ad;
        if (!ad || !ad.audio_url) return false;

        // Listener may have already navigated away or hit Stop while we
        // were fetching — bail in that case.
        if (!audioRef.current) return false;

        pendingContentRef.current = item;
        modeRef.current = "ad";
        setState((s) => ({
          ...s,
          mode: "ad",
          ad,
          position: 0,
          duration: ad.duration || s.duration,
        }));
        driveAd(ad);
        return true;
      } catch {
        return false;
      } finally {
        adInFlightRef.current = false;
      }
    },
    [driveAd]
  );

  const playInternal = useCallback(
    (item: PlayableItem, queue: PlayableItem[], index: number) => {
      // 1. Start content MUTED so the gesture is consumed and the audio
      //    element is unlocked for any later imperative src swap (ad).
      //    User hears nothing during the ~50–300ms ad-decision fetch.
      driveContent(item, { muted: true });
      pendingContentRef.current = null;
      modeRef.current = "content";
      setState((s) => ({
        ...s,
        current: item,
        queue,
        index,
        position: 0,
        duration: item.durationSeconds ?? s.duration,
        mode: "content",
        ad: null,
        // Auto-open the full-screen player on the first tap. The user
        // can collapse it (mini bar persists) or fully Stop ✕.
        expanded: true,
      }));
      // 2. Race the ad-decision; on a fill swap to ad, otherwise unmute
      //    content.
      void tryPreRoll(item).then((adServed) => {
        if (!adServed) {
          // No ad fill — unmute the content that's already playing.
          const a = audioRef.current;
          if (a) a.muted = false;
        }
      });
    },
    [driveContent, tryPreRoll]
  );

  const play = useCallback(
    (item: PlayableItem, queue?: PlayableItem[]) => {
      const q = queue && queue.length ? queue : [item];
      const idx = Math.max(0, q.findIndex((x) => x.id === item.id));
      playInternal(item, q, idx);
    },
    [playInternal]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    const p = audioRef.current?.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } else {
      a.pause();
    }
  }, []);

  const advance = useCallback(
    (direction: 1 | -1) => {
      // Read current state imperatively to avoid stale closures inside
      // setState — we need the new item *before* we touch the audio
      // element so the play() call stays inside the user gesture.
      let nextItem: PlayableItem | null = null;
      let nextIdx = -1;
      setState((s) => {
        const idx = s.index + direction;
        if (idx < 0 || idx >= s.queue.length) return s;
        nextIdx = idx;
        nextItem = s.queue[idx];
        return {
          ...s,
          current: s.queue[idx],
          index: idx,
          position: 0,
          duration: s.queue[idx].durationSeconds ?? s.duration,
          mode: "content",
          ad: null,
        };
      });
      if (nextItem && nextIdx >= 0) {
        modeRef.current = "content";
        driveContent(nextItem);
        // No pre-roll on manual prev/next — feels punitive.
      }
    },
    [driveContent]
  );

  const next = useCallback(() => advance(1), [advance]);
  const previous = useCallback(() => advance(-1), [advance]);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    try {
      a.currentTime = Math.max(0, seconds);
    } catch {
      /* ignore */
    }
  }, []);

  const _onEnded = useCallback(() => {
    // When an ad finishes, swap into the queued content.
    if (modeRef.current === "ad") {
      const pending = pendingContentRef.current;
      pendingContentRef.current = null;
      modeRef.current = "content";
      setState((s) => ({
        ...s,
        mode: "content",
        ad: null,
        position: 0,
        duration: pending?.durationSeconds ?? s.duration,
      }));
      if (pending) driveContent(pending);
      return;
    }
    // Otherwise, advance to next track.
    next();
  }, [driveContent, next]);

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      try {
        a.pause();
        a.removeAttribute("src");
        a.load();
      } catch {
        /* ignore */
      }
    }
    pendingContentRef.current = null;
    modeRef.current = "content";
    setState({
      current: null,
      queue: [],
      index: -1,
      isPlaying: false,
      position: 0,
      duration: 0,
      expanded: false,
      mode: "content",
      ad: null,
    });
  }, []);

  const setExpanded = useCallback((open: boolean) => {
    setState((s) => ({ ...s, expanded: open }));
  }, []);

  const skipAd = useCallback(() => {
    // Force-end the ad: if we have pending content, swap to it.
    if (modeRef.current !== "ad") return;
    const pending = pendingContentRef.current;
    pendingContentRef.current = null;
    modeRef.current = "content";
    setState((s) => ({
      ...s,
      mode: "content",
      ad: null,
      position: 0,
      duration: pending?.durationSeconds ?? s.duration,
    }));
    if (pending) driveContent(pending);
  }, [driveContent]);

  const clickAd = useCallback(() => {
    setState((s) => {
      if (s.ad?.click_url && typeof window !== "undefined") {
        window.open(s.ad.click_url, "_blank", "noopener,noreferrer");
      }
      return s;
    });
  }, []);

  const value = useMemo<AudioPlayApi>(
    () => ({
      ...state,
      play,
      pause,
      resume,
      toggle,
      next,
      previous,
      seek,
      stop,
      setExpanded,
      skipAd,
      clickAd,
      _registerAudio,
      _onTimeUpdate,
      _onPlayState,
      _onEnded,
    }),
    [
      state,
      play,
      pause,
      resume,
      toggle,
      next,
      previous,
      seek,
      stop,
      setExpanded,
      skipAd,
      clickAd,
      _registerAudio,
      _onTimeUpdate,
      _onPlayState,
      _onEnded,
    ]
  );

  return <AudioPlayCtx.Provider value={value}>{children}</AudioPlayCtx.Provider>;
}

export function useAudioPlay() {
  const ctx = useContext(AudioPlayCtx);
  if (!ctx) throw new Error("useAudioPlay must be used inside <AudioPlayProvider>");
  return ctx;
}
