import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const q = query.trim().toLowerCase();

    // Search across all content in parallel
    const [
      { data: businesses },
      { data: events },
      { data: resources },
      { data: healthRes },
      { data: jobs },
      { data: departments },
    ] = await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, slug, category, description, address, rating_avg, image_urls")
        .eq("is_published", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(5),
      supabase
        .from("events")
        .select("id, title, slug, category, start_date, start_time, location_name, image_url")
        .eq("is_published", true)
        .gte("start_date", new Date().toISOString().split("T")[0])
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location_name.ilike.%${q}%`)
        .order("start_date")
        .limit(5),
      supabase
        .from("resources")
        .select("id, name, slug, category, organization, status, is_free")
        .eq("is_published", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,organization.ilike.%${q}%`)
        .limit(5),
      supabase
        .from("health_resources")
        .select("id, name, slug, category, organization, is_free, is_emergency")
        .eq("is_published", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%,organization.ilike.%${q}%`)
        .limit(5),
      supabase
        .from("job_listings")
        .select("id, title, slug, job_type, salary_min, salary_max, salary_type, location")
        .eq("is_active", true)
        .or(`title.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`)
        .limit(5),
      supabase
        .from("city_departments")
        .select("id, name, slug, category, description, phone")
        .eq("is_active", true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(3),
    ]);

    // Build unified results with source type
    const results = [
      ...(businesses ?? []).map((b) => ({
        type: "business" as const,
        id: b.id,
        title: b.name,
        subtitle: b.category,
        link: `/business/${b.slug}`,
        meta: b.address,
        image: b.image_urls?.[0] || null,
      })),
      ...(events ?? []).map((e) => ({
        type: "event" as const,
        id: e.id,
        title: e.title,
        subtitle: e.category,
        link: `/events/${e.id}`,
        meta: e.location_name,
        image: e.image_url,
      })),
      ...(resources ?? []).map((r) => ({
        type: "resource" as const,
        id: r.id,
        title: r.name,
        subtitle: r.category,
        link: `/resources/${r.id}`,
        meta: r.organization,
        image: null,
      })),
      ...(healthRes ?? []).map((h) => ({
        type: "health" as const,
        id: h.id,
        title: h.name,
        subtitle: h.category,
        link: `/health/${h.slug}`,
        meta: h.organization,
        image: null,
      })),
      ...(jobs ?? []).map((j) => ({
        type: "job" as const,
        id: j.id,
        title: j.title,
        subtitle: j.job_type,
        link: `/jobs/${j.id}`,
        meta: j.location,
        image: null,
      })),
      ...(departments ?? []).map((d) => ({
        type: "department" as const,
        id: d.id,
        title: d.name,
        subtitle: d.category,
        link: `/city-hall/departments/${d.slug}`,
        meta: d.phone,
        image: null,
      })),
    ];

    // Log the search query
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("search_queries").insert({
      user_id: user?.id || null,
      query: query.trim(),
      search_type: "global",
      result_count: results.length,
    });

    // If OpenAI is available, also get an AI response
    let aiResponse: string | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const context = results
          .slice(0, 10)
          .map(
            (r) =>
              `[${r.type}] ${r.title}${r.subtitle ? ` (${r.subtitle})` : ""}${r.meta ? ` — ${r.meta}` : ""}`
          )
          .join("\n");

        const res = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are Culture AI, a helpful assistant for Compton, CA residents. Answer concisely (2-3 sentences max) based on the search results provided. If no results match, suggest where they might find what they need.",
                },
                {
                  role: "user",
                  content: `Question: ${query}\n\nRelevant results:\n${context || "No matching results found."}`,
                },
              ],
              max_tokens: 200,
              temperature: 0.7,
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          aiResponse = data.choices?.[0]?.message?.content || null;
        }
      } catch {
        // AI response is optional
      }
    }

    return NextResponse.json({
      results,
      ai_response: aiResponse,
      total: results.length,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
