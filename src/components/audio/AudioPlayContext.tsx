"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { muxAudioStreamUrl, resolveMuxAudioUrl } from "@/lib/audio/seed";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

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
  /**
   * Page-mount prefetch: stash a pre-roll ad in memory so the next play()
   * can swap to it synchronously inside the user gesture. Critical on iOS,
   * where an async ad fetch between gesture and src-swap breaks playback.
   */
  prefetchAd: (params: { itemId?: string | null; channelId?: string | null }) => void;
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
  // Pre-roll ad warmed up by the page (AlbumDetail / PodcastShowDetail) on
  // mount. iOS requires the src-swap to happen synchronously within the user
  // gesture, so we can't fetch during the tap — we have to know the ad URL
  // before the user clicks play.
  const prefetchedAdRef = useRef<AudioAd | null>(null);
  const prefetchKeyRef = useRef<string | null>(null);

  // Mirror state.queue / state.index in refs so async callbacks (the
  // "fetch the next track when we run off the queue" fallback below)
  // always read the latest values without re-binding.
  const queueRef = useRef<PlayableItem[]>([]);
  const indexRef = useRef<number>(-1);
  // One pre-fetched "next discovery track" stashed during playback so a
  // tap on the next button can swap synchronously inside the user gesture
  // (matches the iOS pre-roll-ad pattern).
  const prefetchedNextRef = useRef<PlayableItem | null>(null);

  // Keep refs synced with state so async callbacks see fresh values.
  useEffect(() => {
    queueRef.current = state.queue;
    indexRef.current = state.index;
  }, [state.queue, state.index]);

  /**
   * Fetch a published Mux audio track from the DB to extend the queue
   * when the listener walks past its end. Excludes anything already in
   * the queue and prefers freshness (newest first), then picks at random
   * within the top 15 to keep things from feeling on-rails. Returns null
   * if nothing's available.
   */
  const fetchDiscoveryTrack = useCallback(
    async (excludeIds: string[]): Promise<PlayableItem | null> => {
      try {
        const supabase = createBrowserClient();
        let q = supabase
          .from("tracks")
          .select(
            "id, title, mux_playback_id, duration_seconds, channel_id, album:albums(slug, title, cover_art_url)",
          )
          .eq("is_published", true)
          .eq("mux_status", "ready")
          .not("mux_playback_id", "is", null);
        if (excludeIds.length > 0) {
          q = q.not("id", "in", `(${excludeIds.join(",")})`);
        }
        const { data } = await q
          .order("created_at", { ascending: false })
          .limit(15);
        if (!data || data.length === 0) return null;
        type Row = {
          id: string;
          title: string;
          mux_playback_id: string;
          duration_seconds: number | null;
          channel_id: string | null;
          album:
            | { slug: string; title: string; cover_art_url: string | null }
            | { slug: string; title: string; cover_art_url: string | null }[]
            | null;
        };
        const rows = data as unknown as Row[];
        const pick = rows[Math.floor(Math.random() * rows.length)];
        const album = Array.isArray(pick.album) ? pick.album[0] : pick.album;
        return {
          id: pick.id,
          kind: "track",
          title: pick.title,
          subtitle: album?.title ?? null,
          coverUrl: album?.cover_art_url ?? null,
          muxPlaybackId: pick.mux_playback_id,
          durationSeconds: pick.duration_seconds,
          channelId: pick.channel_id,
          context: album?.slug
            ? { kind: "album", slug: album.slug, title: album.title }
            : null,
        };
      } catch {
        return null;
      }
    },
    [],
  );

  /**
   * Warm the "next discovery track" cache so a forthcoming tap on the
   * next button can swap synchronously (iOS gesture chain compatibility).
   * Called whenever a track starts playing.
   */
  const prefetchNext = useCallback(() => {
    if (prefetchedNextRef.current) return;
    const exclude = [
      ...queueRef.current.map((q) => q.id),
      ...(prefetchedNextRef.current ? [(prefetchedNextRef.current as PlayableItem).id] : []),
    ];
    void fetchDiscoveryTrack(exclude).then((next) => {
      if (next) prefetchedNextRef.current = next;
    });
  }, [fetchDiscoveryTrack]);

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
    // user-gesture chain intact for iOS. resolveMuxAudioUrl swaps
    // audio.m4a → .m3u8 on iOS so the format matches the content URL and
    // playback stays in the same HLS session.
    const adUrl = resolveMuxAudioUrl(ad.audio_url);
    if (a.src !== adUrl) {
      a.src = adUrl;
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

  const prefetchAd = useCallback(
    (params: { itemId?: string | null; channelId?: string | null }) => {
      if (typeof window === "undefined") return;
      const key = `${params.channelId ?? ""}|${params.itemId ?? ""}`;
      // Don't refetch if we already have an ad warmed up for this context.
      if (prefetchedAdRef.current && prefetchKeyRef.current === key) return;
      if (adInFlightRef.current) return;
      adInFlightRef.current = true;
      const sp = new URLSearchParams({ zone: "podcast_preroll" });
      if (params.itemId) sp.set("item_id", params.itemId);
      if (params.channelId) sp.set("channel_id", params.channelId);
      void fetch(`/api/frequency/ad-decision?${sp.toString()}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { ad: AudioAd | null } | null) => {
          if (data?.ad?.audio_url) {
            prefetchedAdRef.current = data.ad;
            prefetchKeyRef.current = key;
          }
        })
        .catch(() => {})
        .finally(() => {
          adInFlightRef.current = false;
        });
    },
    []
  );

  const playInternal = useCallback(
    (item: PlayableItem, queue: PlayableItem[], index: number) => {
      // FAST PATH: an ad was prefetched (page mount) → drive ad
      // synchronously inside the gesture so iOS lets it play.
      const cached = prefetchedAdRef.current;
      if (cached) {
        prefetchedAdRef.current = null;
        pendingContentRef.current = item;
        modeRef.current = "ad";
        setState((s) => ({
          ...s,
          current: item,
          queue,
          index,
          position: 0,
          duration: cached.duration || s.duration,
          mode: "ad",
          ad: cached,
          expanded: true,
        }));
        driveAd(cached);
        return;
      }

      // SLOW PATH: no cached ad. Start the content immediately (UN-muted)
      // so the listener never gets stuck on a silent player. We still kick
      // off an async ad fetch for next time.
      driveContent(item);
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
        expanded: true,
      }));
      // Warm up the next ad (will be served on next tap / next track).
      prefetchAd({ itemId: item.id, channelId: item.channelId ?? null });
      // Also warm the next discovery track so an immediate skip-forward
      // tap can swap synchronously inside that gesture.
      prefetchNext();
    },
    [driveContent, driveAd, prefetchAd, prefetchNext]
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
        // Warm the next discovery track so the user can keep tapping.
        prefetchNext();
        return;
      }

      // Fell off the queue. Forward → walk into a discovery track.
      // Backward at index 0 → no-op (standard music-player behavior).
      if (direction !== 1) return;

      // FAST PATH: prefetched track ready — drive synchronously inside
      // the user gesture so iOS Safari plays it.
      const prefetched = prefetchedNextRef.current;
      if (prefetched) {
        prefetchedNextRef.current = null;
        setState((s) => ({
          ...s,
          current: prefetched,
          queue: [...s.queue, prefetched],
          index: s.queue.length,
          position: 0,
          duration: prefetched.durationSeconds ?? s.duration,
          mode: "content",
          ad: null,
        }));
        modeRef.current = "content";
        driveContent(prefetched);
        prefetchNext();
        return;
      }

      // SLOW PATH: nothing prefetched. Async-fetch then drive. iOS may
      // not autoplay the swap, but every desktop / Android browser will.
      const exclude = queueRef.current.map((q) => q.id);
      void fetchDiscoveryTrack(exclude).then((fresh) => {
        if (!fresh) return;
        setState((s) => ({
          ...s,
          current: fresh,
          queue: [...s.queue, fresh],
          index: s.queue.length,
          position: 0,
          duration: fresh.durationSeconds ?? s.duration,
          mode: "content",
          ad: null,
        }));
        modeRef.current = "content";
        driveContent(fresh);
        prefetchNext();
      });
    },
    [driveContent, fetchDiscoveryTrack, prefetchNext]
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
      prefetchAd,
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
      prefetchAd,
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
