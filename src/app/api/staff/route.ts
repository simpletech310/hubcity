import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const businessId = request.nextUrl.searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json({ error: "business_id required" }, { status: 400 });
    }

    const { data: staff, error } = await supabase
      .from("business_staff")
      .select("*, staff_services(service_id)")
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;

    return NextResponse.json({ staff: staff ?? [] });
  } catch (error) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { business_id, name, role, email, phone, specialties, service_ids } = body;

    if (!business_id || !name) {
      return NextResponse.json({ error: "business_id and name required" }, { status: 400 });
    }

    // Verify ownership
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .eq("owner_id", user.id)
      .single();

    if (!biz) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: staff, error } = await supabase
      .from("business_staff")
      .insert({
        business_id,
        name,
        role: role || "provider",
        email: email || null,
        phone: phone || null,
        specialties: specialties || [],
      })
      .select("*")
      .single();

    if (error) throw error;

    // Link to services
    if (service_ids?.length && staff) {
      const links = service_ids.map((sid: string) => ({
        staff_id: staff.id,
        service_id: sid,
      }));
      await supabase.from("staff_services").insert(links);
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
