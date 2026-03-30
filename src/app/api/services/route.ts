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

    const { business_id, name, description, price, duration, sort_order } =
      await request.json();

    if (!business_id || !name || price === undefined || !duration) {
      return NextResponse.json(
        { error: "business_id, name, price, and duration are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: "Not authorized to manage this business" },
        { status: 403 }
      );
    }

    const { data: service, error } = await supabase
      .from("services")
      .insert({
        business_id,
        name,
        description: description || null,
        price,
        duration,
        is_available: true,
        sort_order: sort_order ?? 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");

    if (!business_id) {
      return NextResponse.json(
        { error: "business_id query param is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: services, error } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", business_id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to get services" },
      { status: 500 }
    );
  }
}
