import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export const metadata = {
  title: "Landmarks | Compton Culture | Culture",
  description: "Historic landmarks and notable sites in Compton, California.",
};

interface Landmark {
  name: string;
  description: string;
  location: string;
  icon: IconName;
  established?: string;
}

const landmarks: Landmark[] = [
  {
    name: "Compton Art & History Museum",
    description: "A community-centered museum amplifying the culture of Compton and greater South Los Angeles through art exhibitions and historical displays.",
    location: "306 W Compton Blvd. #104",
    icon: "landmark",
    established: "2023",
  },
  {
    name: "Compton City Hall",
    description: "The seat of Compton's municipal government and a central landmark in the heart of the city.",
    location: "205 S Willowbrook Ave",
    icon: "landmark",
    established: "1950s",
  },
  {
    name: "Compton/Woodley Airport",
    description: "One of the oldest airports in the LA area, hosting the Tomorrow's Aeronautical Museum which inspires youth through aviation.",
    location: "901 W Alondra Blvd",
    icon: "navigation",
    established: "1924",
  },
  {
    name: "Heritage House",
    description: "A restored Victorian home representing the architectural heritage of early Compton settlers.",
    location: "Compton, CA",
    icon: "landmark",
  },
  {
    name: "Martin Luther King Jr. Memorial",
    description: "A memorial dedicated to the legacy of Dr. Martin Luther King Jr. and the civil rights movement's impact on Compton.",
    location: "Compton Civic Center",
    icon: "star",
  },
  {
    name: "Gonzales Park",
    description: "One of Compton's most beloved parks, a gathering space for community events, sports, and recreation.",
    location: "E Compton Blvd & S Burris Ave",
    icon: "tree",
  },
  {
    name: "Compton Creek Natural Park",
    description: "A restored urban waterway and green space offering trails and native habitat along Compton Creek.",
    location: "Along Compton Creek",
    icon: "tree",
  },
  {
    name: "Kelly Park",
    description: "Historic park and community hub featuring sports facilities and hosting the annual Compton Day celebrations.",
    location: "400 E Greenleaf Blvd",
    icon: "tree",
    established: "1950s",
  },
];

export default function LandmarksPage() {
  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Compton Landmarks"
        subtitle="Historic sites and notable places across the city."
        imageUrl="/images/art/IMG_2774.JPG"
      />

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

      {/* Landmarks Grid */}
      <div className="px-5 space-y-3">
        {landmarks.map((landmark) => (
          <div
            key={landmark.name}
            className="p-4"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <div className="flex gap-3">
              <div
                className="shrink-0 w-11 h-11 flex items-center justify-center"
                style={{
                  background: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <Icon name={landmark.icon} size={18} style={{ color: "var(--ink-strong)" }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="c-card-t leading-tight" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                    {landmark.name}
                  </h3>
                  {landmark.established && (
                    <span className="c-badge-gold shrink-0">
                      Est. {landmark.established}
                    </span>
                  )}
                </div>
                <p className="c-body mt-1 leading-relaxed line-clamp-2" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                  {landmark.description}
                </p>
                <p className="c-meta mt-2 flex items-center gap-1" style={{ fontSize: 11 }}>
                  <Icon name="pin" size={10} className="shrink-0" />
                  {landmark.location}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
