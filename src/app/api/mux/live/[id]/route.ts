import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMuxClient } from "@/lib/mux";

// DELETE — End and disable a live stream
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stream with creator info
    const { data: stream } = await supabase
      .from("live_streams")
      .select("mux_stream_id, created_by")
      .eq("id", id)
      .single();

    if (!stream) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Verify ownership or admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isOwner = stream.created_by === user.id;
    const isAdmin = profile?.role === "admin" || profile?.role === "city_official";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the stream creator or admins can end this stream" },
        { status: 403 }
      );
    }

    // Disable on Mux
    if (stream.mux_stream_id) {
      try {
        const mux = createMuxClient();
        await mux.video.liveStreams.disable(stream.mux_stream_id);
      } catch (e) {
        console.warn("Mux disable warning:", e);
      }
    }

    // Update in DB
    await supabase
      .from("live_streams")
      .update({ status: "disabled", ended_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Live stream delete error:", error);
    return NextResponse.json(
      { error: "Failed to end stream" },
      { status: 500 }
    );
  }
}
