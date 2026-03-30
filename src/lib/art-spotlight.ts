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
    id: "1",
    slug: "compton-hub-city-mural",
    title: "Compton Hub City",
    artist: "Unknown Compton Artist",
    artistBio:
      "A vibrant mural celebrating the identity of Compton as the Hub City, where major freeways 110, 710, 91, and 105 converge. The piece captures the city's rich culture — from its music roots to its vision for the future with the Hotel, Convention Center, and Casino — all centered around an eye on the world.",
    medium: "Mural / Mixed Media",
    year: "2024",
    location: "Compton, CA",
    locationAddress: "Compton, CA 90220",
    description:
      "This iconic mural represents Compton at the crossroads — literally and figuratively. Featuring the interstate highways that make Compton the 'Hub City', the artwork weaves together the Airport Air Show, music heritage, Martin Luther King Jr.'s legacy, and the city's bold future plans. The central eye symbolizes Compton watching the world while the world watches Compton.",
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
