import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SOFT_DELETE_TABLES,
  OWNER_COLUMN,
  TABLE_LABEL,
  type SoftDeletableTable,
} from "@/lib/soft-delete";
import RestoreButton from "./RestoreButton";

interface TrashRow {
  table: SoftDeletableTable;
  id: string;
  title: string;
  deleted_at: string;
}

const TITLE_FIELDS: Record<SoftDeletableTable, string> = {
  posts: "body",
  events: "title",
  albums: "title",
  tracks: "title",
  community_groups: "name",
  reels: "caption",
  group_posts: "body",
};

/**
 * /dashboard/trash — central restore surface for soft-deleted user
 * content. Reads each table for `deleted_at IS NOT NULL` rows owned
 * by the signed-in user. Restoring a row clears `deleted_at` and the
 * row reappears on the public surfaces.
 *
 * Soft-delete is opt-in across the codebase (see `src/lib/soft-delete.ts`)
 * so this page may stay sparse until the existing DELETE handlers are
 * migrated to call `softDelete()` instead of hard `DELETE`.
 */
export default async function TrashPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/trash");

  const queries = SOFT_DELETE_TABLES.map(async (t) => {
    const ownerCol = OWNER_COLUMN[t];
    const { data } = await supabase
      .from(t)
      .select("*")
      .not("deleted_at", "is", null)
      .eq(ownerCol, user.id)
      .order("deleted_at", { ascending: false })
      .limit(50);
    return { table: t, rows: data ?? [] };
  });
  const results = await Promise.all(queries);

  const all: TrashRow[] = [];
  for (const r of results) {
    for (const rowRaw of r.rows as unknown as Array<Record<string, unknown>>) {
      all.push({
        table: r.table,
        id: String(rowRaw.id),
        title:
          (rowRaw[TITLE_FIELDS[r.table]] as string | null)?.slice(0, 80) ??
          "(untitled)",
        deleted_at: String(rowRaw.deleted_at),
      });
    }
  }
  // Newest deletions first.
  all.sort((a, b) => (a.deleted_at < b.deleted_at ? 1 : -1));

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← DASHBOARD
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          Trash
        </h1>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Restore items you removed in the last 30 days. Soft-deleted
          rows are hidden from the public surfaces but otherwise intact —
          tap Restore to bring them back.
        </p>
      </div>

      {all.length === 0 ? (
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            Nothing in the trash.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Items you delete will land here so you can restore them in a
            tap.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map((row) => {
            const date = new Date(row.deleted_at);
            return (
              <div
                key={`${row.table}:${row.id}`}
                className="flex items-center gap-3 p-3"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className="c-kicker"
                    style={{ color: "var(--gold-c)", fontSize: 11 }}
                  >
                    § {TABLE_LABEL[row.table].toUpperCase()}
                  </p>
                  <p
                    className="c-card-t mt-0.5 line-clamp-1"
                    style={{ fontSize: 14, color: "var(--ink-strong)" }}
                  >
                    {row.title}
                  </p>
                  <p
                    className="c-meta mt-0.5"
                    style={{ color: "var(--ink-mute)" }}
                  >
                    Deleted{" "}
                    {date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {date.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <RestoreButton table={row.table} id={row.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
