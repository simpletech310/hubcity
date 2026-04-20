/**
 * Server-side loader for the per-city history timeline. Replaces the
 * hardcoded `compton-history.ts` file with a DB query keyed by city.
 *
 * The matching table is `public.city_history` (see migration 076).
 */

import { createClient } from "@/lib/supabase/server";

export type HistoryCategory =
  | "founding"
  | "civil_rights"
  | "music"
  | "sports"
  | "politics"
  | "renaissance"
  | "culture"
  | "industry";

export interface HistoryEntry {
  id: string;
  year: string;
  sortYear: number;
  title: string;
  description: string;
  color: string | null;
  category: HistoryCategory;
}

export async function loadCityHistory(
  cityId: string | null
): Promise<HistoryEntry[]> {
  if (!cityId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("city_history")
    .select("id, year, sort_year, title, description, color, category")
    .eq("city_id", cityId)
    .order("sort_year", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id as string,
    year: row.year as string,
    sortYear: row.sort_year as number,
    title: row.title as string,
    description: row.description as string,
    color: (row.color as string | null) ?? null,
    category: row.category as HistoryCategory,
  }));
}
