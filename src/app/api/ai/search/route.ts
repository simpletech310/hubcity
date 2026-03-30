import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Hub City AI, a helpful assistant for Compton, CA residents.
You help people find local businesses, events, resources, and community information.
Answer questions using ONLY the provided data. Be concise, friendly, and culturally aware.
If data is provided, reference specific names, addresses, and details.
If no relevant data is found, say so honestly and suggest browsing the app.
Format responses with clear structure. Use emoji sparingly for warmth.`;

export async function POST(request: Request) {
  try {
    const { query, context_type = "general" } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-openai-api-key") {
      return NextResponse.json({
        response: `I'd love to help you find "${query}" in Compton! The AI search feature is being configured. In the meantime, try browsing the Business Directory or Resources pages.`,
        source: "mock",
      });
    }

    // Query Supabase for relevant context data
    const supabase = await createClient();
    let contextData = "";

    if (context_type === "general" || context_type === "business") {
      const { data: businesses } = await supabase
        .from("businesses")
        .select("name, slug, category, description, address, district, phone, rating_avg, badges, is_featured")
        .eq("is_published", true)
        .limit(20);

      if (businesses?.length) {
        contextData += "\n\n## LOCAL BUSINESSES:\n";
        businesses.forEach((b) => {
          contextData += `- ${b.name} (${b.category}) — ${b.description ?? "No description"}. Address: ${b.address}. Rating: ${b.rating_avg}/5. ${b.badges?.join(", ") ?? ""}\n`;
        });
      }
    }

    if (context_type === "general" || context_type === "event") {
      const { data: events } = await supabase
        .from("events")
        .select("title, category, start_date, start_time, location_name, address, description, rsvp_count")
        .eq("is_published", true)
        .order("start_date", { ascending: true })
        .limit(15);

      if (events?.length) {
        contextData += "\n\n## UPCOMING EVENTS:\n";
        events.forEach((e) => {
          contextData += `- ${e.title} (${e.category}) — ${new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${e.start_time ? ` at ${e.start_time}` : ""}. Location: ${e.location_name ?? e.address ?? "TBD"}. ${e.rsvp_count} going. ${e.description ?? ""}\n`;
        });
      }
    }

    if (context_type === "general" || context_type === "resource") {
      const { data: resources } = await supabase
        .from("resources")
        .select("name, category, organization, description, status, is_free, deadline, eligibility")
        .eq("is_published", true)
        .limit(15);

      if (resources?.length) {
        contextData += "\n\n## COMMUNITY RESOURCES:\n";
        resources.forEach((r) => {
          contextData += `- ${r.name} by ${r.organization ?? "Unknown"} (${r.category}, ${r.status}${r.is_free ? ", FREE" : ""}). ${r.description}${r.deadline ? ` Deadline: ${r.deadline}` : ""}\n`;
        });
      }
    }

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
            content: `Here is current data about Compton, CA:\n${contextData}\n\n---\nUser question: ${query}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({
      response: data.choices[0].message.content,
      source: "openai",
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { error: "AI search temporarily unavailable" },
      { status: 500 }
    );
  }
}
