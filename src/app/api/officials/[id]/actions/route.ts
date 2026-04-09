import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Manager/Superintendent actions for an official
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("manager_actions")
      .select("*")
      .eq("official_id", id)
      .order("action_date", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ actions: data ?? [] });
  } catch (error) {
    console.error("Official actions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    );
  }
}
