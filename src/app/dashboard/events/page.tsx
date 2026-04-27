import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /dashboard/events — list every event the signed-in user created
 * with quick-edit links. Anyone with a non-citizen role can land
 * here (the dashboard layout already gates access); we just scope
 * the list to events they own.
 */
export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = profile?.role === "admin";

  let q = supabase
    .from("events")
    .select(
      "id, slug, title, start_date, location_name, image_url, is_published, is_featured, is_ticketed, group_id",
    )
    .order("start_date", { ascending: false });
  if (!isAdmin) q = q.eq("created_by", user.id);

  const { data: events } = await q;

  const rows = events ?? [];

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
            § MY EVENTS
          </p>
          <h1
            className="c-hero mt-1"
            style={{ fontSize: 32, color: "var(--ink-strong)" }}
          >
            {rows.length} {rows.length === 1 ? "Event" : "Events"}
          </h1>
        </div>
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
            You haven&apos;t created any events yet.
          </p>
          <p
            className="c-serif-it mt-1"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            Admins can spin one up at /admin/events/new.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {rows.map((e) => {
            const date = new Date(`${e.start_date}T00:00:00`);
            const dateLabel = date.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            });
            return (
              <Link
                key={e.id}
                href={`/dashboard/events/${e.id}/edit`}
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
                    {e.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.image_url}
                        alt={e.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="c-card-t line-clamp-1"
                      style={{ fontSize: 14, color: "var(--ink-strong)" }}
                    >
                      {e.title}
                    </p>
                    <p
                      className="c-meta mt-0.5"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      {dateLabel}
                      {e.location_name ? ` · ${e.location_name}` : ""}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {e.is_published ? (
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
                      {e.is_featured && (
                        <span
                          className="c-badge c-badge-gold"
                          style={{ fontSize: 9 }}
                        >
                          FEATURED
                        </span>
                      )}
                      {e.is_ticketed && (
                        <span
                          className="c-badge c-badge-gold"
                          style={{ fontSize: 9 }}
                        >
                          TICKETED
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
