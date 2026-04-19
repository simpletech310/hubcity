"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/**
 * Courier-side action block: "Mark picked up" and "Mark delivered" buttons,
 * plus a photo upload step tied to the delivered transition.
 *
 * Uploads go to the public `post-images` bucket under a courier-scoped path
 * (same bucket the rest of the app uses — avoids a new bucket migration).
 * If the bucket isn't writable in the current env, the call fails gracefully
 * and the courier can still mark delivered without a photo.
 */
export default function DeliveryActions({
  deliveryId,
  status,
  proofPhotoUrl,
  userId,
}: {
  deliveryId: string;
  status: string;
  proofPhotoUrl: string | null;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(proofPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatus(next: "picked_up" | "delivered") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          proof_photo_url: next === "delivered" ? photo : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Update failed");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      setLoading(false);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/delivery-${deliveryId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setPhoto(data.publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (status === "delivered" || status === "cancelled" || status === "failed") {
    return (
      <div className="rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 p-4">
        <p className="text-sm text-emerald-400 font-semibold">
          {status === "delivered"
            ? "Delivery complete."
            : status === "cancelled"
              ? "Delivery cancelled."
              : "Delivery failed."}
        </p>
        {photo && (
          <img
            src={photo}
            alt="Proof of delivery"
            className="mt-3 rounded-lg max-h-48"
          />
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gold/[0.08] border border-gold/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <h3 className="text-xs font-semibold text-gold uppercase tracking-wider">
          Actions
        </h3>
      </div>

      {status === "assigned" && (
        <Button onClick={() => handleStatus("picked_up")} disabled={loading}>
          {loading ? "Updating…" : "Mark picked up"}
        </Button>
      )}

      {status === "picked_up" && (
        <>
          <div className="space-y-2">
            <label className="block text-xs text-txt-secondary">
              Proof of delivery (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
              disabled={uploading}
              className="text-xs text-txt-secondary"
            />
            {photo && (
              <img
                src={photo}
                alt="Proof preview"
                className="rounded-lg max-h-32"
              />
            )}
          </div>
          <Button
            onClick={() => handleStatus("delivered")}
            disabled={loading || uploading}
          >
            {loading ? "Updating…" : "Mark delivered"}
          </Button>
        </>
      )}

      {error && <p className="text-xs text-coral-400">{error}</p>}
    </div>
  );
}
