import { createClient } from "@/lib/supabase/server";
import { buildExploreFeed } from "@/lib/feed/exploreFeed";
import ExploreMosaic from "@/components/explore/ExploreMosaic";

export const metadata = {
  title: "Explore | Knect",
  description: "Discover creators, events, shows, and culture in Compton, CA",
};

export default async function PeoplePage() {
  const supabase = await createClient();
  const items = await buildExploreFeed(supabase);

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-5">
          <h1 className="font-heading text-2xl font-bold mb-1">Explore</h1>
          <p className="text-sm text-txt-secondary">
            Who&apos;s creating, what&apos;s happening.
          </p>
        </div>
      </div>

      <ExploreMosaic items={items} />
    </div>
  );
}
