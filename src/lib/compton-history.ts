// Compton History Timeline — from founding to present
// Used by the Compton Museum History page

export interface HistoryEntry {
  year: string;
  title: string;
  description: string;
  color: string;
  category: "founding" | "civil_rights" | "music" | "sports" | "politics" | "renaissance";
}

export const COMPTON_HISTORY: HistoryEntry[] = [
  {
    year: "1867",
    title: "Griffith D. Compton Founds the Settlement",
    description:
      "A group of 30 pioneering families led by Griffith Dickenson Compton settled the area after trekking from Northern California. They established a farming community on land purchased from the Dominguez Rancho, planting the roots of what would become one of America's most culturally significant cities.",
    color: "#8B7355",
    category: "founding",
  },
  {
    year: "1888",
    title: "City of Compton Incorporated",
    description:
      "Compton officially incorporated as a city, becoming one of the oldest cities in the region. Agriculture and dairy farming drove the early economy, with the Pacific Electric Railway connecting Compton to Los Angeles and long Beach.",
    color: "#8B7355",
    category: "founding",
  },
  {
    year: "1920s",
    title: "A Growing Agricultural Hub",
    description:
      "Compton grew as a thriving agricultural community. Japanese-American farmers cultivated strawberry fields and nurseries throughout the area. The city's central location between LA and Long Beach earned it the name 'Knect' — a name that endures today.",
    color: "#6B8E23",
    category: "founding",
  },
  {
    year: "1940s",
    title: "The Great Migration Reshapes the City",
    description:
      "African Americans migrating from the South settled in Compton, drawn by wartime jobs and the promise of homeownership. The city's demographics began a historic transformation that would define its cultural identity for generations to come.",
    color: "#4169E1",
    category: "civil_rights",
  },
  {
    year: "1969",
    title: "Douglas F. Dollarhide Makes History",
    description:
      "Douglas F. Dollarhide became the first African American mayor of Compton, marking a turning point in the city's political landscape. His election reflected the growing civic power of Black residents and set the stage for decades of community-led governance.",
    color: "#7C3AED",
    category: "politics",
  },
  {
    year: "1973",
    title: "Doris Davis — First Black Woman Mayor",
    description:
      "Doris Davis was elected mayor of Compton, becoming the first Black woman to lead a major metropolitan city in the United States. Her groundbreaking leadership proved that Compton was a city of firsts, paving the way for women of color in politics nationwide.",
    color: "#7C3AED",
    category: "politics",
  },
  {
    year: "1986",
    title: "N.W.A and the Birth of Gangsta Rap",
    description:
      "Eazy-E, Dr. Dre, Ice Cube, MC Ren, and DJ Yella formed N.W.A in Compton. Their raw, unfiltered documentation of street life created an entirely new genre and put Compton on the global cultural map forever. 'Straight Outta Compton' became a defining album of a generation.",
    color: "#EF4444",
    category: "music",
  },
  {
    year: "1990s",
    title: "The Golden Era of West Coast Hip-Hop",
    description:
      "DJ Quik, MC Eiht, Compton's Most Wanted, and The Game carried the torch. Compton producers and MCs refined G-funk and West Coast gangsta rap into a global art form. The city's name became synonymous with authentic, boundary-pushing music.",
    color: "#F59E0B",
    category: "music",
  },
  {
    year: "1995",
    title: "Venus & Serena Williams Rise from Compton Courts",
    description:
      "Venus and Serena Williams, trained on the public courts of Compton by their father Richard, burst onto the professional tennis scene. They would go on to become two of the greatest athletes in history, forever linked to their Compton roots.",
    color: "#10B981",
    category: "sports",
  },
  {
    year: "2012",
    title: "Kendrick Lamar — Good Kid, M.A.A.D City",
    description:
      "Kendrick Lamar released 'good kid, m.A.A.d city,' a vivid portrait of growing up in Compton that earned critical acclaim worldwide. He would go on to win a Pulitzer Prize for Music — the first non-classical, non-jazz artist to do so — cementing Compton's place in global culture.",
    color: "#C5A04E",
    category: "music",
  },
  {
    year: "2015",
    title: "Straight Outta Compton — The Film",
    description:
      "The biographical film about N.W.A grossed over $200 million worldwide, introducing Compton's story to a new generation. The movie reignited global interest in the city's cultural impact and sparked renewed pride among residents.",
    color: "#EF4444",
    category: "music",
  },
  {
    year: "2020s",
    title: "The Compton Renaissance",
    description:
      "A new generation of creators, entrepreneurs, and civic leaders are reshaping Compton. Knect TV amplifies local voices, new businesses are opening, murals are transforming neighborhoods, and the Compton Art & History Museum preserves the culture for future generations. The Knect's best chapter is being written now.",
    color: "#C5A04E",
    category: "renaissance",
  },
];
