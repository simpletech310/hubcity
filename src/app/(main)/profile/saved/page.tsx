import { redirect } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
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

  const [{ data: businesses }, { data: events }, { data: resources }] =
    await Promise.all([
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
            <Card hover>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald/15 to-emerald/5 flex items-center justify-center text-lg shrink-0 border border-border-subtle">
                  {categoryIcons[biz.category] || "store"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-[13px] truncate">
                    {biz.name}
                  </h3>
                  <p className="text-[11px] text-txt-secondary truncate">
                    {biz.address}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge label="Business" variant="emerald" />
                  {biz.rating_avg > 0 && (
                    <span className="text-[11px] text-gold font-bold">
                      <Icon name="star" size={16} /> {biz.rating_avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {/* Events */}
        {(events || []).map((ev) => (
          <Link key={ev.id} href={`/events/${ev.id}`}>
            <Card hover>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-coral/15 to-coral/5 flex items-center justify-center text-lg shrink-0 border border-border-subtle">
                  {categoryIcons[ev.category] || "calendar"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-[13px] truncate">
                    {ev.title}
                  </h3>
                  <p className="text-[11px] text-txt-secondary">
                    {new Date(ev.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {ev.location_name ? ` · ${ev.location_name}` : ""}
                  </p>
                </div>
                <Badge label="Event" variant="coral" />
              </div>
            </Card>
          </Link>
        ))}

        {/* Resources */}
        {(resources || []).map((res) => (
          <Link key={res.id} href={`/resources/${res.id}`}>
            <Card hover>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-cyan/15 to-cyan/5 flex items-center justify-center text-lg shrink-0 border border-border-subtle">
                  {categoryIcons[res.category] || "document"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-[13px] truncate">
                    {res.name}
                  </h3>
                  <p className="text-[11px] text-txt-secondary truncate">
                    {res.organization}
                  </p>
                </div>
                <Badge
                  label={res.status === "open" ? "Open" : res.status}
                  variant={res.status === "open" ? "emerald" : "cyan"}
                />
              </div>
            </Card>
          </Link>
        ))}

        {items.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-3"><Icon name="bookmark" size={28} /></span>
            <p className="text-sm font-medium mb-1">Nothing saved yet</p>
            <p className="text-xs text-txt-secondary mb-4">
              Save businesses, events, and resources to find them here
            </p>
            <Link
              href="/"
              className="text-sm text-gold font-semibold press hover:underline"
            >
              Explore Culture →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
