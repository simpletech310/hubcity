import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

const ALLOWED_TYPES = new Set([
  "cultural",
  "resource_provider",
  "chamber",
  "school",
  "nonprofit",
  "government",
  "other",
]);

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", reset: rl.reset },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    type?: string;
    city_id?: string;
    description?: string;
    website?: string;
    email?: string;
    phone?: string;
  };

  const name = body.name?.trim();
  const type = body.type?.trim() || "other";
  const city_id = body.city_id?.trim();

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!ALLOWED_TYPES.has(type))
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  if (!city_id)
    return NextResponse.json({ error: "city_id is required" }, { status: 400 });

  // Ensure city exists and is live.
  const { data: city } = await supabase
    .from("cities")
    .select("id, launch_status")
    .eq("id", city_id)
    .maybeSingle();
  if (!city || city.launch_status === "hidden") {
    return NextResponse.json({ error: "unknown city" }, { status: 400 });
  }

  // Generate unique slug: base + -N suffix on collision.
  const base = slugify(name);
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${base}-${i}`;
  }

  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      type,
      city_id,
      description: body.description || null,
      website: body.website || null,
      email: body.email || null,
      phone: body.phone || null,
      verified: false,
    })
    .select("id, slug, name, type, verified")
    .single();

  if (error) {
    console.error("organizations insert error:", error);
    return NextResponse.json({ error: "Could not create organization" }, { status: 500 });
  }

  // Creator becomes owner automatically.
  await supabase.from("organization_members").insert({
    org_id: org.id,
    user_id: user.id,
    role: "owner",
  });

  return NextResponse.json({ org });
}
