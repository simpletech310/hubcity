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
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("district_programs")
      .select("*")
      .eq("district", districtNum)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ programs: data || [] });
  } catch (error) {
    console.error("District programs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
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
        { error: "You can only create programs for your own district" },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      category,
      location_name,
      schedule,
      start_date,
      end_date,
      contact_name,
      contact_phone,
      contact_email,
      image_url,
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("district_programs")
      .insert({
        district: districtNum,
        created_by: user.id,
        title,
        description,
        category,
        location_name,
        schedule,
        start_date,
        end_date,
        contact_name,
        contact_phone,
        contact_email,
        image_url,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ program: data }, { status: 201 });
  } catch (error) {
    console.error("Create program error:", error);
    return NextResponse.json(
      { error: "Failed to create program" },
      { status: 500 }
    );
  }
}
