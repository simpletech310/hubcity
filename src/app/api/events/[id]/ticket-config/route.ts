import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    const { data: configs, error } = await supabase
      .from("event_ticket_config")
      .select("*, venue_section:venue_sections(*)")
      .eq("event_id", eventId)
      .order("venue_section(sort_order)");

    if (error) {
      console.error("Ticket config fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch ticket configs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ configs: configs ?? [] });
  } catch (error) {
    console.error("Ticket config GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket configs" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    // Admin auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      configs: Array<{
        venue_section_id: string;
        price: number;
        capacity: number;
        max_per_order?: number;
        is_active?: boolean;
      }>;
    };

    if (!body.configs || !Array.isArray(body.configs)) {
      return NextResponse.json(
        { error: "configs array is required" },
        { status: 400 }
      );
    }

    const results = [];

    for (const config of body.configs) {
      // Check if a config already exists for this event + section
      const { data: existing } = await supabase
        .from("event_ticket_config")
        .select("id")
        .eq("event_id", eventId)
        .eq("venue_section_id", config.venue_section_id)
        .single();

      const upsertData: Record<string, unknown> = {
        event_id: eventId,
        venue_section_id: config.venue_section_id,
        price: config.price,
        capacity: config.capacity,
        max_per_order: config.max_per_order ?? 10,
        is_active: config.is_active ?? true,
      };

      // Only set available_count = capacity on new inserts
      if (!existing) {
        upsertData.available_count = config.capacity;
      }

      const { data: upserted, error: upsertError } = await supabase
        .from("event_ticket_config")
        .upsert(upsertData, {
          onConflict: "event_id,venue_section_id",
        })
        .select("*, venue_section:venue_sections(*)")
        .single();

      if (upsertError) {
        console.error("Ticket config upsert error:", upsertError);
        return NextResponse.json(
          { error: "Failed to upsert ticket config" },
          { status: 500 }
        );
      }

      results.push(upserted);
    }

    return NextResponse.json({ configs: results });
  } catch (error) {
    console.error("Ticket config POST error:", error);
    return NextResponse.json(
      { error: "Failed to upsert ticket configs" },
      { status: 500 }
    );
  }
}
