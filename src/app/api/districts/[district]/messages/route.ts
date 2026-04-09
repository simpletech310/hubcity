import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
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

  // Verify user is a city official
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "city_official") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: messages, error } = await supabase
    .from("council_messages")
    .select(
      "*, sender:profiles!council_messages_sender_id_fkey(id, display_name, avatar_url, verification_status)"
    )
    .eq("council_member_id", user.id)
    .eq("district", districtNum)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  const { district } = await params;
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

  // Verify sender is verified and in this district
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("verification_status, district")
    .eq("id", user.id)
    .single();

  if (!senderProfile || senderProfile.verification_status !== "verified") {
    return NextResponse.json(
      { error: "Only verified residents can send messages" },
      { status: 403 }
    );
  }

  if (senderProfile.district !== districtNum) {
    return NextResponse.json(
      { error: "You can only message your own district council member" },
      { status: 403 }
    );
  }

  // Look up the council member for this district
  const { data: councilMember } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "city_official")
    .eq("district", districtNum)
    .single();

  if (!councilMember) {
    return NextResponse.json(
      { error: "No council member found for this district" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { subject, body: messageBody } = body;

  if (!subject || !messageBody) {
    return NextResponse.json(
      { error: "Subject and body are required" },
      { status: 400 }
    );
  }

  const { data: message, error } = await supabase
    .from("council_messages")
    .insert({
      district: districtNum,
      sender_id: user.id,
      council_member_id: councilMember.id,
      subject,
      body: messageBody,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message }, { status: 201 });
}
