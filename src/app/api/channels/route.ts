import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("channels")
      .select("*, owner:profiles(id, display_name, avatar_url, role)")
      .eq("is_active", true)
      .order("follower_count", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch channels:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 }
      );
    }

    return NextResponse.json({ channels: data || [] });
  } catch (error) {
    console.error("Channels GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, type, avatar_url, banner_url, owner_id } =
      body;

    if (!name || !slug || !type) {
      return NextResponse.json(
        { error: "Name, slug, and type are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("channels")
      .insert({
        name,
        slug,
        description: description || null,
        type,
        avatar_url: avatar_url || null,
        banner_url: banner_url || null,
        owner_id: owner_id || user.id,
        is_verified: false,
        is_active: true,
        follower_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create channel:", error);
      return NextResponse.json(
        { error: "Failed to create channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: data }, { status: 201 });
  } catch (error) {
    console.error("Channels POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
