import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = ["admin", "city_official", "city_ambassador"];

interface EventRow {
  title?: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  venue_name?: string;
  address?: string;
  city_slug?: string;
  category?: string;
  ticket_price?: string;
  [key: string]: string | undefined;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
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

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const { rows, cityId } = (await request.json()) as {
      rows: EventRow[];
      cityId: string;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "rows must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 rows per import" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Build insert rows ─────────────────────────────────────────────────────
    const toInsert = rows
      .filter((r) => r.title?.trim() && r.starts_at?.trim())
      .map((r) => {
        // Parse starts_at into date + time parts for existing schema
        const startsAt = r.starts_at!.trim();
        const [startDate, startTime] = startsAt.includes("T")
          ? [startsAt.split("T")[0], startsAt.split("T")[1]?.slice(0, 5)]
          : [startsAt, null];

        const endsAt = r.ends_at?.trim();
        const [endDate, endTime] = endsAt?.includes("T")
          ? [endsAt.split("T")[0], endsAt.split("T")[1]?.slice(0, 5)]
          : [endsAt ?? null, null];

        const ticketPrice = r.ticket_price
          ? parseFloat(r.ticket_price)
          : 0;

        return {
          title: r.title!.trim(),
          slug:
            r.title!
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 60) +
            "-" +
            Date.now().toString(36),
          description: r.description?.trim() || null,
          start_date: startDate,
          start_time: startTime || null,
          end_date: endDate,
          end_time: endTime || null,
          location_name: r.venue_name?.trim() || null,
          address: r.address?.trim() || null,
          category: r.category?.trim() || "community",
          city_id: cityId,
          ticket_price: isNaN(ticketPrice) ? 0 : ticketPrice,
          is_published: false,
          is_featured: false,
          is_ticketed: ticketPrice > 0,
          rsvp_count: 0,
          created_by: user.id,
        };
      });

    const skipped = rows.length - toInsert.length;

    if (toInsert.length === 0) {
      return NextResponse.json({ imported: 0, skipped });
    }

    // ── Bulk insert ───────────────────────────────────────────────────────────
    const { data: inserted, error } = await admin
      .from("events")
      .insert(toInsert)
      .select("id");

    if (error) {
      console.error("Seed events error:", error);
      return NextResponse.json({ error: "Insert failed", detail: error.message }, { status: 500 });
    }

    const importedCount = inserted?.length ?? 0;
    const totalSkipped = skipped + (toInsert.length - importedCount);

    return NextResponse.json({ imported: importedCount, skipped: totalSkipped });
  } catch (err) {
    console.error("Seed events unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
