import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Culture AI, the local guide for Compton, CA inside the Culture app.
Residents ask you natural-language questions like "where can I get a burrito" or "free food near me" or "best park for kids".

RULES:
- Answer ONLY using the provided database. Never invent places.
- Be warm, concise, and specific. Keep text under 200 words.
- When you find matches, include the exact place name, address, and why it fits.
- For food/restaurant queries, mention cuisine and any ratings.
- For help/resource queries (free food, shelters, clinics), prioritize free/low-cost options.
- If nothing matches, say so and suggest what sections to browse.

CRITICAL: You MUST also return a JSON array of matched place IDs so we can highlight them on the map.
Your response MUST be valid JSON in this exact format:
{
  "message": "Your friendly response text here with details about each place",
  "places": [
    { "id": "uuid-here", "name": "Place Name", "type": "business" }
  ]
}

The "places" array should contain every place you mention, using the exact id from the database.
If no places match, return an empty places array.
Only return valid JSON, nothing else.`;

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query is required (min 2 chars)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key") {
      return NextResponse.json({
        message: `I'd love to help you find "${query}" in Compton! AI search is being configured. Try browsing the map categories for now.`,
        places: [],
        source: "mock",
      });
    }

    const supabase = await createClient();
    const contextParts: string[] = [];

    // Businesses — core for most queries
    const { data: businesses } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, category, business_type, business_sub_type, description, address, latitude, longitude, phone, rating_avg, badges, is_featured, is_open, hours"
      )
      .eq("is_published", true)
      .not("latitude", "is", null)
      .order("rating_avg", { ascending: false })
      .limit(60);

    if (businesses?.length) {
      contextParts.push("## BUSINESSES (type: business):");
      for (const b of businesses) {
        contextParts.push(
          `- ID:${b.id} | ${b.name} (${b.category}${b.business_type ? `, ${b.business_type}` : ""}${b.business_sub_type ? `, ${b.business_sub_type}` : ""}) | ${b.address ?? "No address"} | Rating: ${b.rating_avg ?? "N/A"}/5${b.is_open ? " | OPEN NOW" : ""}${b.phone ? ` | ${b.phone}` : ""}${b.badges?.length ? ` | Tags: ${b.badges.join(", ")}` : ""} | ${b.description?.slice(0, 80) ?? ""}`
        );
      }
    }

    // Health resources
    const { data: health } = await supabase
      .from("health_resources")
      .select(
        "id, name, slug, category, organization, description, address, latitude, longitude, phone, is_free, accepts_medi_cal, is_emergency, hours"
      )
      .eq("is_published", true)
      .not("latitude", "is", null)
      .limit(30);

    if (health?.length) {
      contextParts.push("\n## HEALTH RESOURCES (type: health):");
      for (const h of health) {
        contextParts.push(
          `- ID:${h.id} | ${h.name} (${h.category}) | ${h.address ?? ""} | ${h.organization ?? ""}${h.is_free ? " | FREE" : ""}${h.accepts_medi_cal ? " | Medi-Cal" : ""}${h.is_emergency ? " | EMERGENCY" : ""}${h.phone ? ` | ${h.phone}` : ""} | ${h.description?.slice(0, 80) ?? ""}`
        );
      }
    }

    // Community resources (shelters, food banks, programs)
    const { data: resources } = await supabase
      .from("resources")
      .select(
        "id, name, category, organization, description, status, is_free, eligibility, address, latitude, longitude"
      )
      .eq("is_published", true)
      .limit(30);

    if (resources?.length) {
      contextParts.push("\n## COMMUNITY RESOURCES (type: resource):");
      for (const r of resources) {
        const hasCoords = r.latitude && r.longitude;
        contextParts.push(
          `- ID:${r.id} | ${r.name} by ${r.organization ?? "Unknown"} (${r.category}) | ${r.address ?? "No address"}${hasCoords ? "" : " | NO MAP COORDS"}${r.is_free ? " | FREE" : ""} | ${r.description?.slice(0, 80) ?? ""}${r.eligibility ? ` | Eligibility: ${r.eligibility.slice(0, 60)}` : ""}`
        );
      }
    }

    // Schools
    const { data: schools } = await supabase
      .from("schools")
      .select(
        "id, name, slug, school_type, grade_range, address, latitude, longitude, phone, rating, enrollment"
      )
      .eq("is_published", true)
      .not("latitude", "is", null)
      .limit(30);

    if (schools?.length) {
      contextParts.push("\n## SCHOOLS (type: school):");
      for (const s of schools) {
        contextParts.push(
          `- ID:${s.id} | ${s.name} (${s.school_type}) | ${s.grade_range ?? ""} | ${s.address ?? ""}${s.rating ? ` | Rating: ${s.rating}` : ""} | ${s.enrollment ?? "?"} students`
        );
      }
    }

    // Parks
    const { data: parks } = await supabase
      .from("parks")
      .select(
        "id, name, slug, description, address, latitude, longitude, amenities"
      )
      .eq("is_published", true)
      .not("latitude", "is", null)
      .limit(20);

    if (parks?.length) {
      contextParts.push("\n## PARKS (type: park):");
      for (const p of parks) {
        contextParts.push(
          `- ID:${p.id} | ${p.name} | ${p.address ?? ""}${p.amenities?.length ? ` | Amenities: ${p.amenities.slice(0, 6).join(", ")}` : ""} | ${p.description?.slice(0, 80) ?? ""}`
        );
      }
    }

    // Upcoming events
    const today = new Date().toISOString().split("T")[0];
    const { data: events } = await supabase
      .from("events")
      .select(
        "id, title, category, start_date, start_time, location_name, address, latitude, longitude, is_free, ticket_price, description"
      )
      .eq("is_published", true)
      .gte("start_date", today)
      .not("latitude", "is", null)
      .order("start_date")
      .limit(20);

    if (events?.length) {
      contextParts.push("\n## UPCOMING EVENTS (type: event):");
      for (const e of events) {
        const date = new Date(e.start_date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        contextParts.push(
          `- ID:${e.id} | ${e.title} (${e.category}) | ${date}${e.start_time ? ` at ${e.start_time}` : ""} | ${e.location_name ?? e.address ?? "TBD"}${e.is_free ? " | FREE" : e.ticket_price ? ` | $${(e.ticket_price / 100).toFixed(2)}` : ""} | ${e.description?.slice(0, 60) ?? ""}`
        );
      }
    }

    const contextData = contextParts.join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Current Compton database:\n${contextData}\n\n---\nResident asks: "${query}"`,
          },
        ],
        max_tokens: 800,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({
        message: parsed.message || "",
        places: Array.isArray(parsed.places) ? parsed.places : [],
        source: "openai",
      });
    } catch {
      // If JSON parse fails, return text as-is
      return NextResponse.json({
        message: raw,
        places: [],
        source: "openai",
      });
    }
  } catch (error) {
    console.error("AI map search error:", error);
    return NextResponse.json(
      { error: "AI search temporarily unavailable" },
      { status: 500 }
    );
  }
}
