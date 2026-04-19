import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Knect AI, the official assistant for the Knect app — a civic platform for Compton, CA.
You help residents find local businesses, events, jobs, food vendors, health resources, parks, schools, community programs, and city information.

IMPORTANT RULES:
- Answer ONLY using the provided database data. Never make up businesses, events, or resources.
- If data is provided, reference specific names, addresses, prices, dates, and details.
- If no relevant data matches the query, say "I don't have information about that in our database yet" and suggest browsing the relevant section of the app.
- Be concise, warm, and specific to Compton. Keep responses under 300 words.
- When listing items, include key details (address, price, rating, date, etc.)
- For food/restaurant queries, mention if they're currently open and their rating.
- For job queries, mention salary range and job type.
- For events, include date, time, and location.
- Format with clear sections. Use bullet points for lists.`;

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

    const supabase = await createClient();
    const contextParts: string[] = [];

    // Always fetch businesses — they're core to most queries
    const { data: businesses } = await supabase
      .from("businesses")
      .select(
        "name, slug, category, business_type, business_sub_type, description, address, district, phone, rating_avg, badges, is_featured, is_open, hours"
      )
      .eq("is_published", true)
      .order("rating_avg", { ascending: false })
      .limit(50);

    if (businesses?.length) {
      contextParts.push("## LOCAL BUSINESSES:");
      businesses.forEach((b) => {
        const parts = [
          `${b.name} (${b.category}${b.business_type ? `, ${b.business_type}` : ""})`,
          b.description ? `— ${b.description.slice(0, 100)}` : "",
          b.address ? `Address: ${b.address}` : "",
          `Rating: ${b.rating_avg ?? "N/A"}/5`,
          b.is_open ? "OPEN NOW" : "",
          b.is_featured ? "FEATURED" : "",
          b.phone ? `Phone: ${b.phone}` : "",
          b.badges?.length ? `Tags: ${b.badges.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(". ");
        contextParts.push(`- ${parts}`);
      });
    }

    // Events
    if (context_type === "general" || context_type === "event") {
      const { data: events } = await supabase
        .from("events")
        .select(
          "title, category, start_date, start_time, end_date, location_name, address, description, rsvp_count, is_free, ticket_price"
        )
        .eq("is_published", true)
        .order("start_date", { ascending: true })
        .limit(30);

      if (events?.length) {
        contextParts.push("\n## UPCOMING EVENTS:");
        events.forEach((e) => {
          const date = new Date(e.start_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const parts = [
            `${e.title} (${e.category})`,
            `Date: ${date}${e.start_time ? ` at ${e.start_time}` : ""}`,
            `Location: ${e.location_name ?? e.address ?? "TBD"}`,
            e.is_free ? "FREE" : e.ticket_price ? `$${(e.ticket_price / 100).toFixed(2)}` : "",
            `${e.rsvp_count ?? 0} going`,
            e.description ? e.description.slice(0, 80) : "",
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Jobs
    if (context_type === "general" || context_type === "job") {
      const { data: jobs } = await supabase
        .from("job_listings")
        .select(
          "title, slug, organization_name, organization_type, job_type, salary_min, salary_max, salary_type, location, is_remote, description, application_deadline, application_count"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(30);

      if (jobs?.length) {
        contextParts.push("\n## JOBS & OPPORTUNITIES:");
        jobs.forEach((j) => {
          let salary = "";
          if (j.salary_min || j.salary_max) {
            const type = j.salary_type === "hourly" ? "/hr" : "/yr";
            if (j.salary_min && j.salary_max)
              salary = `$${j.salary_min.toLocaleString()} - $${j.salary_max.toLocaleString()}${type}`;
            else if (j.salary_min) salary = `From $${j.salary_min.toLocaleString()}${type}`;
            else if (j.salary_max) salary = `Up to $${j.salary_max.toLocaleString()}${type}`;
          }
          const parts = [
            `${j.title} at ${j.organization_name ?? "Local Business"}`,
            `Type: ${j.job_type.replace("_", " ")}`,
            salary,
            j.location ?? "",
            j.is_remote ? "Remote OK" : "",
            j.application_deadline
              ? `Deadline: ${new Date(j.application_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "",
            `${j.application_count ?? 0} applications`,
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Community Resources
    if (context_type === "general" || context_type === "resource") {
      const { data: resources } = await supabase
        .from("resources")
        .select(
          "name, category, organization, description, status, is_free, deadline, eligibility"
        )
        .eq("is_published", true)
        .limit(30);

      if (resources?.length) {
        contextParts.push("\n## COMMUNITY RESOURCES:");
        resources.forEach((r) => {
          const parts = [
            `${r.name} by ${r.organization ?? "Unknown"}`,
            `Category: ${r.category}`,
            `Status: ${r.status}`,
            r.is_free ? "FREE" : "",
            r.description ? r.description.slice(0, 80) : "",
            r.deadline ? `Deadline: ${r.deadline}` : "",
            r.eligibility ? `Eligibility: ${r.eligibility.slice(0, 60)}` : "",
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Health Resources
    if (context_type === "general" || context_type === "health") {
      const { data: health } = await supabase
        .from("health_resources")
        .select("name, category, organization, description, address, phone, is_free, accepts_medi_cal, hours")
        .limit(30);

      if (health?.length) {
        contextParts.push("\n## HEALTH RESOURCES:");
        health.forEach((h) => {
          const parts = [
            `${h.name} (${h.category})`,
            h.organization ? `by ${h.organization}` : "",
            h.address ?? "",
            h.phone ? `Phone: ${h.phone}` : "",
            h.is_free ? "FREE" : "",
            h.accepts_medi_cal ? "Accepts Medi-Cal" : "",
            h.description ? h.description.slice(0, 60) : "",
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Parks
    if (context_type === "general" || context_type === "parks") {
      const { data: parks } = await supabase
        .from("parks")
        .select("name, slug, description, address, amenities, hours")
        .limit(20);

      if (parks?.length) {
        contextParts.push("\n## PARKS & RECREATION:");
        parks.forEach((p) => {
          const parts = [
            p.name,
            p.address ?? "",
            p.amenities?.length ? `Amenities: ${p.amenities.slice(0, 5).join(", ")}` : "",
            p.description ? p.description.slice(0, 60) : "",
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Schools
    if (context_type === "general" || context_type === "schools") {
      const { data: schools } = await supabase
        .from("schools")
        .select("name, slug, school_type, grade_range, address, phone, rating, description")
        .limit(20);

      if (schools?.length) {
        contextParts.push("\n## SCHOOLS:");
        schools.forEach((s) => {
          const parts = [
            `${s.name} (${s.school_type})`,
            s.grade_range ?? "",
            s.address ?? "",
            s.rating ? `Rating: ${s.rating}` : "",
            s.phone ? `Phone: ${s.phone}` : "",
          ]
            .filter(Boolean)
            .join(". ");
          contextParts.push(`- ${parts}`);
        });
      }
    }

    // Active polls
    const { data: polls } = await supabase
      .from("polls")
      .select("title, description, status")
      .eq("status", "active")
      .eq("is_published", true)
      .limit(5);

    if (polls?.length) {
      contextParts.push("\n## ACTIVE POLLS (civic engagement):");
      polls.forEach((p) => {
        contextParts.push(`- ${p.title}: ${p.description?.slice(0, 80) ?? ""}`);
      });
    }

    // City alerts
    const { data: alerts } = await supabase
      .from("city_alerts")
      .select("title, body, alert_type, severity")
      .eq("is_active", true)
      .limit(5);

    if (alerts?.length) {
      contextParts.push("\n## CITY ALERTS:");
      alerts.forEach((a) => {
        contextParts.push(`- [${a.severity?.toUpperCase()}] ${a.title}: ${a.body?.slice(0, 80) ?? ""}`);
      });
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
            content: `Here is the current Knect database for Compton, CA:\n${contextData}\n\n---\nResident's question: ${query}`,
          },
        ],
        max_tokens: 800,
        temperature: 0.5,
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
