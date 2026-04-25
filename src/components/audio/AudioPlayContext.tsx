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
    setState((s) => ({
      ...s,
      current: item,
      queue,
      index,
      position: 0,
      duration: item.durationSeconds ?? s.duration,
    }));
    // Defer to next microtask so the <audio src> swap has applied.
    queueMicrotask(() => {
      const a = audioRef.current;
      if (!a) return;
      try {
        a.currentTime = 0;
        // Some browsers require a user gesture before play(); we let
        // the play promise reject silently and surface the "isPlaying"
        // state from the audio element's events.
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {
        /* ignore */
      }
    });
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

  const next = useCallback(() => {
    setState((s) => {
      if (s.index < 0 || s.index + 1 >= s.queue.length) return s;
      const item = s.queue[s.index + 1];
      queueMicrotask(() => {
        const a = audioRef.current;
        if (!a) return;
        try {
          a.currentTime = 0;
          const p = a.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {
          /* ignore */
        }
      });
      return { ...s, current: item, index: s.index + 1, position: 0, duration: item.durationSeconds ?? s.duration };
    });
  }, []);

  const previous = useCallback(() => {
    setState((s) => {
      if (s.index <= 0) return s;
      const item = s.queue[s.index - 1];
      queueMicrotask(() => {
        const a = audioRef.current;
        if (!a) return;
        try {
          a.currentTime = 0;
          const p = a.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {
          /* ignore */
        }
      });
      return { ...s, current: item, index: s.index - 1, position: 0, duration: item.durationSeconds ?? s.duration };
    });
  }, []);

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
      setExpanded,
      _registerAudio,
      _onTimeUpdate,
      _onPlayState,
      _onEnded,
    }),
    [state, play, pause, resume, toggle, next, previous, seek, setExpanded, _registerAudio, _onTimeUpdate, _onPlayState, _onEnded]
  );

  return <AudioPlayCtx.Provider value={value}>{children}</AudioPlayCtx.Provider>;
}

export function useAudioPlay() {
  const ctx = useContext(AudioPlayCtx);
  if (!ctx) throw new Error("useAudioPlay must be used inside <AudioPlayProvider>");
  return ctx;
}
