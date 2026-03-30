import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("time_blocks")
      .select("*, channel:channels(id, name, slug, avatar_url)")
      .eq("channel_id", id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Failed to fetch time blocks:", error);
      return NextResponse.json(
        { error: "Failed to fetch time blocks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ time_blocks: data || [] });
  } catch (error) {
    console.error("Time blocks GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: channelId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin only
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { day_of_week, start_time, end_time, title, is_recurring } = body;

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: "day_of_week, start_time, and end_time are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("time_blocks")
      .insert({
        channel_id: channelId,
        day_of_week,
        start_time,
        end_time,
        title: title || null,
        is_recurring: is_recurring ?? true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create time block:", error);
      return NextResponse.json(
        { error: "Failed to create time block" },
        { status: 500 }
      );
    }

    return NextResponse.json({ time_block: data }, { status: 201 });
  } catch (error) {
    console.error("Time blocks POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
