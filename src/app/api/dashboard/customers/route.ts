import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 404 }
      );
    }

    // Get customers with profile data
    const { data: customers, error } = await supabase
      .from("business_customers")
      .select(
        "*, customer:profiles(id, display_name, handle, avatar_url)"
      )
      .eq("business_id", business.id)
      .order("last_visit", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "Failed to get customers" },
      { status: 500 }
    );
  }
}
