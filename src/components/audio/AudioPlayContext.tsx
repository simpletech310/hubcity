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
  /** Optional album/show context for back-navigation. */
  context?: { kind: "album" | "podcast"; slug: string; title: string } | null;
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
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const _registerAudio = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
  }, []);

  const _onTimeUpdate = useCallback((currentTime: number, duration: number) => {
    setState((s) => ({ ...s, position: currentTime, duration: duration || s.duration }));
  }, []);

  const _onPlayState = useCallback((playing: boolean) => {
    setState((s) => ({ ...s, isPlaying: playing }));
  }, []);

  const playInternal = useCallback((item: PlayableItem, queue: PlayableItem[], index: number) => {
    // Drive the <audio> element imperatively *inside* the same call
    // stack as the click handler. Mobile Safari rejects play() if it
    // happens after the user-gesture window closes (microtask, await,
    // setTimeout). Setting src + calling play() synchronously keeps the
    // gesture eligibility intact.
    const a = audioRef.current;
    if (a) {
      const src = muxAudioStreamUrl(item.muxPlaybackId);
      if (a.src !== src) {
        a.src = src;
        a.load();
      }
      try {
        a.currentTime = 0;
      } catch {
        /* ignore */
      }
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
    setState((s) => ({
      ...s,
      current: item,
      queue,
      index,
      position: 0,
      duration: item.durationSeconds ?? s.duration,
    }));
  }, []);

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

  const advance = useCallback((direction: 1 | -1) => {
    // Read current state imperatively to avoid stale closures inside
    // setState — we need the new item *before* we touch the audio
    // element so the play() call stays inside the user gesture.
    setState((s) => {
      const nextIdx = s.index + direction;
      if (nextIdx < 0 || nextIdx >= s.queue.length) return s;
      const item = s.queue[nextIdx];
      const a = audioRef.current;
      if (a) {
        const src = muxAudioStreamUrl(item.muxPlaybackId);
        if (a.src !== src) {
          a.src = src;
          a.load();
        }
        try {
          a.currentTime = 0;
        } catch {
          /* ignore */
        }
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
      return {
        ...s,
        current: item,
        index: nextIdx,
        position: 0,
        duration: item.durationSeconds ?? s.duration,
      };
    });
  }, []);

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
    next();
  }, [next]);

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
    setState({
      current: null,
      queue: [],
      index: -1,
      isPlaying: false,
      position: 0,
      duration: 0,
      expanded: false,
    });
  }, []);

  const setExpanded = useCallback((open: boolean) => {
    setState((s) => ({ ...s, expanded: open }));
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
      _registerAudio,
      _onTimeUpdate,
      _onPlayState,
      _onEnded,
    }),
    [state, play, pause, resume, toggle, next, previous, seek, stop, setExpanded, _registerAudio, _onTimeUpdate, _onPlayState, _onEnded]
  );

  return <AudioPlayCtx.Provider value={value}>{children}</AudioPlayCtx.Provider>;
}

export function useAudioPlay() {
  const ctx = useContext(AudioPlayCtx);
  if (!ctx) throw new Error("useAudioPlay must be used inside <AudioPlayProvider>");
  return ctx;
}
