import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/search
 *
 * Parity search endpoint — supports full-text query and the standard job
 * board filters. Returns active, non-expired listings by default.
 *
 * Query params:
 *   q                  full-text query (websearch syntax)
 *   city_id            restrict to a single city
 *   category           exact match on category column
 *   is_remote          "true" | "false" — filter remote flag
 *   experience_level   entry | mid | senior | executive
 *   employment_type    full_time | part_time | contract | internship | seasonal | temporary
 *   salary_min         numeric — listings with salary_min >= this value
 *   salary_max         numeric — listings with salary_max <= this value
 *   limit              page size (default 20, max 100)
 *   cursor             ISO timestamp for keyset pagination (created_at <)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim();
    const cityId = searchParams.get("city_id");
    const category = searchParams.get("category");
    const isRemoteParam = searchParams.get("is_remote");
    const experienceLevel = searchParams.get("experience_level");
    const employmentType = searchParams.get("employment_type");
    const salaryMin = searchParams.get("salary_min");
    const salaryMax = searchParams.get("salary_max");
    const cursor = searchParams.get("cursor");

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1),
      100
    );

    const nowIso = new Date().toISOString();

    let query = supabase
      .from("job_listings")
      .select(
        "*, business:businesses(id, name, slug, image_urls), poster:profiles!job_listings_posted_by_fkey(id, display_name, avatar_url, role)"
      )
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.textSearch("fts", q, { type: "websearch" });
    }

    if (cityId) query = query.eq("city_id", cityId);
    if (category) query = query.eq("category", category);
    if (experienceLevel) query = query.eq("experience_level", experienceLevel);
    if (employmentType) query = query.eq("employment_type", employmentType);

    if (isRemoteParam === "true") query = query.eq("is_remote", true);
    if (isRemoteParam === "false") query = query.eq("is_remote", false);

    if (salaryMin) {
      const n = Number(salaryMin);
      if (!Number.isNaN(n)) query = query.gte("salary_min", n);
    }
    if (salaryMax) {
      const n = Number(salaryMax);
      if (!Number.isNaN(n)) query = query.lte("salary_max", n);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    const rows = jobs ?? [];
    const nextCursor =
      rows.length === limit ? rows[rows.length - 1].created_at : null;

    return NextResponse.json({ jobs: rows, next_cursor: nextCursor });
  } catch (error) {
    console.error("Job search error:", error);
    return NextResponse.json(
      { error: "Failed to search jobs" },
      { status: 500 }
    );
  }
}
