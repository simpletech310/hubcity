import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCityBySlug } from "@/lib/cities";
import { getActiveCity } from "@/lib/city-context";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category");
    const citySlug = searchParams.get("city");

    // Resolve city: explicit slug param > active city from cookie/profile.
    let cityId: string | null = null;
    if (citySlug) {
      const c = await getCityBySlug(citySlug);
      if (c) cityId = c.id;
    } else {
      const active = await getActiveCity();
      if (active) cityId = active.id;
    }

    let query = supabase
      .from("community_groups")
      .select("*")
      .eq("is_active", true)
      .order("member_count", { ascending: false });

    if (cityId) {
      query = query.eq("city_id", cityId);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query.limit(50);
    if (error) throw error;

    // Check membership if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let myGroups: string[] = [];
    if (user) {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);
      myGroups = (memberships ?? []).map((m) => m.group_id);
    }

    let userRole = null;
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      userRole = prof?.role || null;
    }

    return NextResponse.json({
      groups: data ?? [],
      my_groups: myGroups,
      user_role: userRole,
    });
  } catch (error) {
    console.error("Fetch groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
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

    // Only non-citizen roles can create groups
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = [
      "business_owner",
      "city_official",
      "admin",
      "content_creator",
      "city_ambassador",
      "chamber_admin",
      "resource_provider",
      "school_trustee",
    ];

    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Only authorized roles can create groups" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, category, image_url, is_public } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Group name required" },
        { status: 400 }
      );
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data: group, error } = await supabase
      .from("community_groups")
      .insert({
        name,
        slug,
        description: description || null,
        category: category || "other",
        image_url: image_url || null,
        is_public: is_public !== false,
        created_by: user.id,
        member_count: 1,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Auto-join creator as admin
    await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      role: "admin",
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
