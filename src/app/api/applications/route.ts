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

    const { resource_id, form_data } = await request.json();

    if (!resource_id || !form_data) {
      return NextResponse.json(
        { error: "resource_id and form_data are required" },
        { status: 400 }
      );
    }

    // Check if user already applied
    const { data: existing } = await supabase
      .from("grant_applications")
      .select("id")
      .eq("resource_id", resource_id)
      .eq("applicant_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this resource" },
        { status: 409 }
      );
    }

    const { data: application, error } = await supabase
      .from("grant_applications")
      .insert({
        resource_id,
        applicant_id: user.id,
        status: "submitted",
        form_data,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
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

    const { searchParams } = new URL(request.url);
    const resource_id = searchParams.get("resource_id");

    // Check if user is admin/city_official
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      profile?.role === "admin" || profile?.role === "city_official" || profile?.role === "resource_provider";

    if (isAdmin && resource_id) {
      // For resource_providers, verify they own this resource
      if (profile?.role === "resource_provider") {
        const { data: resource } = await supabase
          .from("resources")
          .select("created_by")
          .eq("id", resource_id)
          .single();
        if (resource?.created_by !== user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }

      // Admins can see all applications for a resource
      const { data: applications, error } = await supabase
        .from("grant_applications")
        .select("*, applicant:profiles(id, display_name, email:handle)")
        .eq("resource_id", resource_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json({ applications });
    }

    // Regular users see their own applications
    let query = supabase
      .from("grant_applications")
      .select("*, resource:resources(id, name, organization, category)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });

    if (resource_id) {
      query = query.eq("resource_id", resource_id);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get applications error:", error);
    return NextResponse.json(
      { error: "Failed to get applications" },
      { status: 500 }
    );
  }
}
