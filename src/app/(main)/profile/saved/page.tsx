import { redirect } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import Icon from "@/components/ui/Icon";

export default async function SavedItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile/saved");
  }

  // Fetch all saved items
  const { data: savedItems } = await supabase
    .from("saved_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = savedItems || [];

  // Fetch the actual items data
  const businessIds = items
    .filter((i) => i.item_type === "business")
    .map((i) => i.item_id);
  const eventIds = items
    .filter((i) => i.item_type === "event")
    .map((i) => i.item_id);
  const resourceIds = items
    .filter((i) => i.item_type === "resource")
    .map((i) => i.item_id);
  const albumIds = items
    .filter((i) => i.item_type === "album")
    .map((i) => i.item_id);
  const groupIds = items
    .filter((i) => i.item_type === "group")
    .map((i) => i.item_id);
  const creatorIds = items
    .filter((i) => i.item_type === "creator")
    .map((i) => i.item_id);

  const [
    { data: businesses },
    { data: events },
    { data: resources },
    { data: albums },
    { data: groups },
    { data: creators },
  ] = await Promise.all([
    businessIds.length > 0
      ? supabase
          .from("businesses")
          .select("id, name, slug, category, address, rating_avg")
          .in("id", businessIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase
          .from("events")
          .select("id, title, slug, category, start_date, location_name")
          .in("id", eventIds)
      : Promise.resolve({ data: [] }),
    resourceIds.length > 0
      ? supabase
          .from("resources")
          .select("id, name, slug, category, organization, status")
          .in("id", resourceIds)
      : Promise.resolve({ data: [] }),
    albumIds.length > 0
      ? supabase
          .from("albums")
          .select("id, slug, title, cover_art_url, release_type")
          .in("id", albumIds)
      : Promise.resolve({ data: [] }),
    groupIds.length > 0
      ? supabase
          .from("community_groups")
          .select("id, slug, name, description, image_url, avatar_url")
          .in("id", groupIds)
      : Promise.resolve({ data: [] }),
    creatorIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, handle, display_name, avatar_url")
          .in("id", creatorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const categoryIcons: Record<string, string> = {
    business: "store",
    restaurant: "utensils",
    barber: "scissors",
    retail: "shopping",
    event: "calendar",
    resource: "document",
    community: "users",
    sports: "trophy",
    culture: "palette",
    city: "landmark",
    youth: "education",
    housing: "home",
    health: "heart",
    jobs: "briefcase",
    food: "apple",
    education: "book",
  };

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 mb-5" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          Profile
        </Link>
        <p className="c-kicker">§ PROFILE · SAVED</p>
        <h1 className="c-hero">Saved Items.</h1>
        <p className="c-serif-it">
          {items.length} saved item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="px-5 space-y-3 stagger">
        {/* Businesses */}
        {(businesses || []).map((biz) => (
          <Link key={biz.id} href={`/business/${biz.slug || biz.id}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 flex items-center justify-center text-lg shrink-0"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {categoryIcons[biz.category] || "store"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {biz.name}
                  </h3>
                  <p className="c-meta truncate">
                    {biz.address}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge label="Business" variant="emerald" />
                  {biz.rating_avg > 0 && (
                    <span className="c-kicker" style={{ color: "var(--ink-strong)" }}>
                      <Icon name="star" size={12} /> {biz.rating_avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Events */}
        {(events || []).map((ev) => (
          <Link key={ev.id} href={`/events/${ev.id}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 flex items-center justify-center text-lg shrink-0"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {categoryIcons[ev.category] || "calendar"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {ev.title}
                  </h3>
                  <p className="c-meta">
                    {new Date(ev.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {ev.location_name ? ` · ${ev.location_name}` : ""}
                  </p>
                </div>
                <Badge label="Event" variant="coral" />
              </div>
            </div>
          </Link>
        ))}

        {/* Resources */}
        {(resources || []).map((res) => (
          <Link key={res.id} href={`/resources/${res.id}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 flex items-center justify-center text-lg shrink-0"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {categoryIcons[res.category] || "document"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {res.name}
                  </h3>
                  <p className="c-meta truncate">
                    {res.organization}
                  </p>
                </div>
                <Badge
                  label={res.status === "open" ? "Open" : res.status}
                  variant={res.status === "open" ? "emerald" : "cyan"}
                />
              </div>
            </div>
          </Link>
        ))}

        {/* Albums */}
        {(albums || []).map((al) => (
          <Link key={al.id} href={`/frequency/album/${al.slug}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 shrink-0 overflow-hidden"
                  style={{
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {al.cover_art_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={al.cover_art_url}
                      alt={al.title}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {al.title}
                  </h3>
                  <p className="c-meta">
                    {(al.release_type ?? "ALBUM").toString().toUpperCase()}
                  </p>
                </div>
                <Badge label="Music" variant="gold" />
              </div>
            </div>
          </Link>
        ))}

        {/* Groups */}
        {(groups || []).map((g) => (
          <Link key={g.id} href={`/groups/${g.slug || g.id}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 shrink-0 overflow-hidden"
                  style={{
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {g.image_url || g.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.image_url || g.avatar_url || ""}
                      alt={g.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {g.name}
                  </h3>
                  <p className="c-meta truncate">
                    {(g.description || "").slice(0, 80)}
                  </p>
                </div>
                <Badge label="Group" variant="cyan" />
              </div>
            </div>
          </Link>
        ))}

        {/* Creators */}
        {(creators || []).map((c) => (
          <Link key={c.id} href={`/user/${c.handle}`}>
            <div
              className="c-frame p-3 press"
              style={{ background: "var(--paper-soft)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full shrink-0 overflow-hidden"
                  style={{
                    background: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar_url}
                      alt={c.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t truncate" style={{ fontSize: 13 }}>
                    {c.display_name || `@${c.handle}`}
                  </h3>
                  <p className="c-meta">@{c.handle}</p>
                </div>
                <Badge label="Creator" variant="emerald" />
              </div>
            </div>
          </Link>
        ))}

        {items.length === 0 && (
          <div className="text-center py-16">
            <Icon name="bookmark" size={28} className="mx-auto mb-3" style={{ color: "var(--ink-strong)", opacity: 0.4 }} />
            <p className="c-card-t mb-1" style={{ fontSize: 14 }}>Nothing saved yet</p>
            <p className="c-meta mb-4">
              Save businesses, events, and resources to find them here
            </p>
            <Link
              href="/"
              className="c-btn c-btn-primary c-btn-sm press"
            >
              EXPLORE CULTURE →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
