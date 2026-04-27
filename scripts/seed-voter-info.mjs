import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fahqtnwwikvocpvvfgqi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ"
);

// Placeholder polling locations across Compton's 4 council districts.
// Replace with actual precincts ahead of the next live election cycle —
// this is enough for /city-hall/vote to render meaningful data on day 1.
const POLLING_LOCATIONS = [
  {
    district: 1,
    name: "Compton City Hall",
    address: "205 S Willowbrook Ave, Compton, CA 90220",
    latitude: 33.8959,
    longitude: -118.22,
    hours_text: "Election day: 7am – 8pm",
    is_accessible: true,
  },
  {
    district: 2,
    name: "Dollarhide Community Center",
    address: "1108 N Oleander Ave, Compton, CA 90222",
    latitude: 33.91,
    longitude: -118.226,
    hours_text: "Election day: 7am – 8pm",
    is_accessible: true,
  },
  {
    district: 3,
    name: "Lueders Park Community Center",
    address: "1500 W Rosecrans Ave, Compton, CA 90222",
    latitude: 33.9019,
    longitude: -118.249,
    hours_text: "Election day: 7am – 8pm",
    is_accessible: true,
  },
  {
    district: 4,
    name: "Compton Library (Branch)",
    address: "240 W Compton Blvd, Compton, CA 90220",
    latitude: 33.8965,
    longitude: -118.2235,
    hours_text: "Election day: 7am – 8pm",
    is_accessible: true,
  },
];

// One placeholder upcoming election — adjust real date/registration deadline
// once the city clerk publishes the next municipal cycle.
const ELECTION = {
  slug: "compton-municipal-2026",
  name: "Compton Municipal Election (2026)",
  election_date: "2026-11-03",
  registration_deadline: "2026-10-19",
  type: "general",
  description:
    "City Council seats and the next round of school board appointments. Polls open across all four districts.",
  info_url: "https://lavote.gov/",
  is_published: true,
};

const CANDIDATES = [
  {
    name: "Council Seat — TBD",
    office: "City Council, District 1",
    party: null,
    bio: "Filings open soon.",
    photo_url: null,
    website: null,
    display_order: 1,
  },
  {
    name: "Council Seat — TBD",
    office: "City Council, District 3",
    party: null,
    bio: "Filings open soon.",
    photo_url: null,
    website: null,
    display_order: 2,
  },
];

async function run() {
  console.log("→ Seeding polling_locations…");
  for (const p of POLLING_LOCATIONS) {
    const { error } = await supabase.from("polling_locations").upsert(p, {
      onConflict: "name",
    });
    if (error && error.code !== "23505") {
      console.error("  polling insert failed:", p.name, error.message);
    } else {
      console.log("  ✓", p.name);
    }
  }

  console.log("→ Seeding election…");
  const { data: el, error: elErr } = await supabase
    .from("elections")
    .upsert(ELECTION, { onConflict: "slug" })
    .select()
    .single();
  if (elErr) {
    console.error("  election insert failed:", elErr.message);
    return;
  }
  console.log("  ✓", el.name);

  console.log("→ Seeding candidates…");
  for (const c of CANDIDATES) {
    const { error } = await supabase
      .from("candidates")
      .upsert(
        { ...c, election_id: el.id },
        { onConflict: "election_id,office,name" },
      );
    if (error) console.error("  candidate failed:", c.office, error.message);
    else console.log("  ✓", c.office, "—", c.name);
  }

  console.log("Done. Visit /city-hall/vote to verify.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
