import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  try {
    const { district } = await params;
    const districtNum = parseInt(district);
    if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
      return NextResponse.json({ error: "Invalid district" }, { status: 400 });
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("district", districtNum)
      .eq("is_published", true)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ events: data || [] });
  } catch (error) {
    console.error("District events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  try {
    const { district } = await params;
    const districtNum = parseInt(district);
    if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
      return NextResponse.json({ error: "Invalid district" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify city_official role and matching district
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, district")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "city_official") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (profile.district !== districtNum) {
      return NextResponse.json(
        { error: "You can only create events for your own district" },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      category,
      start_date,
      start_time,
      end_date,
      end_time,
      location_name,
      address,
      image_url,
      visibility = "public",
    } = await request.json();

    if (!title || !start_date) {
      return NextResponse.json(
        { error: "Title and start_date are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        district: districtNum,
        created_by: user.id,
        title,
        description,
        category,
        start_date,
        start_time,
        end_date,
        end_time,
        location_name,
        address,
        image_url,
        visibility,
        is_published: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ event: data }, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
