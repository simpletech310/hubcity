import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/loyalty/transactions — user's loyalty history
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "20");
    const offset = Number(searchParams.get("offset") || "0");

    const { data: transactions, error } = await supabase
      .from("loyalty_transactions")
      .select("*, business:businesses(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error("Loyalty transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
