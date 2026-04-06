import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SchoolPostGrid from "@/components/schools/SchoolPostGrid";

type SchoolLevel = "high_school" | "middle_school" | "elementary" | "college";

interface School {
  slug: string;
  name: string;
  level: SchoolLevel;
  address: string;
  grades: string;
  phone: string | null;
  district: string | null;
  mascot: string | null;
  colors: string | null;
  schoolColors: [string, string];
  website: string | null;
  image: string | null;
  enrollment: number;
  rating: number;
  tagline: string;
  highlights: string[];
  programs: string[];
  notableAlumni?: string[];
  established: number;
  description: string;
  principal: string;
  athletics?: string[];
  clubs?: string[];
  achievements?: string[];
}

const levelLabels: Record<SchoolLevel, string> = {
  high_school: "High School",
  middle_school: "Middle School",
  elementary: "Elementary",
  college: "College",
};

const levelColors: Record<SchoolLevel, string> = {
  high_school: "#3B82F6",
  middle_school: "#06B6D4",
  elementary: "#22C55E",
  college: "#F2A900",
};

const schools: School[] = [
  {
    slug: "compton-high-school",
    name: "Compton High School",
    level: "high_school",
    address: "601 S Acacia Ave, Compton, CA 90220",
    grades: "9-12",
    phone: "(310) 639-4321",
    district: "Compton Unified",
    mascot: "Tarbabes",
    colors: "Blue & White",
    schoolColors: ["#1E40AF", "#60A5FA"],
    website: null,
    image: "/images/generated/compton-high.png",
    enrollment: 1650,
    rating: 4.2,
    tagline: "Where Champions Are Made",
    established: 1896,
    description: "Founded in 1896, Compton High School is the crown jewel of Compton Unified School District. As the oldest high school in the city, CHS has a storied tradition of academic excellence and athletic dominance. Our campus is home to championship-caliber athletic programs, a nationally recognized marching band, and a cutting-edge STEM magnet program that prepares students for careers in technology and engineering.",
    principal: "Dr. Marcus Johnson",
    highlights: ["CIF Football Champions", "Award-Winning Band", "STEM Magnet Program"],
    programs: ["AP Courses", "AVID", "Athletics", "Performing Arts", "ROTC", "STEM Magnet", "Dual Enrollment"],
    notableAlumni: ["Kevin Costner", "Venus Williams"],
    athletics: ["Football", "Basketball", "Track & Field", "Baseball", "Soccer", "Wrestling", "Tennis", "Swimming"],
    clubs: ["National Honor Society", "Robotics Club", "Drama Club", "Student Government", "Black Student Union", "Key Club", "MESA", "Yearbook"],
    achievements: ["2024 CIF Southern Section Football Champions", "Gold Medal — Marching Band Championships", "Top 10 STEM Schools in LA County", "100+ College Acceptances Annually"],
  },
  {
    slug: "dominguez-high-school",
    name: "Dominguez High School",
    level: "high_school",
    address: "15301 S San Jose Ave, Compton, CA 90221",
    grades: "9-12",
    phone: "(310) 631-7981",
    district: "Compton Unified",
    mascot: "Dons",
    colors: "Red & White",
    schoolColors: ["#DC2626", "#FCA5A5"],
    website: null,
    image: "/images/generated/dominguez-high.png",
    enrollment: 1480,
    rating: 4.0,
    tagline: "Excellence Through Unity",
    established: 1952,
    description: "Dominguez High School is a powerhouse of athletic talent and academic growth. Known worldwide as a track and field factory, DHS has produced more Olympic athletes than almost any other high school in the nation. Beyond athletics, our Visual Arts program and CTE Pathways prepare students for creative and technical careers. The Dons spirit runs deep — once a Don, always a Don.",
    principal: "Ms. Angela Torres",
    highlights: ["Track & Field Powerhouse", "Visual Arts Program", "College Prep Focus"],
    programs: ["AP Courses", "CTE Pathways", "Athletics", "Visual Arts", "Robotics", "Medical Academy"],
    notableAlumni: ["Willie McGinest", "Antonio Gates"],
    athletics: ["Track & Field", "Football", "Basketball", "Cross Country", "Soccer", "Volleyball", "Softball"],
    clubs: ["Art Club", "Robotics", "MESA", "Student Government", "Future Business Leaders", "Photography", "Dance Team"],
    achievements: ["Most Olympic Athletes from a US High School", "CIF Track Champions — 15+ Titles", "Visual Arts District Showcase Winners", "College Enrollment Rate: 78%"],
  },
  {
    slug: "centennial-high-school",
    name: "Centennial High School",
    level: "high_school",
    address: "2606 N Central Ave, Compton, CA 90222",
    grades: "9-12",
    phone: "(310) 604-4064",
    district: "Compton Unified",
    mascot: "Apaches",
    colors: "Green & Gold",
    schoolColors: ["#15803D", "#86EFAC"],
    website: null,
    image: "/images/generated/centennial-high.png",
    enrollment: 1320,
    rating: 4.1,
    tagline: "Building Tomorrow's Leaders",
    established: 1954,
    description: "Centennial High School is where community meets opportunity. Our Health Sciences Academy gives students hands-on experience in medical fields, with direct pathways to nursing and healthcare careers. The Apache spirit is defined by resilience, pride, and a commitment to lifting each other up. With a rising basketball program and strong community bonds, CHS is a school on the move.",
    principal: "Mr. David Williams",
    highlights: ["Health Sciences Academy", "Strong Community Bonds", "Rising Basketball Program"],
    programs: ["Health Sciences", "AP Courses", "Athletics", "Dance Team", "Tutoring Center", "Peer Mentoring"],
    athletics: ["Basketball", "Football", "Track & Field", "Soccer", "Volleyball", "Baseball"],
    clubs: ["Health Sciences Club", "Dance Team", "Student Government", "Community Service", "Math Club", "Chess Club"],
    achievements: ["Health Sciences Academy — 95% Certification Rate", "Basketball League Semi-Finalists", "Community Service Award — LA County", "Rising Graduation Rate — Up 12%"],
  },
  {
    slug: "lynwood-high-school",
    name: "Lynwood High School",
    level: "high_school",
    address: "4050 E Imperial Hwy, Lynwood, CA 90262",
    grades: "9-12",
    phone: "(310) 886-1600",
    district: "Lynwood Unified",
    mascot: "Knights",
    colors: "Blue & Gold",
    schoolColors: ["#1D4ED8", "#FCD34D"],
    website: null,
    image: null,
    enrollment: 2100,
    rating: 3.9,
    tagline: "Knights Rise Together",
    established: 1940,
    description: "Lynwood High School boasts one of the largest and most diverse campuses in the area. Home to an award-winning marching band that has performed at nationally televised events, LHS combines school spirit with serious academics. Our Engineering Pathway and Media Arts programs are producing the next generation of innovators and content creators.",
    principal: "Dr. Robert Chen",
    highlights: ["Award-Winning Marching Band", "Large Campus", "Diverse Programs"],
    programs: ["AP Courses", "Marching Band", "Athletics", "Engineering Pathway", "Media Arts", "Business Academy"],
    athletics: ["Football", "Basketball", "Soccer", "Track & Field", "Wrestling", "Tennis", "Softball", "Swimming"],
    clubs: ["Marching Band", "Color Guard", "Engineering Club", "Media Production", "Student Government", "National Honor Society"],
    achievements: ["Rose Parade Marching Band — 3x Participants", "Engineering Design Challenge Winners", "Largest Campus in the District", "Media Arts Student Film Festival Winners"],
  },
  {
    slug: "walton-middle-school",
    name: "Walton Middle School",
    level: "middle_school",
    address: "820 W Magnolia St, Compton, CA 90220",
    grades: "6-8",
    phone: "(310) 639-4306",
    district: "Compton Unified",
    mascot: "Warriors",
    colors: "Navy & Gold",
    schoolColors: ["#1E3A5F", "#60A5FA"],
    website: null,
    image: null,
    enrollment: 720,
    rating: 3.8,
    tagline: "Preparing Warriors for the Future",
    established: 1955,
    description: "Walton Middle School builds strong foundations for high school success. With a robust math program that consistently outperforms district averages and an after-school enrichment program that keeps students engaged until 6 PM, Walton Warriors are prepared for anything. Our Student Leadership program teaches young people to be voices for their community.",
    principal: "Ms. Patricia Lee",
    highlights: ["Strong Math Program", "After-School Enrichment", "Student Leadership"],
    programs: ["STEM Enrichment", "Music", "Sports", "Tutoring", "Student Council", "After-School to 6 PM"],
    athletics: ["Basketball", "Track & Field", "Soccer", "Volleyball"],
    clubs: ["Student Council", "Math Olympiad", "Music Ensemble", "Art Club", "Coding Club"],
    achievements: ["District Math Bowl Champions", "After-School Program — Serves 300+ Students", "Student Leadership Conference Hosts"],
  },
  {
    slug: "whaley-middle-school",
    name: "Whaley Middle School",
    level: "middle_school",
    address: "15509 S Wadsworth Ave, Compton, CA 90221",
    grades: "6-8",
    phone: "(310) 898-6465",
    district: "Compton Unified",
    mascot: "Wildcats",
    colors: "Purple & White",
    schoolColors: ["#7C3AED", "#C4B5FD"],
    website: null,
    image: null,
    enrollment: 650,
    rating: 3.7,
    tagline: "Wildcats Lead the Way",
    established: 1962,
    description: "Whaley Middle School is where creativity meets technology. Our state-of-the-art computer lab gives every student access to digital tools, while our thriving art program has produced murals displayed throughout the community. The Whaley Community Garden teaches environmental stewardship and provides fresh produce for school meals.",
    principal: "Mr. James Patterson",
    highlights: ["Technology Lab", "Art Program", "Community Garden"],
    programs: ["Computer Lab", "Art", "Music", "Sports", "Garden Club", "Digital Media"],
    athletics: ["Basketball", "Soccer", "Track", "Volleyball"],
    clubs: ["Art Club", "Garden Club", "Tech Club", "Dance", "Drama"],
    achievements: ["Community Garden Award — Compton Green Initiative", "Student Art Featured in City Hall", "1:1 Chromebook Program"],
  },
  {
    slug: "davis-middle-school",
    name: "Davis Middle School",
    level: "middle_school",
    address: "501 S Santa Fe Ave, Compton, CA 90221",
    grades: "6-8",
    phone: "(310) 639-4311",
    district: "Compton Unified",
    mascot: "Dragons",
    colors: "Green & White",
    schoolColors: ["#059669", "#6EE7B7"],
    website: null,
    image: null,
    enrollment: 580,
    rating: 3.9,
    tagline: "Where Dragons Soar",
    established: 1958,
    description: "Davis Middle School has earned a reputation for academic excellence. Our reading program has helped students improve by an average of two grade levels in one year, and our Science Fair entries consistently win at the regional level. With a mentorship program pairing students with local professionals, Davis Dragons learn that success is always within reach.",
    principal: "Dr. Lisa Washington",
    highlights: ["Reading Champions", "Science Fair Winners", "Mentorship Program"],
    programs: ["Reading Lab", "Science Club", "Sports", "Mentorship", "Drama", "Music"],
    athletics: ["Basketball", "Track", "Soccer", "Cross Country"],
    clubs: ["Science Club", "Reading Club", "Drama", "Peer Mentors", "Student Government"],
    achievements: ["LA County Science Fair — 5 Blue Ribbons", "Reading Growth: 2 Grade Levels per Year", "Mentorship Program — 100+ Community Volunteers"],
  },
  {
    slug: "roosevelt-middle-school",
    name: "Roosevelt Middle School",
    level: "middle_school",
    address: "1200 E Compton Blvd, Compton, CA 90221",
    grades: "6-8",
    phone: "(310) 639-4316",
    district: "Compton Unified",
    mascot: "Rough Riders",
    colors: "Maroon & Gold",
    schoolColors: ["#9F1239", "#FCA5A5"],
    website: null,
    image: null,
    enrollment: 690,
    rating: 3.8,
    tagline: "Riders of Excellence",
    established: 1951,
    description: "Roosevelt Middle School carries a proud legacy. Named after Theodore Roosevelt, this school embodies the spirit of determination and courage. The music program has produced students who've gone on to perform professionally, while the basketball program feeds directly into Compton's legendary high school programs. Academic Decathlon success proves Rough Riders excel in the classroom too.",
    principal: "Mr. Anthony Davis",
    highlights: ["Music Program", "Basketball Legacy", "College Readiness Prep"],
    programs: ["Band", "Basketball", "Academic Decathlon", "Art", "Coding Club", "College Readiness"],
    athletics: ["Basketball", "Track", "Football", "Soccer"],
    clubs: ["Band", "Academic Decathlon", "Coding Club", "Art Club", "Book Club"],
    achievements: ["Academic Decathlon — District Champions", "Music Program — 3 Professional Alumni", "Basketball — Feeder to CIF Championship Programs"],
  },
  {
    slug: "bunche-middle-school",
    name: "Bunche Middle School",
    level: "middle_school",
    address: "12700 S Aranbe Ave, Compton, CA 90222",
    grades: "6-8",
    phone: null,
    district: "Compton Unified",
    mascot: "Bears",
    colors: "Brown & Gold",
    schoolColors: ["#78350F", "#D97706"],
    website: null,
    image: null,
    enrollment: 540,
    rating: 3.6,
    tagline: "Bears Build Bright Futures",
    established: 1965,
    description: "Named after Dr. Ralph Bunche, the first African American Nobel Peace Prize winner, Bunche Middle School carries a legacy of peace and excellence. Our enrichment programs focus on building the whole student — academically, socially, and emotionally. The peer mediation program has reduced disciplinary incidents by 40% and teaches conflict resolution skills that last a lifetime.",
    principal: "Ms. Karen Mitchell",
    highlights: ["Named for Nobel Peace Prize Winner", "Community Focus", "Enrichment Programs"],
    programs: ["After-School Program", "Music", "Sports", "Tutoring", "Peer Mediation", "Social-Emotional Learning"],
    athletics: ["Basketball", "Soccer", "Track", "Volleyball"],
    clubs: ["Peace Club", "Music", "Art", "Peer Mediators", "Student Council"],
    achievements: ["Peer Mediation — 40% Reduction in Incidents", "Named for Ralph Bunche — Nobel Peace Prize 1950", "Social-Emotional Learning Model School"],
  },
  {
    slug: "willowbrook-middle-school",
    name: "Willowbrook Middle School",
    level: "middle_school",
    address: "1600 E 120th St, Compton, CA 90222",
    grades: "6-8",
    phone: null,
    district: "Compton Unified",
    mascot: "Wolves",
    colors: "Silver & Black",
    schoolColors: ["#374151", "#9CA3AF"],
    website: null,
    image: null,
    enrollment: 610,
    rating: 3.7,
    tagline: "Wolves Run Together",
    established: 1960,
    description: "Willowbrook Middle School is a PBIS (Positive Behavioral Interventions and Supports) award-winning school that believes every student can succeed. With full technology integration in every classroom and an active PTA that drives community engagement, Willowbrook Wolves learn in an environment of respect and high expectations.",
    principal: "Mr. Carlos Ramirez",
    highlights: ["PBIS Award School", "Tech Integration", "Active PTA"],
    programs: ["Technology", "Sports", "Art", "Student Government", "Yearbook", "PBIS"],
    athletics: ["Basketball", "Track", "Soccer"],
    clubs: ["Student Government", "Yearbook", "Tech Club", "Art", "Volunteer Corps"],
    achievements: ["PBIS Gold Award School", "100% Classroom Technology Integration", "PTA Engagement Award — LA County"],
  },
  {
    slug: "tibby-elementary",
    name: "Tibby Elementary",
    level: "elementary",
    address: "621 N Burris Ave, Compton, CA 90221",
    grades: "K-5",
    phone: "(310) 639-4351",
    district: "Compton Unified",
    mascot: "Tigers",
    colors: "Orange & Black",
    schoolColors: ["#EA580C", "#FDBA74"],
    website: null,
    image: null,
    enrollment: 420,
    rating: 4.0,
    tagline: "Little Tigers, Big Dreams",
    established: 1948,
    description: "Tibby Elementary is where the love of learning begins. With a Reading Excellence Award and recognition as a Safe School, Tibby creates the nurturing environment every young learner needs. Our parent engagement programs make families part of the educational journey, creating a village that raises each child with care and ambition.",
    principal: "Ms. Diana Reyes",
    highlights: ["Reading Excellence Award", "Safe School Award", "Parent Engagement Leader"],
    programs: ["Reading Lab", "After-School Care", "Art", "Music", "Garden", "Parent Workshops"],
    clubs: ["Reading Club", "Art Club", "Garden Club", "Science Explorers"],
    achievements: ["Reading Excellence Award — 3 Consecutive Years", "Safe School Award — LAUSD", "Parent Engagement: 85% Participation Rate"],
  },
  {
    slug: "dickison-elementary",
    name: "Dickison Elementary",
    level: "elementary",
    address: "1424 E Pine St, Compton, CA 90221",
    grades: "K-5",
    phone: "(310) 639-4356",
    district: "Compton Unified",
    mascot: "Dolphins",
    colors: "Blue & Teal",
    schoolColors: ["#0284C7", "#67E8F9"],
    website: null,
    image: null,
    enrollment: 380,
    rating: 4.1,
    tagline: "Diving Into Learning",
    established: 1952,
    description: "Dickison Elementary stands out with its innovative Dual Language Program, where students become bilingual by 5th grade. Our STEM focus introduces coding and robotics as early as kindergarten, and a deeply engaged community makes Dickison feel like family. Dolphins dive deep into learning every day.",
    principal: "Mr. Miguel Santos",
    highlights: ["STEM Focus", "Dual Language Program", "Active Community"],
    programs: ["STEM", "Dual Language", "After-School", "Music", "Physical Ed", "Coding K-5"],
    clubs: ["Coding Club", "Reading Buddies", "Science Club", "Art"],
    achievements: ["Dual Language Program — Bilingual by 5th Grade", "STEM: Coding from Kindergarten", "Community Engagement Award"],
  },
  {
    slug: "anderson-elementary",
    name: "Anderson Elementary",
    level: "elementary",
    address: "515 W Alondra Blvd, Compton, CA 90220",
    grades: "K-5",
    phone: "(310) 639-4361",
    district: "Compton Unified",
    mascot: "Eagles",
    colors: "Red & Blue",
    schoolColors: ["#DC2626", "#3B82F6"],
    website: null,
    image: null,
    enrollment: 410,
    rating: 3.9,
    tagline: "Eagles Soar High",
    established: 1946,
    description: "Anderson Elementary builds character alongside academics. Our Character Counts program teaches values of respect, responsibility, and caring, while the Science Garden gives students hands-on experience with nature and nutrition. Family Nights bring the whole community together for learning, fun, and celebration.",
    principal: "Ms. Sharon Brooks",
    highlights: ["Character Counts Program", "Science Garden", "Family Nights"],
    programs: ["Character Ed", "Science Garden", "Sports", "Tutoring", "PTA Events", "Family Nights"],
    clubs: ["Garden Club", "Character Club", "Sports", "Art"],
    achievements: ["Character Counts Award School", "Science Garden — Fresh Produce for Cafeteria", "Monthly Family Night — 200+ Attendees"],
  },
  {
    slug: "emerson-elementary",
    name: "Emerson Elementary",
    level: "elementary",
    address: "421 N Bradfield Ave, Compton, CA 90221",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Stars",
    colors: "Gold & Navy",
    schoolColors: ["#D97706", "#1E3A5F"],
    website: null,
    image: null,
    enrollment: 350,
    rating: 3.8,
    tagline: "Every Child a Star",
    established: 1955,
    description: "Emerson Elementary lives by its motto: every child is a star. With some of the smallest class sizes in the district, students get the individual attention they deserve. Arts integration brings creativity into every subject, making learning an experience that ignites imagination and builds confidence.",
    principal: "Dr. April Johnson",
    highlights: ["Arts Integration", "Small Class Sizes", "Caring Staff"],
    programs: ["Arts", "Reading", "Math Lab", "Music", "After-School"],
    clubs: ["Art Stars", "Reading Club", "Music", "Dance"],
    achievements: ["Smallest Class Sizes in District (22:1)", "Arts Integration Model School", "Staff Satisfaction: 95%"],
  },
  {
    slug: "washington-elementary",
    name: "Washington Elementary",
    level: "elementary",
    address: "1100 W Compton Blvd, Compton, CA 90220",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Lions",
    colors: "Gold & Green",
    schoolColors: ["#CA8A04", "#16A34A"],
    website: null,
    image: null,
    enrollment: 440,
    rating: 4.0,
    tagline: "Where Lions Learn to Lead",
    established: 1941,
    description: "Washington Elementary is one of the oldest and most respected elementary schools in Compton. Our Leadership Program starts developing confident, articulate young leaders from kindergarten. With bilingual staff serving our diverse community and a modern library that's the heart of the school, Washington Lions are always learning to lead.",
    principal: "Ms. Rosa Martinez",
    highlights: ["Leadership Program", "Bilingual Staff", "Modern Library"],
    programs: ["Leadership", "Library Program", "ESL", "Music", "Physical Ed", "Bilingual Services"],
    clubs: ["Leadership Club", "Library Helpers", "Music", "Sports"],
    achievements: ["Leadership Program — Featured in EdWeek", "Bilingual Services for 100% of Families", "Modern Library — 10,000+ Books"],
  },
  {
    slug: "mckinley-elementary",
    name: "McKinley Elementary",
    level: "elementary",
    address: "2909 E Caldwell St, Compton, CA 90221",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Mustangs",
    colors: "Red & Black",
    schoolColors: ["#B91C1C", "#374151"],
    website: null,
    image: null,
    enrollment: 390,
    rating: 3.7,
    tagline: "Mustangs Gallop Toward Success",
    established: 1950,
    description: "McKinley Elementary is galloping into the future. With a Math Achievement Award and a brand-new playground, Mustangs have every reason to be excited about school. Our anti-bullying program creates a safe space where every student can thrive, and our coding program introduces computer science in a fun, accessible way.",
    principal: "Mr. Derek Thomas",
    highlights: ["Math Achievement Award", "Anti-Bullying Champion", "New Playground"],
    programs: ["Math Enrichment", "Anti-Bullying", "Sports", "Dance", "Coding"],
    clubs: ["Math Stars", "Coding", "Dance", "Art", "Peace Patrol"],
    achievements: ["Math Achievement Award — District", "Anti-Bullying Champion School", "New Playground — Opened 2024"],
  },
  {
    slug: "bursch-elementary",
    name: "Bursch Elementary",
    level: "elementary",
    address: "1711 S Burris Ave, Compton, CA 90221",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Bobcats",
    colors: "Teal & Silver",
    schoolColors: ["#0D9488", "#94A3B8"],
    website: null,
    image: null,
    enrollment: 360,
    rating: 3.8,
    tagline: "Bobcats Building Bright Futures",
    established: 1957,
    description: "Bursch Elementary's Wellness Program sets it apart — physical fitness, nutrition education, and mindfulness are woven into the daily routine. Technology integration means every classroom has modern learning tools, and parent workshops ensure families have the resources to support learning at home.",
    principal: "Ms. Tanya Harris",
    highlights: ["Technology Integration", "Wellness Program", "Parent Workshops"],
    programs: ["Tech Lab", "Wellness", "Reading", "Art", "After-School", "Parent Workshops"],
    clubs: ["Wellness Club", "Tech Explorers", "Art", "Reading"],
    achievements: ["Wellness Program — Model for District", "1:1 Device Program", "Parent Workshop Series — Monthly"],
  },
  {
    slug: "mayo-elementary",
    name: "Mayo Elementary",
    level: "elementary",
    address: "2600 W Caldwell St, Compton, CA 90220",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Hawks",
    colors: "Green & Gold",
    schoolColors: ["#15803D", "#EAB308"],
    website: null,
    image: null,
    enrollment: 370,
    rating: 3.9,
    tagline: "Hawks Take Flight",
    established: 1949,
    description: "Mayo Elementary is Compton's greenest school. The Environmental Education program includes a working garden, composting, and recycling initiatives that have made Mayo a model for sustainability. Our music program brings joy every day, and community events like the annual Harvest Festival make Mayo a neighborhood gathering place.",
    principal: "Mr. Paul Green",
    highlights: ["Green School Initiative", "Music Program", "Community Events"],
    programs: ["Environmental Ed", "Music", "Sports", "Gardening", "Tutoring", "Harvest Festival"],
    clubs: ["Garden Club", "Eco Warriors", "Music", "Sports"],
    achievements: ["Green School Award — California", "Harvest Festival — 500+ Attendees", "Composting Program — Zero Waste Goal"],
  },
  {
    slug: "kelly-elementary",
    name: "Kelly Elementary",
    level: "elementary",
    address: "1428 N Paulsen Ave, Compton, CA 90222",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Knights",
    colors: "Purple & Silver",
    schoolColors: ["#7C3AED", "#CBD5E1"],
    website: null,
    image: null,
    enrollment: 340,
    rating: 3.8,
    tagline: "Little Knights, Big Hearts",
    established: 1953,
    description: "Kelly Elementary proves that big hearts create big futures. Our Character Education program has been recognized at the county level, and the annual Talent Show is the most anticipated event of the year. Reading Champions compete in district-wide competitions, building a love of literacy that lasts a lifetime.",
    principal: "Dr. Barbara King",
    highlights: ["Character Education", "Reading Champions", "Talent Show"],
    programs: ["Character Ed", "Reading", "Art", "Music", "Physical Ed", "Talent Show"],
    clubs: ["Reading Champions", "Character Club", "Talent Show", "Art"],
    achievements: ["Character Education Award — LA County", "Reading Champions — District Finals", "Annual Talent Show — 20 Year Tradition"],
  },
  {
    slug: "jefferson-elementary",
    name: "Jefferson Elementary",
    level: "elementary",
    address: "1424 W 145th St, Compton, CA 90220",
    grades: "K-5",
    phone: null,
    district: "Compton Unified",
    mascot: "Jaguars",
    colors: "Black & Gold",
    schoolColors: ["#1F2937", "#EAB308"],
    website: null,
    image: null,
    enrollment: 380,
    rating: 3.7,
    tagline: "Jaguars on the Prowl for Knowledge",
    established: 1947,
    description: "Jefferson Elementary's STEAM Fridays are legendary — every Friday afternoon, the whole school engages in science, technology, engineering, arts, and math projects that make learning an adventure. Family Reading Night brings parents and children together over books, and the Literacy Focus ensures every Jaguar reads at or above grade level by 3rd grade.",
    principal: "Ms. Debra Coleman",
    highlights: ["Literacy Focus", "STEAM Fridays", "Family Reading Night"],
    programs: ["STEAM", "Literacy", "Sports", "Drama", "After-School", "Family Reading Night"],
    clubs: ["STEAM Club", "Drama", "Reading", "Sports"],
    achievements: ["STEAM Fridays — Model Program", "3rd Grade Reading Goal: 90% at Grade Level", "Family Reading Night — Monthly Tradition"],
  },
  {
    slug: "compton-college",
    name: "Compton College",
    level: "college",
    address: "1111 E Artesia Blvd, Compton, CA 90221",
    grades: "Community College",
    phone: "(310) 900-1600",
    district: null,
    mascot: "Tartars",
    colors: "Blue & Gold",
    schoolColors: ["#1D4ED8", "#F2A900"],
    website: "compton.edu",
    image: "/images/generated/compton-college.png",
    enrollment: 8500,
    rating: 4.3,
    tagline: "Your Future Starts Here",
    established: 1927,
    description: "Compton College is more than a school — it's a launchpad. The Compton Promise provides free tuition for all Compton Unified graduates, removing financial barriers to higher education. With newly accredited status, state-of-the-art facilities, and transfer agreements with UC and CSU schools, Compton College transforms lives every day. From nursing to welding, business to child development, there's a path for everyone.",
    principal: "Dr. Keith Curry (President)",
    highlights: ["Newly Accredited", "Free Tuition (Compton Promise)", "State-of-the-Art Facilities"],
    programs: ["Transfer Programs", "Nursing", "Welding", "Business", "Child Development", "Athletics", "Financial Aid", "Tutoring Center"],
    notableAlumni: ["Kendrick Lamar", "Serena Williams"],
    athletics: ["Basketball", "Track & Field", "Baseball", "Soccer", "Cross Country"],
    clubs: ["Student Government", "Black Student Union", "STEM Club", "Business Club", "Nursing Students Association", "International Club"],
    achievements: ["Compton Promise — Free Tuition Since 2017", "Newly Accredited — Full ACCJC Status", "Transfer Rate to UC/CSU — Up 35%", "8,500+ Students Served Annually"],
  },
];

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try to fetch school from DB first, fall back to static data
  let school: School | undefined;
  try {
    const { data: dbSchool } = await supabase
      .from("schools")
      .select("*")
      .eq("slug", id)
      .single();

    if (dbSchool) {
      // colors is stored as [{hex, name},...] in DB but page expects a string
      const colorsStr = Array.isArray(dbSchool.colors)
        ? dbSchool.colors.map((c: { name: string }) => c.name).join(" & ")
        : dbSchool.colors || null;

      // schoolColors stored in metadata.schoolColors or derive from colors array
      const meta = dbSchool.metadata as { schoolColors?: [string, string] } | null;
      const schoolColors: [string, string] = meta?.schoolColors
        ?? (Array.isArray(dbSchool.colors) && dbSchool.colors.length >= 2
          ? [dbSchool.colors[0].hex, dbSchool.colors[1].hex]
          : ["#F2A900", "#3B82F6"]);

      school = {
        slug: dbSchool.slug,
        name: dbSchool.name,
        level: dbSchool.level || "high_school",
        address: dbSchool.address || "",
        grades: dbSchool.grades || "",
        phone: dbSchool.phone || null,
        district: dbSchool.district || null,
        mascot: dbSchool.mascot || null,
        colors: colorsStr,
        schoolColors,
        website: dbSchool.website || null,
        image: dbSchool.image_url || null,
        enrollment: dbSchool.enrollment || 0,
        rating: dbSchool.rating || 0,
        tagline: dbSchool.tagline || "",
        highlights: dbSchool.highlights || [],
        programs: dbSchool.programs || [],
        notableAlumni: dbSchool.notable_alumni || undefined,
        established: dbSchool.established || 0,
        description: dbSchool.metadata?.description || "",
        principal: dbSchool.principal || "",
        athletics: dbSchool.athletics || undefined,
        clubs: dbSchool.clubs || undefined,
        achievements: dbSchool.metadata?.achievements || undefined,
      };
    }
  } catch {
    // DB might not have schools table yet — fall back to static
  }

  // Fallback to static data if not found in DB
  if (!school) {
    school = schools.find((s) => s.slug === id);
  }

  if (!school) notFound();

  const color = levelColors[school.level];

  // Extract a short search name for fuzzy matching
  const searchName = school.name.split(" ").slice(0, 2).join(" ");

  // Fetch matching channel
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .ilike("name", `%${searchName}%`)
    .eq("is_active", true)
    .limit(1);

  const channel = channels && channels.length > 0 ? channels[0] : null;

  // Active live streams
  let activeStreams: Array<{
    id: string;
    title: string;
    status: string;
    viewer_count: number;
    mux_playback_id: string | null;
  }> = [];
  if (channel) {
    const { data: streams } = await supabase
      .from("live_streams")
      .select("id, title, status, viewer_count, mux_playback_id")
      .eq("channel_id", channel.id)
      .eq("status", "active")
      .limit(3);
    activeStreams = streams ?? [];
  }

  // Upcoming events
  const today = new Date().toISOString().split("T")[0];
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date, start_time, location_name, category")
    .eq("is_published", true)
    .gte("start_date", today)
    .or(
      `title.ilike.%${searchName}%,description.ilike.%${searchName}%,category.eq.school`
    )
    .order("start_date")
    .limit(3);

  // Related posts
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, body, created_at, author:profiles!posts_author_id_fkey(id, display_name, avatar_url)"
    )
    .eq("is_published", true)
    .ilike("body", `%${searchName}%`)
    .order("created_at", { ascending: false })
    .limit(3);

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(school.address)}`;

  // Check if current user is a school admin (for showing composer)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSchoolAdmin = false;
  if (user) {
    // Platform admins always have access
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin" || profile?.role === "city_official" || profile?.role === "city_ambassador") {
      isSchoolAdmin = true;
    } else {
      // Check school_admins table — need the DB school id
      const { data: dbSchool } = await supabase
        .from("schools")
        .select("id")
        .eq("slug", school.slug)
        .single();

      if (dbSchool) {
        const { data: adminCheck } = await supabase
          .from("school_admins")
          .select("id")
          .eq("school_id", dbSchool.id)
          .eq("user_id", user.id)
          .limit(1);

        isSchoolAdmin = (adminCheck && adminCheck.length > 0) || false;
      }
    }
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {school.image ? (
          <Image
            src={school.image}
            alt={school.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: `linear-gradient(135deg, ${school.schoolColors[0]}, ${school.schoolColors[1]}40, #0A0A0A)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-transparent" />

        {/* Floating nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <Link
            href="/schools"
            className="w-10 h-10 rounded-full glass flex items-center justify-center border border-white/10 press"
          >
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 14L8 9l4-5" />
            </svg>
          </Link>
          {school.website && (
            <a
              href={`https://${school.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-full glass flex items-center gap-2 px-4 border border-white/10 press text-[12px] font-semibold"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
              </svg>
              Website
            </a>
          )}
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${color}25`, color, border: `1px solid ${color}35` }}
            >
              {levelLabels[school.level]}
            </span>
            <span className="text-[10px] text-white/40">Est. {school.established}</span>
          </div>
          <h1 className="font-display text-2xl font-bold leading-tight mb-1">
            {school.name}
          </h1>
          <p className="text-sm text-white/60 italic">&ldquo;{school.tagline}&rdquo;</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-5 -mt-2 mb-5 relative z-10">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border-subtle rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-heading" style={{ color }}>{school.enrollment.toLocaleString()}</p>
            <p className="text-[9px] text-white/40 uppercase tracking-wider">Students</p>
          </div>
          <div className="bg-card border border-border-subtle rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill={star <= Math.round(school.rating) ? "#F2A900" : "none"}
                  stroke={star <= Math.round(school.rating) ? "#F2A900" : "rgba(255,255,255,0.15)"}
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-[9px] text-white/40 uppercase tracking-wider">{school.rating} Rating</p>
          </div>
          <div className="bg-card border border-border-subtle rounded-xl p-3 text-center">
            <p className="text-lg font-bold font-heading text-emerald">{school.grades}</p>
            <p className="text-[9px] text-white/40 uppercase tracking-wider">Grades</p>
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      {isSchoolAdmin && (
        <div className="px-5 mb-5">
          <div className="bg-gold/5 border border-gold/15 rounded-xl p-3">
            <p className="text-[10px] text-gold font-bold uppercase tracking-wider mb-2">Admin Actions</p>
            <div className="flex gap-2">
              <Link
                href="/admin/events/new"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/10 text-gold text-[11px] font-semibold press hover:bg-gold/20 transition-colors"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 2v8M2 6h8" />
                </svg>
                Create Event
              </Link>
              <Link
                href="/profile/edit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-[11px] font-semibold press hover:bg-white/10 transition-colors"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" />
                </svg>
                Edit Profile
              </Link>
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-[11px] font-semibold press hover:bg-white/10 transition-colors"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="1" width="4" height="4" rx="1" />
                  <rect x="7" y="1" width="4" height="4" rx="1" />
                  <rect x="1" y="7" width="4" height="4" rx="1" />
                  <rect x="7" y="7" width="4" height="4" rx="1" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="px-5">
        {/* Mascot & Colors banner */}
        {school.mascot && (
          <div
            className="rounded-xl p-4 mb-5 flex items-center gap-4 border"
            style={{
              background: `linear-gradient(135deg, ${school.schoolColors[0]}15, ${school.schoolColors[1]}08)`,
              borderColor: `${school.schoolColors[0]}20`,
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${school.schoolColors[0]}25` }}
            >
              <span className="text-2xl font-bold font-heading" style={{ color: school.schoolColors[0] }}>
                {school.mascot[0]}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-heading font-bold text-base">{school.mascot}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ background: school.schoolColors[0] }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: school.schoolColors[1] }} />
                </div>
                <span className="text-[11px] text-white/50">{school.colors}</span>
              </div>
            </div>
            {school.district && (
              <span className="text-[10px] text-white/30 bg-white/[0.04] rounded-full px-3 py-1 border border-white/[0.06]">
                {school.district}
              </span>
            )}
          </div>
        )}

        {/* About */}
        <section className="mb-6">
          <h2 className="font-heading font-bold text-base mb-2 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: color }} />
            About {school.name.split(" ").slice(0, -1).join(" ")}
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed">
            {school.description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40" strokeLinecap="round">
                <path d="M12 12a5 5 0 10-10 0v1h10v-1zM7 5a3 3 0 116 0 3 3 0 01-6 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] text-white/40">Principal</p>
              <p className="text-[12px] font-semibold">{school.principal}</p>
            </div>
          </div>
        </section>

        {/* Achievements */}
        {school.achievements && school.achievements.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              Achievements
            </h2>
            <div className="space-y-2">
              {school.achievements.map((achievement) => (
                <div
                  key={achievement}
                  className="flex items-start gap-3 bg-gold/[0.04] rounded-xl p-3 border border-gold/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#F2A900" stroke="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <p className="text-[12px] text-white/70 leading-relaxed pt-1">{achievement}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Programs */}
        <section className="mb-6">
          <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: color }} />
            Programs & Academics
          </h2>
          <div className="flex flex-wrap gap-2">
            {school.programs.map((program) => (
              <span
                key={program}
                className="text-[12px] font-medium rounded-full px-3 py-1.5 border"
                style={{
                  background: `${color}10`,
                  color: `${color}CC`,
                  borderColor: `${color}20`,
                }}
              >
                {program}
              </span>
            ))}
          </div>
        </section>

        {/* Athletics */}
        {school.athletics && school.athletics.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-emerald" />
              Athletics
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {school.athletics.map((sport) => (
                <div
                  key={sport}
                  className="flex items-center gap-2 bg-emerald/[0.04] rounded-xl p-2.5 border border-emerald/10"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald/15 flex items-center justify-center shrink-0">
                    <svg width="10" height="10" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M2 5h6M5 2v6" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-medium text-white/70">{sport}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Clubs */}
        {school.clubs && school.clubs.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-hc-purple" />
              Clubs & Activities
            </h2>
            <div className="flex flex-wrap gap-2">
              {school.clubs.map((club) => (
                <span
                  key={club}
                  className="text-[11px] font-medium text-white/60 bg-hc-purple/[0.06] rounded-full px-3 py-1.5 border border-hc-purple/15"
                >
                  {club}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Notable Alumni */}
        {school.notableAlumni && school.notableAlumni.length > 0 && (
          <section className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              Notable Alumni
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {school.notableAlumni.map((alum) => (
                <div
                  key={alum}
                  className="flex items-center gap-3 bg-gold/[0.04] rounded-xl p-3 border border-gold/10"
                >
                  <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gold">{alum.split(" ").map(w => w[0]).join("")}</span>
                  </div>
                  <p className="text-[12px] font-semibold leading-tight">{alum}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="divider-subtle mb-6" />

        {/* Contact & Location */}
        <section className="mb-6">
          <h2 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ background: color }} />
            Contact & Location
          </h2>
          <div className="bg-card rounded-2xl border border-border-subtle overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {/* Address */}
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 press"
              >
                <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 11c0 3-4 6-4 6s-4-3-4-6a4 4 0 118 0z" />
                    <circle cx="8" cy="11" r="1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold">{school.address}</p>
                  <p className="text-[10px] text-gold mt-0.5">Get Directions</p>
                </div>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" strokeLinecap="round">
                  <path d="M5 3l4 4-4 4" />
                </svg>
              </a>

              {/* Phone */}
              {school.phone && (
                <a href={`tel:${school.phone}`} className="flex items-center gap-3 p-4 press">
                  <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold">{school.phone}</p>
                    <p className="text-[10px] text-gold mt-0.5">Call School</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" strokeLinecap="round">
                    <path d="M5 3l4 4-4 4" />
                  </svg>
                </a>
              )}

              {/* Website */}
              {school.website && (
                <a
                  href={`https://${school.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 press"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M2 8h12M8 2a10 10 0 014 6 10 10 0 01-4 6 10 10 0 01-4-6 10 10 0 014-6z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold">{school.website}</p>
                    <p className="text-[10px] text-gold mt-0.5">Visit Website</p>
                  </div>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" strokeLinecap="round">
                    <path d="M5 3l4 4-4 4" />
                  </svg>
                </a>
              )}

              {/* Principal */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-hc-purple/10 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 12a5 5 0 10-10 0v1h10v-1zM7 5a3 3 0 116 0 3 3 0 01-6 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-white/40">Principal</p>
                  <p className="text-[12px] font-semibold">{school.principal}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold press transition-colors text-midnight"
            style={{ background: color }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 11c0 3-4 6-4 6s-4-3-4-6a4 4 0 118 0z" />
              <circle cx="8" cy="11" r="1" />
            </svg>
            Directions
          </a>
          {school.phone && (
            <a
              href={`tel:${school.phone}`}
              className="flex-1 flex items-center justify-center gap-2 bg-white/10 rounded-full py-3 text-sm font-medium press border border-white/10"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
              </svg>
              Call
            </a>
          )}
        </div>

        <div className="divider-subtle mb-6" />

        {/* Hub City TV Channel */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-pink" />
              Hub City TV
            </h2>
            {channel && (
              <Link href={`/live/channel/${channel.id}`} className="text-[11px] text-gold font-semibold press">
                View Channel
              </Link>
            )}
          </div>

          {channel ? (
            <>
              <Link href={`/live/channel/${channel.id}`}>
                <div className="bg-card rounded-2xl border border-border-subtle p-4 press transition-all hover:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink/20 to-hc-purple/20 flex items-center justify-center shrink-0 border border-border-subtle overflow-hidden">
                      {channel.avatar_url ? (
                        <img src={channel.avatar_url} alt={channel.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg width="20" height="20" fill="none" stroke="#FF006E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="16" height="11" rx="2" />
                          <path d="M10 5V3M6 5V4M14 5V4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[13px] truncate">{channel.name}</p>
                      {channel.description && (
                        <p className="text-[11px] text-white/40 truncate">{channel.description}</p>
                      )}
                    </div>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20 shrink-0" strokeLinecap="round">
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </div>
                </div>
              </Link>

              {activeStreams.length > 0 && (
                <div className="mt-3 space-y-2">
                  {activeStreams.map((stream) => (
                    <div key={stream.id} className="bg-card rounded-xl border border-compton-red/20 p-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 bg-compton-red/15 border border-compton-red/20 rounded-full px-2.5 py-1 text-[10px] font-semibold text-compton-red uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
                          Live
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{stream.title}</p>
                          <p className="text-[10px] text-white/40">{stream.viewer_count} watching</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeStreams.length === 0 && (
                <p className="text-[11px] text-white/30 mt-2">No live streams right now. Check back for upcoming broadcasts.</p>
              )}
            </>
          ) : (
            <div className="bg-card rounded-2xl border border-border-subtle p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 border border-border-subtle">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="16" height="11" rx="2" />
                    <path d="M10 5V3M6 5V4M14 5V4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-white/40">Channel Coming Soon</p>
                  <p className="text-[11px] text-white/25">Hub City TV channel for this school is on the way</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Upcoming Events */}
        <section className="mb-6">
          <div className="divider-subtle mb-6" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-coral" />
              Upcoming Events
            </h2>
            <Link href="/events" className="text-[11px] text-gold font-semibold press">
              All Events
            </Link>
          </div>

          {events && events.length > 0 ? (
            <div className="space-y-2.5">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="bg-card rounded-xl border border-border-subtle p-3 press transition-all hover:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-14 rounded-lg bg-midnight/50 border border-border-subtle flex flex-col items-center justify-center shrink-0">
                        <p className="text-[9px] text-gold font-bold uppercase leading-none">
                          {new Date(event.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-base font-bold leading-none mt-0.5">
                          {new Date(event.start_date + "T00:00:00").getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[13px] truncate">{event.title}</p>
                        {event.location_name && (
                          <p className="text-[11px] text-white/40 truncate">{event.location_name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border-subtle p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="14" height="13" rx="2" />
                  <path d="M3 8h14M7 2v4M13 2v4" />
                </svg>
              </div>
              <p className="text-[13px] text-white/40">No upcoming events</p>
              <p className="text-[11px] text-white/25 mt-0.5">School events will appear here when posted</p>
            </div>
          )}
        </section>

        {/* School News */}
        <section className="mb-6">
          <div className="divider-subtle mb-6" />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-cyan" />
              School News
            </h2>
            <Link href="/pulse" className="text-[11px] text-gold font-semibold press">
              City Pulse
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="space-y-2.5">
              {posts.map((post) => {
                const authorArr = post.author as unknown as Array<{
                  id: string;
                  display_name: string;
                  avatar_url: string | null;
                }> | null;
                const author = authorArr?.[0] ?? null;
                return (
                  <div key={post.id} className="bg-card rounded-xl border border-border-subtle p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center text-[9px] font-bold text-gold overflow-hidden">
                        {author?.avatar_url ? (
                          <img src={author.avatar_url} alt={author.display_name} className="w-full h-full object-cover" />
                        ) : (
                          author?.display_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2) ?? "?"
                        )}
                      </div>
                      <p className="text-[12px] font-bold">{author?.display_name ?? "Community Member"}</p>
                      <span className="text-[10px] text-white/30 ml-auto">
                        {new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <p className="text-[12px] text-white/50 leading-relaxed line-clamp-3">{post.body}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border-subtle p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round">
                  <path d="M4 4h12M4 8h8M4 12h10" />
                </svg>
              </div>
              <p className="text-[13px] text-white/40">No school news yet</p>
              <p className="text-[11px] text-white/25 mt-0.5">Posts mentioning this school will appear here</p>
            </div>
          )}
        </section>

        {/* Enrollment CTA */}
        <section className="mb-8">
          <div
            className="relative overflow-hidden rounded-2xl p-5 border"
            style={{
              background: `linear-gradient(135deg, ${color}10, ${color}03)`,
              borderColor: `${color}20`,
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <svg viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1">
                <circle cx="80" cy="20" r="50" />
                <circle cx="80" cy="20" r="30" />
              </svg>
            </div>
            <div className="relative">
              <h3 className="font-heading font-bold text-lg mb-1">Interested in Enrolling?</h3>
              <p className="text-[12px] text-white/50 leading-relaxed mb-4">
                Contact {school.name} to learn about enrollment, tours, and open house events. Every student deserves a great education.
              </p>
              <div className="flex gap-3">
                {school.phone && (
                  <a
                    href={`tel:${school.phone}`}
                    className="flex items-center gap-2 rounded-full px-4 py-2.5 text-[12px] font-bold press text-midnight"
                    style={{ background: color }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72" />
                    </svg>
                    Call to Enroll
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5 text-[12px] font-medium press border border-white/10"
                >
                  Visit Campus
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* School Posts — Instagram-style grid */}
        <SchoolPostGrid
          schoolSlug={school.slug}
          schoolName={school.name}
          schoolColor={school.schoolColors[0]}
          isSchoolAdmin={isSchoolAdmin}
        />
      </div>
    </div>
  );
}
