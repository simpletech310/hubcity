import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

function verifyMuxSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.split("=")[1];
  const expectedSig = signaturePart.split("=")[1];

  const payload = `${timestamp}.${body}`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("mux-signature");
    const secret = process.env.MUX_WEBHOOK_SECRET;

    if (secret) {
      if (!signature) {
        console.error("Missing mux-signature header");
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 401 }
        );
      }
      if (!verifyMuxSignature(rawBody, signature, secret)) {
        console.error("Invalid Mux webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    } else {
      console.warn(
        "MUX_WEBHOOK_SECRET not configured — skipping signature verification"
      );
    }

    const body = JSON.parse(rawBody);
    const hookType = body.type as string;

    const supabase = createAdminClient();

    // ── Video Upload (on-demand) ──────────────────────────
    if (hookType === "video.upload.asset_ready") {
      const uploadId = body.data?.id as string;
      const asset = body.data?.asset as {
        id: string;
        playback_ids?: Array<{ id: string; policy: string }>;
      };

      if (!uploadId || !asset) {
        return NextResponse.json({ received: true });
      }

      const playbackId =
        asset.playback_ids?.find((p) => p.policy === "public")?.id ??
        asset.playback_ids?.[0]?.id;

      const { error } = await supabase
        .from("posts")
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: playbackId || null,
          video_status: "ready",
        })
        .eq("mux_upload_id", uploadId);

      if (error) {
        console.error("Failed to update post with Mux asset:", error);
      }

      // Also check channel_videos table
      const { error: channelVideoError } = await supabase
        .from("channel_videos")
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: playbackId || null,
          status: "ready",
        })
        .eq("mux_upload_id", uploadId);

      if (channelVideoError) {
        console.error(
          "Failed to update channel_video with Mux asset:",
          channelVideoError
        );
      }
    } else if (hookType === "video.asset.errored") {
      const assetId = body.data?.id as string;
      if (assetId) {
        await supabase
          .from("posts")
          .update({ video_status: "errored" })
          .eq("mux_asset_id", assetId);

        // Also update channel_videos
        await supabase
          .from("channel_videos")
          .update({ status: "errored" })
          .eq("mux_asset_id", assetId);
      }
    }

    // ── Live Streaming ────────────────────────────────────
    else if (hookType === "video.live_stream.active") {
      // Stream went live
      const streamId = body.data?.id as string;
      if (streamId) {
        const { error } = await supabase
          .from("live_streams")
          .update({
            status: "active",
            started_at: new Date().toISOString(),
          })
          .eq("mux_stream_id", streamId);

        if (error) {
          console.error("Failed to activate live stream:", error);
        } else {
          console.log(`Live stream ${streamId} is now ACTIVE`);
        }
      }
    } else if (hookType === "video.live_stream.idle") {
      // Stream stopped
      const streamId = body.data?.id as string;
      if (streamId) {
        const { error } = await supabase
          .from("live_streams")
          .update({
            status: "idle",
            ended_at: new Date().toISOString(),
          })
          .eq("mux_stream_id", streamId);

        if (error) {
          console.error("Failed to idle live stream:", error);
        } else {
          console.log(`Live stream ${streamId} is now IDLE`);
        }
      }
    } else if (hookType === "video.live_stream.disabled") {
      const streamId = body.data?.id as string;
      if (streamId) {
        await supabase
          .from("live_streams")
          .update({
            status: "disabled",
            ended_at: new Date().toISOString(),
          })
          .eq("mux_stream_id", streamId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mux webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
