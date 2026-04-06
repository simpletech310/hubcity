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
      .select(
        "*, business:businesses(id, name, slug, image_urls), poster:profiles!job_listings_posted_by_fkey(id, display_name, avatar_url, role)"
      )
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
          const orgName = ((job.organization_name as string) ?? "").toLowerCase();
          return title.includes(q) || bizName.includes(q) || orgName.includes(q);
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

    // Verify allowed role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["business_owner", "admin", "city_official", "city_ambassador"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Only business owners, school staff, and city officials can create job listings" },
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
      contact_email,
      contact_phone,
      organization_name: orgNameOverride,
      organization_type: orgTypeOverride,
    } = body;

    if (!title || !description || !job_type) {
      return NextResponse.json(
        { error: "title, description, and job_type are required" },
        { status: 400 }
      );
    }

    // Derive organization info
    let organization_name = orgNameOverride || null;
    let organization_type = orgTypeOverride || null;
    let resolved_business_id = business_id || null;

    if (business_id) {
      // Business poster — look up business name
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, owner_id")
        .eq("id", business_id)
        .single();

      if (!biz) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      organization_name = organization_name || biz.name;
      organization_type = "business";
      resolved_business_id = biz.id;
    } else if (profile.role === "city_official" || profile.role === "city_ambassador") {
      organization_type = organization_type || "city";
      organization_name = organization_name || "City of Compton";
    } else if (orgTypeOverride === "school") {
      organization_type = "school";
      // organization_name should be provided by caller
    }

    const slug = generateSlug(title);

    const { data: job, error } = await supabase
      .from("job_listings")
      .insert({
        business_id: resolved_business_id,
        posted_by: user.id,
        organization_name,
        organization_type,
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
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        is_active: true,
        application_count: 0,
        views_count: 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Auto-create a Pulse post so residents see it in the feed
    if (job) {
      const isVolunteer = job_type === "volunteer";
      const typeLabel = isVolunteer
        ? "volunteer opportunity"
        : {
            full_time: "full-time job",
            part_time: "part-time job",
            contract: "contract position",
            seasonal: "seasonal job",
            internship: "internship",
          }[job_type as string] ?? "job";

      const orgLabel = organization_name || "a local organization";
      const locationLine = location ? ` in ${location}` : "";
      const salaryLine =
        !isVolunteer && salary_min
          ? `\n💰 ${salary_type === "hourly" ? `$${salary_min}/hr` : `$${Number(salary_min).toLocaleString()}/yr`}${salary_max ? ` - ${salary_type === "hourly" ? `$${salary_max}/hr` : `$${Number(salary_max).toLocaleString()}/yr`}` : "+"}`
          : "";
      const deadlineLine = application_deadline
        ? `\n⏰ Apply by ${new Date(application_deadline).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
        : "";

      const postBody =
        `${isVolunteer ? "🤝" : "💼"} New ${typeLabel} at ${orgLabel}!\n\n` +
        `**${title}**${locationLine}${salaryLine}${deadlineLine}\n\n` +
        `${description.slice(0, 200)}${description.length > 200 ? "..." : ""}\n\n` +
        `Apply now → /jobs/${job.slug}\n\n` +
        `#jobs #hiring${isVolunteer ? " #volunteer" : ""} #compton`;

      await supabase.from("posts").insert({
        author_id: user.id,
        body: postBody,
        is_published: true,
        is_automated: true,
        hashtags: isVolunteer
          ? ["jobs", "hiring", "volunteer", "compton"]
          : ["jobs", "hiring", "compton"],
        reaction_counts: {},
      });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("Create job listing error:", error);
    return NextResponse.json(
      { error: "Failed to create job listing" },
      { status: 500 }
    );
  }
}
