import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import { buildExploreFeed } from "@/lib/feed/exploreFeed";
import ExploreMosaic from "@/components/explore/ExploreMosaic";
import { Masthead } from "@/components/ui/editorial";

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

  return (
    <div className="animate-fade-in pb-safe">
      <Masthead
        volume="VOL · 01"
        issue="ISSUE EXPLORE"
        headline="EXPLORE."
        strap={`Who's making, what's happening in ${city.name}`}
      />
      <ExploreMosaic items={items} />
    </div>
  );
}
