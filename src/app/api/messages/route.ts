import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { business_id, recipient_id, body } = await request.json();

    if (!business_id || !recipient_id || !body) {
      return NextResponse.json(
        { error: "business_id, recipient_id, and body are required" },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        business_id,
        sender_id: user.id,
        recipient_id,
        body: body.trim(),
        is_read: false,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const business_id = searchParams.get("business_id");
    const customer_id = searchParams.get("customer_id");

    if (!business_id || !customer_id) {
      return NextResponse.json(
        { error: "business_id and customer_id query params are required" },
        { status: 400 }
      );
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select(
        "*, sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url)"
      )
      .eq("business_id", business_id)
      .or(`sender_id.eq.${customer_id},recipient_id.eq.${customer_id}`)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}
