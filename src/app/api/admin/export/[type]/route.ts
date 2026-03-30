import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        // Escape CSV: wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const supabase = await createClient();
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

    const { type } = await params;

    let data: Record<string, unknown>[] = [];
    let filename = "export.csv";

    switch (type) {
      case "businesses": {
        const { data: d } = await supabase
          .from("businesses")
          .select(
            "name, slug, category, address, phone, website, rating_avg, rating_count, vote_count, is_featured, is_published, created_at"
          )
          .order("name");
        data = (d ?? []) as Record<string, unknown>[];
        filename = "businesses.csv";
        break;
      }
      case "events": {
        const { data: d } = await supabase
          .from("events")
          .select(
            "title, slug, category, start_date, start_time, location_name, address, rsvp_count, is_featured, is_ticketed, is_published, created_at"
          )
          .order("start_date", { ascending: false });
        data = (d ?? []) as Record<string, unknown>[];
        filename = "events.csv";
        break;
      }
      case "users": {
        const { data: d } = await supabase
          .from("profiles")
          .select(
            "display_name, handle, role, district, verification_status, city, state, zip, language, created_at"
          )
          .order("created_at", { ascending: false });
        data = (d ?? []) as Record<string, unknown>[];
        filename = "users.csv";
        break;
      }
      case "resources": {
        const { data: d } = await supabase
          .from("resources")
          .select(
            "name, slug, category, organization, status, is_free, address, phone, district, created_at"
          )
          .order("name");
        data = (d ?? []) as Record<string, unknown>[];
        filename = "resources.csv";
        break;
      }
      case "issues": {
        const { data: d } = await supabase
          .from("city_issues")
          .select(
            "type, title, location_text, district, status, priority, upvote_count, assigned_department, created_at, acknowledged_at, resolved_at"
          )
          .order("created_at", { ascending: false });
        data = (d ?? []) as Record<string, unknown>[];
        filename = "city_issues.csv";
        break;
      }
      case "orders": {
        const { data: d } = await supabase
          .from("orders")
          .select(
            "order_number, status, type, subtotal, tax, tip, total, created_at"
          )
          .order("created_at", { ascending: false });
        data = (d ?? []) as Record<string, unknown>[];
        filename = "orders.csv";
        break;
      }
      case "jobs": {
        const { data: d } = await supabase
          .from("job_listings")
          .select(
            "title, slug, job_type, salary_min, salary_max, salary_type, location, is_remote, is_active, application_count, created_at"
          )
          .order("created_at", { ascending: false });
        data = (d ?? []) as Record<string, unknown>[];
        filename = "jobs.csv";
        break;
      }
      default:
        return NextResponse.json(
          { error: "Invalid export type. Available: businesses, events, users, resources, issues, orders, jobs" },
          { status: 400 }
        );
    }

    const csv = toCsv(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
