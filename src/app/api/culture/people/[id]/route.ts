import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    let { data: person } = await supabase
      .from("notable_people")
      .select("*, exhibit:museum_exhibits(id, title, slug)")
      .eq("slug", id)
      .eq("is_published", true)
      .single();

    if (!person) {
      const { data } = await supabase
        .from("notable_people")
        .select("*, exhibit:museum_exhibits(id, title, slug)")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      person = data;
    }

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    return NextResponse.json({ person });
  } catch (error) {
    console.error("Person GET error:", error);
    return NextResponse.json({ error: "Failed to fetch person" }, { status: 500 });
  }
}
