"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "@/components/ui/Icon";

interface Props {
  challengeId: string;
  challengeName: string;
}

export default function CompleteChallengeButton({ challengeId, challengeName }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be under 10 MB");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setError("You must be signed in to submit a completion");
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/challenges/${challengeId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("media")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
      setPhotoUrl(pub.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/food/challenges/${challengeId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: photoUrl || null,
          caption: caption.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setPhotoUrl("");
        setCaption("");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="c-btn c-btn-primary w-full press"
      >
        I DID THIS!
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && !uploading && setOpen(false)}
          />
          <div
            className="relative w-full max-w-[480px] animate-slide-up"
            style={{
              background: "var(--paper)",
              borderTop: "3px solid var(--rule-strong-c)",
              borderLeft: "3px solid var(--rule-strong-c)",
              borderRight: "3px solid var(--rule-strong-c)",
            }}
          >
            <div className="px-5 pt-5 pb-6">
              <p className="c-kicker mb-1" style={{ opacity: 0.7 }}>§ COMPLETION</p>
              <h3 className="c-card-t mb-4" style={{ fontSize: 18, color: "var(--ink-strong)" }}>
                Did you finish {challengeName}?
              </h3>

              {success ? (
                <div className="text-center py-8">
                  <div
                    className="w-14 h-14 mx-auto flex items-center justify-center mb-3"
                    style={{
                      background: "var(--gold-c)",
                      border: "3px solid var(--rule-strong-c)",
                    }}
                  >
                    <Icon name="check" size={28} style={{ color: "var(--ink-strong)" }} />
                  </div>
                  <p className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>
                    Submission posted!
                  </p>
                </div>
              ) : (
                <>
                  <label
                    className="block w-full text-center py-6 cursor-pointer mb-3"
                    style={{
                      background: photoUrl ? "transparent" : "var(--paper-warm)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {uploading ? (
                      <span className="c-meta" style={{ color: "var(--ink-strong)" }}>
                        Uploading…
                      </span>
                    ) : photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoUrl} alt="Your submission" className="max-h-48 mx-auto" />
                    ) : (
                      <span className="c-meta" style={{ color: "var(--ink-strong)" }}>
                        📸 Tap to upload your photo
                      </span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={uploading || submitting}
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                  </label>

                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption (optional) — how was it?"
                    rows={2}
                    className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
                    style={{
                      background: "var(--paper-warm)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  />

                  {error && (
                    <p
                      className="c-meta mt-3 px-3 py-2"
                      style={{
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={submitting || uploading}
                      className="c-btn c-btn-outline flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting || uploading}
                      className="c-btn c-btn-primary flex-1 disabled:opacity-50"
                    >
                      {submitting ? "Posting…" : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
