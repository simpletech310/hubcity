import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET current user's profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH update profile fields (display_name, bio, handle, avatar_url)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = ["display_name", "bio", "handle", "avatar_url"];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate display_name
    if (updates.display_name !== undefined) {
      const name = String(updates.display_name).trim();
      if (name.length < 2 || name.length > 60) {
        return NextResponse.json(
          { error: "Display name must be 2-60 characters" },
          { status: 400 }
        );
      }
      updates.display_name = name;
    }

    // Validate handle uniqueness
    if (updates.handle !== undefined) {
      const handle = String(updates.handle)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      if (handle.length < 3 || handle.length > 30) {
        return NextResponse.json(
          { error: "Handle must be 3-30 characters (letters, numbers, underscores)" },
          { status: 400 }
        );
      }
      // Check uniqueness
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", handle)
        .neq("id", user.id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Handle is already taken" },
          { status: 409 }
        );
      }
      updates.handle = handle;
    }

    // Validate bio length
    if (updates.bio !== undefined) {
      const bio = String(updates.bio || "").trim();
      if (bio.length > 300) {
        return NextResponse.json(
          { error: "Bio must be under 300 characters" },
          { status: 400 }
        );
      }
      updates.bio = bio || null;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
