import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ district: string; messageId: string }> }
) {
  const { district, messageId } = await params;
  const districtNum = parseInt(district);
  if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
    return NextResponse.json({ error: "Invalid district" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the user is the council member on this message
  const { data: message } = await supabase
    .from("council_messages")
    .select("council_member_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.council_member_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: updated, error } = await supabase
    .from("council_messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: updated });
}
