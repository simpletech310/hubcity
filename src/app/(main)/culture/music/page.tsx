import CultureHero from "@/components/culture/CultureHero";
import TimelineView from "@/components/culture/TimelineView";
import type { TimelineItem } from "@/components/culture/TimelineView";

export const metadata = {
  title: "Music Heritage | Compton Culture | Knect",
  description:
    "A timeline of Compton's legendary music history, from the birth of West Coast sound to today.",
};

const MUSIC_TIMELINE: TimelineItem[] = [
  {
    year: "1960s",
    title: "Birth of the West Coast Sound",
    description:
      "Compton's earliest musical roots grew from gospel, soul, and funk. Local churches and community centers became the proving ground for a generation of talent that would shape Southern California's sound.",
    color: "#7C3AED",
  },
  {
    year: "1980s",
    title: "N.W.A and the Gangsta Rap Revolution",
    description:
      "Eazy-E, Dr. Dre, Ice Cube, MC Ren, and DJ Yella formed N.W.A in Compton, creating a raw, unfiltered sound that documented street life and challenged mainstream America. Their debut album changed music forever.",
    color: "#EF4444",
  },
  {
    year: "1990s",
    title: "The Golden Era Continues",
    description:
      "DJ Quik, MC Eiht, Compton's Most Wanted, and The Game carried the torch. The city's producers and MCs refined the G-funk sound and West Coast gangsta rap into an art form recognized worldwide.",
    color: "#F59E0B",
  },
  {
    year: "2010s",
    title: "Kendrick Lamar and the New Generation",
    description:
      "Kendrick Lamar emerged from Compton to become one of hip-hop's greatest artists, earning a Pulitzer Prize. YG, Roddy Ricch, and others brought fresh perspectives while honoring the city's legacy.",
    color: "#10B981",
  },
  {
    year: "2020s",
    title: "Knect Creators and Beyond",
    description:
      "A new wave of Compton creators blends music, visual art, and digital media. Knect TV and independent artists are building platforms that amplify local voices and carry the culture forward.",
    color: "#C5A04E",
  },
];

export default function MusicHeritagePage() {
  return (
    <div className="space-y-10 pb-20">
      <CultureHero
        title="The Sound of Compton"
        subtitle="Six decades of music that changed the world."
        imageUrl="/images/art/IMG_2789.jpg"
      />

      <section className="px-5 max-w-4xl mx-auto">
        <div className="pattern-dots absolute inset-0 opacity-5 pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-2xl md:text-3xl text-text-primary text-center mb-10">
            A Musical Timeline
          </h2>
          <TimelineView items={MUSIC_TIMELINE} />
        </div>
      </section>

      {/* Legacy CTA */}
      <section className="px-5">
        <div className="rounded-2xl bg-gradient-to-r from-gold/10 to-purple-900/20 border border-gold/20 p-6 md:p-8 text-center">
          <h3 className="font-display text-xl md:text-2xl text-text-primary">
            Know a Compton artist?
          </h3>
          <p className="text-text-secondary text-sm mt-2 max-w-md mx-auto">
            Help us document the full story. Submit an artist or music
            landmark to be featured on Knect.
          </p>
          <a
            href="/culture/artists"
            className="inline-block mt-4 px-6 py-2.5 bg-gold text-black font-semibold rounded-full text-sm hover:bg-gold/90 transition-colors"
          >
            Explore Artists
          </a>
        </div>
      </section>
    </div>
  );
}
