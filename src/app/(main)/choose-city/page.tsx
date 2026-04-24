import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { listKnownCities } from "@/lib/cities";
import { SITE_NAME } from "@/lib/branding";

export const metadata = { title: "Choose your city" };

// Accept ?next=/events so the picker can hand off to any service.
// Falls back to the /c/[slug] entry page which sets cookies + redirects to /.
type SearchParams = Promise<{ next?: string; pending?: string }>;

function safeNext(raw: string | undefined): string | null {
  if (!raw) return null;
  // Only allow same-origin absolute paths, no query/hash injection beyond the path.
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw.split("#")[0];
}

const SECTION_HINT: Record<string, { icon: string; label: string }> = {
  "/events": { icon: "calendar", label: "Events" },
  "/food": { icon: "utensils", label: "Food" },
  "/business": { icon: "briefcase", label: "Business" },
  "/health": { icon: "heart-pulse", label: "Health" },
  "/culture": { icon: "palette", label: "Culture" },
  "/jobs": { icon: "briefcase", label: "Jobs" },
  "/groups": { icon: "users", label: "Groups" },
  "/people": { icon: "sparkle", label: "Explore" },
  "/creators": { icon: "film", label: "Discover" },
  "/resources": { icon: "book", label: "Resources" },
  "/live": { icon: "film", label: "Culture TV" },
};

export default async function ChooseCityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next: rawNext, pending } = await searchParams;
  const next = safeNext(rawNext);
  const hint = next ? SECTION_HINT[next] : undefined;

  const cities = await listKnownCities();
  const live = cities.filter((c) => c.launch_status === "live");
  const comingSoon = cities.filter((c) => c.launch_status === "coming_soon");

  // Each live city goes to /c/[slug]?then=[next] so /c/[city] can set the
  // cookie and redirect. If no next, it falls back to "/".
  const cityHref = (slug: string) => {
    const suffix = next ? `?then=${encodeURIComponent(next)}` : "";
    return `/c/${slug}${suffix}`;
  };

  return (
    <main className="culture-surface min-h-dvh">
      <section
        className="px-6 py-10 max-w-2xl mx-auto"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          {hint ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name={hint.icon as "calendar"} size={12} />
              {hint.label.toUpperCase()} · CHOOSE A CITY
            </span>
          ) : (
            "§ PICK A CITY TO EXPLORE"
          )}
        </div>
        <h1 className="c-hero mt-3" style={{ fontSize: 56, lineHeight: 0.9 }}>
          {hint ? (
            <>Where do you want to see {hint.label.toLowerCase()}?</>
          ) : (
            <>Where are we connecting?</>
          )}
        </h1>
        <p className="c-serif-it mt-3" style={{ fontSize: 14 }}>
          {SITE_NAME} is a marketplace for the culture, small businesses, and
          everyday life of your city. Pick one to browse — events, food,
          jobs, resources, and more.
        </p>

        {pending && (
          <div className="mt-4 border px-3 py-2 text-[12px]" style={{ borderColor: "var(--ink-strong)", color: "var(--ink-strong)" }}>
            <strong>{pending}</strong> is launching soon — pick another city
            for now.
          </div>
        )}
      </section>

      <section className="px-6 py-8 max-w-2xl mx-auto">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
          Live now
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {live.map((c) => (
            <Link
              key={c.id}
              href={cityHref(c.slug)}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] hover:border-gold/40 hover:bg-white/[0.04] p-5 transition"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {c.state} · {c.default_zip_codes.length} ZIP
                    {c.default_zip_codes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Icon name="forward" size={16} className="text-gold" />
              </div>
            </Link>
          ))}
        </div>

        {comingSoon.length > 0 && (
          <>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/60 mt-8 mb-3">
              Coming soon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {comingSoon.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/5 bg-white/[0.01] p-5 opacity-60"
                >
                  <p className="font-display text-xl">{c.name}</p>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {c.state} · launching soon
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
