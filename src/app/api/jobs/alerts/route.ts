import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/alerts — list the authenticated user's job alerts.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("job_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ alerts: data ?? [] });
  } catch (error) {
    console.error("List job alerts error:", error);
    return NextResponse.json(
      { error: "Failed to load job alerts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/alerts
 * Body: { filters: object, frequency?: 'daily' | 'weekly' }
 * Creates a new saved-search alert. The `filters` object mirrors the query
 * params accepted by /api/jobs/search (q, city_id, category, etc.).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filters, frequency } = (await request.json()) as {
      filters?: Record<string, unknown>;
      frequency?: "daily" | "weekly";
    };

    if (!filters || typeof filters !== "object") {
      return NextResponse.json(
        { error: "filters object is required" },
        { status: 400 }
      );
    }

    const freq = frequency === "daily" ? "daily" : "weekly";

    const { data: alert, error } = await supabase
      .from("job_alerts")
      .insert({
        user_id: user.id,
        filters,
        frequency: freq,
        active: true,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Create job alert error:", error);
    return NextResponse.json(
      { error: "Failed to create job alert" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/alerts?id=<uuid>
 * Removes a job alert owned by the caller.
 */
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("job_alerts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete job alert error:", error);
    return NextResponse.json(
      { error: "Failed to delete job alert" },
      { status: 500 }
    );
  }
}
