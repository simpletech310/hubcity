import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface CityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  body: string;
  affected_districts: number[];
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");

    let query = supabase
      .from("city_alerts")
      .select("*")
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false });

    if (district) {
      query = query.contains("affected_districts", [parseInt(district, 10)]);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Alerts fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }

    return NextResponse.json(data as CityAlert[]);
  } catch (error) {
    console.error("Alerts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: admin role required" }, { status: 403 });
    }

    const body = await request.json();
    const { alert_type, severity, title, body: alertBody, affected_districts, expires_at } = body;

    if (!alert_type || !severity || !title || !alertBody) {
      return NextResponse.json(
        { error: "Missing required fields: alert_type, severity, title, body" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("city_alerts")
      .insert({
        alert_type,
        severity,
        title,
        body: alertBody,
        affected_districts: affected_districts ?? [],
        expires_at: expires_at ?? null,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Alert creation error:", error);
      return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Alert POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
