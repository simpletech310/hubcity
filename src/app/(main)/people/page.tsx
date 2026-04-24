import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import { buildExploreFeed } from "@/lib/feed/exploreFeed";
import ExploreMosaic from "@/components/explore/ExploreMosaic";

export async function generateMetadata(): Promise<Metadata> {
  const city = await getActiveCity();
  const name = city?.name ?? "Your City";
  return {
    title: `Explore | ${name} | Culture`,
    description: `Discover creators, events, shows, and culture in ${name}.`,
  };
}

export default async function PeoplePage() {
  const city = await getActiveCity();
  if (!city) redirect("/choose-city");

  const supabase = await createClient();
  const items = await buildExploreFeed(supabase, { cityId: city.id });

  const cityUpper = (city?.name ?? "EVERYWHERE").toUpperCase();

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
        <p className="c-serif-it mt-2" style={{ fontSize: 14, lineHeight: 1.45 }}>
          Who&rsquo;s making, what&rsquo;s happening in {city.name}.
        </p>
      </div>
      <ExploreMosaic items={items} />
    </div>
  );
}
