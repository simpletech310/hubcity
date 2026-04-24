import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import Card from "@/components/ui/Card";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export const metadata = {
  title: "Media | The Compton Museum | Culture",
  description: "Videos, documentaries, and cultural media from Compton's heritage.",
};

export default async function MediaPage() {
  const supabase = await createClient();

  // Get museum channel videos
  const { data: museumChannel } = await supabase
    .from("channels")
    .select("id")
    .eq("type", "museum")
    .eq("is_active", true)
    .limit(1)
    .single();

  let videos: Record<string, unknown>[] = [];

  if (museumChannel) {
    const { data } = await supabase
      .from("channel_videos")
      .select("*")
      .eq("channel_id", museumChannel.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });
    videos = data ?? [];
  }

  // Also get culture-category live stream replays
  const { data: streams } = await supabase
    .from("live_streams")
    .select("id, title, description, thumbnail_url, scheduled_at, viewer_count, creator:profiles(display_name)")
    .eq("category", "culture")
    .eq("status", "idle")
    .not("scheduled_at", "is", null)
    .order("scheduled_at", { ascending: false })
    .limit(10);

  const liveStreams = streams ?? [];

  return (
    <div className="space-y-6 pb-20">
      <CultureHero title="Media" subtitle="Videos, documentaries, and cultural stories from the Museum." imageUrl="/images/art/IMG_2788.jpg" />

      <div
        className="sticky top-0 z-30"
        style={{
          background: "var(--paper)",
          borderBottom: "2px solid var(--rule-strong-c)",
        }}
      >
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      {/* Museum Channel Videos */}
      {videos.length > 0 && (
        <section className="px-5">
          <h2 className="c-card-t mb-3" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Museum Collection</h2>
          <div className="space-y-3">
            {videos.map((video) => (
              <Card key={video.id as string} hover padding>
                <div className="flex gap-3">
                  <div
                    className="w-28 h-20 overflow-hidden shrink-0"
                    style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    {typeof video.thumbnail_url === "string" && video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--ink-strong)" }}><Icon name="film" size={24} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="c-card-t line-clamp-2" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                      {video.title as string}
                    </h3>
                    {typeof video.view_count === "number" && (
                      <p className="c-meta mt-1" style={{ fontSize: 10 }}>
                        {video.view_count.toLocaleString()} views
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Culture Streams */}
      {liveStreams.length > 0 && (
        <section className="px-5">
          <h2 className="c-card-t mb-3" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Cultural Streams</h2>
          <div className="space-y-3">
            {liveStreams.map((stream) => {
              const creatorRaw = stream.creator as unknown;
              const creator = (Array.isArray(creatorRaw) ? creatorRaw[0] : creatorRaw) as { display_name: string } | null;
              return (
                <Link key={stream.id} href={`/live/watch/${stream.id}`}>
                  <Card hover padding>
                    <div className="flex gap-3">
                      <div
                        className="w-20 h-14 overflow-hidden shrink-0"
                        style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
                      >
                        {stream.thumbnail_url ? (
                          <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--ink-strong)" }}><Icon name="live" size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="c-card-t truncate" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{stream.title}</h3>
                        {creator?.display_name && (
                          <p className="c-meta mt-0.5" style={{ fontSize: 10 }}>{creator.display_name}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {videos.length === 0 && liveStreams.length === 0 && (
        <div
          className="text-center py-16 px-6 mx-5"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <span className="block mb-3" style={{ color: "var(--ink-strong)" }}><Icon name="film" size={28} /></span>
          <p className="c-card-t mb-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>Media collection coming soon</p>
          <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
            Documentaries, interviews, and cultural films are being curated for the Museum.
          </p>
        </div>
      )}
    </div>
  );
}
