import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ interests: [] });

  const { data } = await supabase
    .from("user_interests")
    .select("category_id,weight")
    .eq("user_id", user.id);

  return NextResponse.json({ interests: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    category_ids?: unknown;
  };
  const ids = Array.isArray(body.category_ids)
    ? body.category_ids.filter((v): v is string => typeof v === "string")
    : null;

  if (!ids) {
    return NextResponse.json(
      { error: "category_ids must be an array of strings" },
      { status: 400 }
    );
  }

  // Validate all category_ids exist and are active.
  if (ids.length > 0) {
    const { data: valid } = await supabase
      .from("culture_categories")
      .select("id")
      .eq("active", true)
      .in("id", ids);
    const validSet = new Set((valid ?? []).map((r: { id: string }) => r.id));
    const invalid = ids.filter((id) => !validSet.has(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: "Unknown category ids", invalid },
        { status: 400 }
      );
    }
  }

  // Replace the user's interests: delete all, insert the new set.
  await supabase.from("user_interests").delete().eq("user_id", user.id);
  if (ids.length > 0) {
    await supabase.from("user_interests").insert(
      ids.map((id) => ({ user_id: user.id, category_id: id, weight: 3 }))
    );
  }

  return NextResponse.json({ ok: true, count: ids.length });
}
