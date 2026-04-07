import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    if (!["admin", "city_official", "city_ambassador", "resource_provider"].includes(profile?.role || "")) {
      return NextResponse.json(
        { error: "Only admins and city officials can create resources" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      name,
      organization,
      category,
      description,
      eligibility,
      status,
      deadline,
      is_free,
      address,
      phone,
      website,
      hours,
      district,
      accepts_applications,
      application_fields,
      is_published,
      max_spots,
      contact_email,
      contact_name,
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
      .from("resources")
      .insert({
        name,
        slug,
        organization: organization || null,
        category: category || "business",
        description,
        eligibility: eligibility || null,
        match_tags: [],
        status: status || "open",
        deadline: deadline || null,
        is_free: is_free ?? true,
        address: address || null,
        phone: phone || null,
        website: website || null,
        hours: hours || null,
        district: district || null,
        is_published: is_published ?? false,
        accepts_applications: accepts_applications ?? false,
        application_fields: application_fields || [],
        max_spots: max_spots || null,
        filled_spots: 0,
        contact_email: contact_email || null,
        contact_name: contact_name || null,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    if (!["admin", "city_official", "city_ambassador", "resource_provider"].includes(profile?.role || "")) {
      return NextResponse.json(
        { error: "Only admins and city officials can list managed resources" },
        { status: 403 }
      );
    }

    let query = supabase
      .from("resources")
      .select("*")
      .order("created_at", { ascending: false });

    if (profile?.role === "city_official" || profile?.role === "resource_provider") {
      query = query.eq("created_by", user.id);
    }

    const { data: resources, error } = await query;

    if (error) throw error;

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Get resources error:", error);
    return NextResponse.json(
      { error: "Failed to get resources" },
      { status: 500 }
    );
  }
}
