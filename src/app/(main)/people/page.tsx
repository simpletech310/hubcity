import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import { getCityFilter } from "@/lib/city-filter";
import { buildExploreFeed } from "@/lib/feed/exploreFeed";
import ExploreMosaic from "@/components/explore/ExploreMosaic";
import CityFilterChip from "@/components/ui/CityFilterChip";

export async function generateMetadata(): Promise<Metadata> {
  const city = await getActiveCity();
  const name = city?.name ?? "Your City";
  return {
    title: `Explore | ${name} | Culture`,
    description: `Discover creators, events, shows, and culture in ${name}.`,
  };
}

export default async function PeoplePage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string | string[] }>;
}) {
  // Default scope = ALL cities. Listener narrows via the CityFilterChip.
  const sp = (await (searchParams ?? Promise.resolve({}))) as { city?: string | string[] };
  const filterCity = await getCityFilter(sp);
  const home = await getActiveCity();
  const labelCity = filterCity ?? home;

  const supabase = await createClient();
  const items = await buildExploreFeed(supabase, { cityId: filterCity?.id ?? null });

  const cityUpper = (labelCity?.name ?? "EVERYWHERE").toUpperCase();

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § VOL·01 · ISSUE EXPLORE · {cityUpper}
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 64, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Explore.
        </h1>
        <div className="mt-3"><CityFilterChip /></div>
        <p className="c-serif-it mt-2" style={{ fontSize: 14, lineHeight: 1.45 }}>
          Who&rsquo;s making, what&rsquo;s happening in {labelCity?.name ?? "your city"}.
        </p>
      </div>
      <ExploreMosaic items={items} />
    </div>
  );
}
