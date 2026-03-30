import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    let query = supabase
      .from("job_listings")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("job_type", type);
    }

    const { data: jobs, error } = await query;

    if (error) throw error;

    let filtered = jobs ?? [];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (job: Record<string, unknown>) => {
          const title = (job.title as string)?.toLowerCase() ?? "";
          const biz = job.business as { name?: string } | null;
          const bizName = biz?.name?.toLowerCase() ?? "";
          return title.includes(q) || bizName.includes(q);
        }
      );
    }

    return NextResponse.json({ jobs: filtered });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json(
      { error: "Failed to get job listings" },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "business_owner" && profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only business owners can create job listings" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      business_id,
      title,
      description,
      requirements,
      job_type,
      salary_min,
      salary_max,
      salary_type,
      location,
      is_remote,
      application_deadline,
    } = body;

    if (!business_id || !title || !description || !job_type) {
      return NextResponse.json(
        { error: "business_id, title, description, and job_type are required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);

    const { data: job, error } = await supabase
      .from("job_listings")
      .insert({
        business_id,
        title,
        slug,
        description,
        requirements: requirements || null,
        job_type,
        salary_min: salary_min ?? null,
        salary_max: salary_max ?? null,
        salary_type: salary_type || null,
        location: location || null,
        is_remote: is_remote ?? false,
        application_deadline: application_deadline || null,
        is_active: true,
        application_count: 0,
        views_count: 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Create job listing error:", error);
    return NextResponse.json(
      { error: "Failed to create job listing" },
      { status: 500 }
    );
  }
}
