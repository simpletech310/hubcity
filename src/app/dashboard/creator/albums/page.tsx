import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /dashboard/creator/albums — list every album the signed-in
 * creator owns. Each row links to the per-album edit form.
 */
export default async function MyAlbumsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: albums } = await supabase
    .from("albums")
    .select(
      "id, slug, title, release_type, cover_art_url, release_date, is_published, created_at",
    )
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false });

  const rows = albums ?? [];

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § MY MUSIC
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          {rows.length} {rows.length === 1 ? "Album" : "Albums"}
        </h1>
      </div>

      {rows.length === 0 ? (
        <div
          className="p-6 text-center"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
            No albums on your channel yet.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Albums are uploaded via the Frequency seed scripts today —
            ping ops to add a new release.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((a) => {
            const dateLabel = a.release_date
              ? new Date(`${a.release_date}T00:00:00`).toLocaleDateString(
                  "en-US",
                  { month: "short", year: "numeric" },
                )
              : "—";
            return (
              <Link
                key={a.id}
                href={`/dashboard/creator/albums/${a.id}/edit`}
                className="block press"
                style={{
                  border: "2px solid var(--rule-strong-c)",
                  background: "var(--paper)",
                }}
              >
                <div className="flex items-center gap-3 p-3">
                  <div
                    className="w-16 h-16 shrink-0 overflow-hidden"
                    style={{
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {a.cover_art_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.cover_art_url}
                        alt={a.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="c-card-t line-clamp-1"
                      style={{ fontSize: 14, color: "var(--ink-strong)" }}
                    >
                      {a.title}
                    </p>
                    <p
                      className="c-meta mt-0.5"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      {(a.release_type ?? "ALBUM").toString().toUpperCase()} ·{" "}
                      {dateLabel}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {a.is_published ? (
                        <span
                          className="c-badge c-badge-gold"
                          style={{ fontSize: 9 }}
                        >
                          PUBLISHED
                        </span>
                      ) : (
                        <span
                          className="c-badge c-badge-ink"
                          style={{ fontSize: 9 }}
                        >
                          DRAFT
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="c-kicker shrink-0"
                    style={{ color: "var(--gold-c)" }}
                  >
                    EDIT →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
