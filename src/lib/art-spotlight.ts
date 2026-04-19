// Art Spotlight — featured art pieces from Compton
// These rotate as the hero on the homepage, showcasing local art and artists

export interface ArtPiece {
  id: string;
  slug: string;
  title: string;
  artist: string;
  artistBio: string;
  medium: string;
  year: string;
  location: string;
  locationAddress: string;
  description: string;
  imageUrl: string;
  artistImageUrl?: string;
  artistWebsite?: string;
  artistInstagram?: string;
  tags: string[];
}

export const artSpotlight: ArtPiece[] = [
  {
    id: "2",
    slug: "compton-museum",
    title: "Compton Museum",
    artist: "Compton Art & History Museum",
    artistBio:
      "The Compton Art & History Museum preserves and celebrates the rich cultural heritage of Compton, California — showcasing local art, history, and community stories for residents and visitors alike.",
    medium: "Photography",
    year: "2026",
    location: "Compton, CA",
    locationAddress: "106 W Compton Blvd, Compton",
    description:
      "A striking photograph from the Compton Art & History Museum, capturing the spirit and cultural legacy of one of Compton's most important cultural institutions.",
    imageUrl: "/images/compton-museum-hero.jpg",
    tags: ["museum", "compton", "culture", "history", "photography"],
  },
  {
    id: "1",
    slug: "compton-hub-city-mural",
    title: "Compton Knect",
    artist: "Unknown Compton Artist",
    artistBio:
      "A vibrant mural celebrating the identity of Compton as the Knect, where major freeways 110, 710, 91, and 105 converge. The piece captures the city's rich culture — from its music roots to its vision for the future with the Hotel, Convention Center, and Casino — all centered around an eye on the world.",
    medium: "Mural / Mixed Media",
    year: "2024",
    location: "Compton, CA",
    locationAddress: "Compton, CA 90220",
    description:
      "This iconic mural represents Compton at the crossroads — literally and figuratively. Featuring the interstate highways that make Compton the 'Knect', the artwork weaves together the Airport Air Show, music heritage, Martin Luther King Jr.'s legacy, and the city's bold future plans. The central eye symbolizes Compton watching the world while the world watches Compton.",
    imageUrl: "/images/art/compton-hub-city-mural.jpg",
    tags: ["mural", "compton", "culture", "heritage", "community"],
  },
];

// Get the current featured art piece (can rotate daily, weekly, etc.)
export function getFeaturedArt(): ArtPiece {
  // For now, return the first piece. Later: rotate based on date
  return artSpotlight[0];
}

// Get art piece by slug
export function getArtBySlug(slug: string): ArtPiece | undefined {
  return artSpotlight.find((a) => a.slug === slug);
}
