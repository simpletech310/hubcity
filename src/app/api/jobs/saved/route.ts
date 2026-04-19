import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/saved — list the authenticated user's saved jobs with the
 * joined job_listings row for each.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("saved_jobs")
      .select(
        "job_id, created_at, job:job_listings!saved_jobs_job_id_fkey(id, slug, title, organization_name, organization_type, is_remote, location, salary_min, salary_max, salary_period, employment_type, is_active, expires_at)"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ saved: data ?? [] });
  } catch (error) {
    console.error("List saved jobs error:", error);
    return NextResponse.json(
      { error: "Failed to load saved jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/saved
 * Body: { job_id: string }
 * Toggles the save state — idempotent. Returns { saved: boolean }.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { job_id } = (await request.json()) as { job_id?: string };
    if (!job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("saved_jobs")
      .select("job_id")
      .eq("user_id", user.id)
      .eq("job_id", job_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", job_id);
      if (error) throw error;
      return NextResponse.json({ saved: false });
    }

    const { error } = await supabase
      .from("saved_jobs")
      .insert({ user_id: user.id, job_id });
    if (error) throw error;

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Toggle saved job error:", error);
    return NextResponse.json(
      { error: "Failed to update saved job" },
      { status: 500 }
    );
  }
}
