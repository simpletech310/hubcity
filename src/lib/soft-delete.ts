import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Soft-delete + restore helper. Adds `deleted_at` instead of doing a
 * hard `DELETE` so the user can restore from /dashboard/trash.
 *
 * Schema is opt-in (migration 113) — only the listed tables have the
 * `deleted_at` column. Existing hard-DELETE handlers continue to work;
 * migrate them to call `softDelete()` over time.
 */
export const SOFT_DELETE_TABLES = [
  "posts",
  "events",
  "albums",
  "tracks",
  "community_groups",
  "reels",
  "group_posts",
] as const;

export type SoftDeletableTable = (typeof SOFT_DELETE_TABLES)[number];

/** Per-table column that identifies the row's owner. */
export const OWNER_COLUMN: Record<SoftDeletableTable, string> = {
  posts: "author_id",
  events: "created_by",
  albums: "creator_id",
  tracks: "creator_id",
  community_groups: "created_by",
  reels: "author_id",
  group_posts: "author_id",
};

/** Friendly labels for the trash UI. */
export const TABLE_LABEL: Record<SoftDeletableTable, string> = {
  posts: "Post",
  events: "Event",
  albums: "Album",
  tracks: "Track",
  community_groups: "Group",
  reels: "Reel",
  group_posts: "Group post",
};

export async function softDelete(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function restoreSoftDeleted(
  supabase: SupabaseClient,
  table: SoftDeletableTable,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
