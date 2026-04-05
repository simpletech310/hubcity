import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false });

    if (error) {
      console.error("Achievements fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Achievements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { achievement_type, achievement_data } = body;

    if (!achievement_type) {
      return NextResponse.json(
        { error: "Missing required field: achievement_type" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_achievements")
      .upsert(
        {
          user_id: user.id,
          achievement_type,
          achievement_data: achievement_data ?? {},
          unlocked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,achievement_type" }
      )
      .select()
      .single();

    if (error) {
      console.error("Achievement upsert error:", error);
      return NextResponse.json({ error: "Failed to unlock achievement" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Achievement POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
