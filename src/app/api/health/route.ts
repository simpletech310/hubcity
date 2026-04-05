import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let query = supabase
      .from("health_resources")
      .select("*")
      .eq("is_published", true)
      .order("is_emergency", { ascending: false })
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,organization.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ resources: data ?? [] });
  } catch (error) {
    console.error("Get health resources error:", error);
    return NextResponse.json(
      { error: "Failed to get health resources" },
      { status: 500 }
    );
  }
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

    // Verify role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin" && profile?.role !== "city_official" && profile?.role !== "city_ambassador") {
      return NextResponse.json(
        { error: "Only admins and city officials can create health resources" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      name,
      organization,
      category,
      description,
      address,
      phone,
      website,
      hours,
      latitude,
      longitude,
      is_emergency,
      is_free,
      accepts_medicaid,
      accepts_uninsured,
      walk_ins_welcome,
      languages,
      is_published,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: resource, error } = await supabase
      .from("health_resources")
      .insert({
        name,
        slug,
        organization: organization || null,
        category: category || "clinic",
        description,
        address: address || null,
        phone: phone || null,
        website: website || null,
        hours: hours || null,
        latitude: latitude || null,
        longitude: longitude || null,
        is_emergency: is_emergency ?? false,
        is_free: is_free ?? false,
        accepts_medicaid: accepts_medicaid ?? false,
        accepts_uninsured: accepts_uninsured ?? false,
        walk_ins_welcome: walk_ins_welcome ?? false,
        languages: languages || [],
        is_published: is_published ?? false,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Create health resource error:", error);
    return NextResponse.json(
      { error: "Failed to create health resource" },
      { status: 500 }
    );
  }
}
