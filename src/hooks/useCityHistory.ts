"use client";

/**
 * Client-side hook for the per-city history timeline. Backed by an SWR
 * fetch against /api/cities/[slug]/history. Used by client components that
 * cannot consume the server loader directly (e.g. interactive timeline UIs).
 */

import useSWR from "swr";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { HistoryEntry } from "@/lib/city-history";

const fetcher = async (url: string): Promise<HistoryEntry[]> => {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.history) ? data.history : [];
};

export function useCityHistory(slugOverride?: string | null) {
  const active = useActiveCity();
  const slug = slugOverride ?? active?.slug ?? null;
  const { data, error, isLoading } = useSWR<HistoryEntry[]>(
    slug ? `/api/cities/${slug}/history` : null,
    fetcher
  );

  return {
    history: data ?? [],
    isLoading,
    error: error ?? null,
  };
}
