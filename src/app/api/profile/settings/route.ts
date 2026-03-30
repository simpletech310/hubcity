import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notification_prefs } = await request.json();

    if (!notification_prefs || typeof notification_prefs !== "object") {
      return NextResponse.json(
        { error: "Invalid notification_prefs" },
        { status: 400 }
      );
    }

    // Validate shape
    const valid = ["events", "resources", "district", "system"];
    const sanitized: Record<string, boolean> = {};
    for (const key of valid) {
      sanitized[key] =
        typeof notification_prefs[key] === "boolean"
          ? notification_prefs[key]
          : true;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: sanitized })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, notification_prefs: sanitized });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
