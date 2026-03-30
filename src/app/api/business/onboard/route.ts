import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isComptonZip } from "@/lib/districts";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, category, description, address, phone, website, hours, is_mobile_vendor } =
      await request.json();

    if (!name || !category || !address) {
      return NextResponse.json(
        { error: "name, category, and address are required" },
        { status: 400 }
      );
    }

    // Verify address is in Compton by extracting ZIP
    const zipMatch = address.match(/\b(9\d{4})\b/);
    if (!zipMatch || !isComptonZip(zipMatch[1])) {
      return NextResponse.json(
        {
          error:
            "Business address must be located in Compton, CA. Valid ZIP codes include 90220-90224.",
        },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Create business record
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name,
        slug,
        category,
        description: description || null,
        address,
        phone: phone || null,
        website: website || null,
        hours: hours || {},
        image_urls: [],
        badges: [],
        menu: [],
        rating_avg: 0,
        rating_count: 0,
        vote_count: 0,
        is_featured: false,
        is_published: false,
        accepts_orders: false,
        accepts_bookings: false,
        delivery_enabled: false,
        min_order: 0,
        is_mobile_vendor: is_mobile_vendor ?? false,
        vendor_status: is_mobile_vendor ? "inactive" : "inactive",
      })
      .select("*")
      .single();

    if (bizError) throw bizError;

    // Update user profile role to business_owner
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "business_owner" })
      .eq("id", user.id);

    if (profileError) {
      console.error("Failed to update profile role:", profileError);
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error("Business onboard error:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}
