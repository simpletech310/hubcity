"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "sports", label: "🏈 Sports" },
  { value: "government", label: "🏛️ Government" },
  { value: "education", label: "📚 Education" },
  { value: "culture", label: "🎨 Culture" },
  { value: "community", label: "👥 Community" },
];

export default function CreateStreamModal({
  isOpen,
  onClose,
}: CreateStreamModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("sports");
  const [scheduledAt, setScheduledAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    rtmp_url: string;
    mux_stream_key: string;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Give your stream a title");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/mux/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          scheduled_at: scheduledAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create stream");
      }

      const data = await res.json();
      setCreated({
        rtmp_url: data.stream.rtmp_url,
        mux_stream_key: data.stream.mux_stream_key,
        title: data.stream.title,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    if (!submitting) {
      setTitle("");
      setDescription("");
      setCategory("sports");
      setScheduledAt("");
      setError("");
      if (created) {
        router.refresh();
      }
      setCreated(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[430px] bg-card border-t border-border-subtle rounded-t-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-border-subtle">
          <button
            onClick={handleClose}
            className="text-sm text-txt-secondary press"
          >
            {created ? "Done" : "Cancel"}
          </button>
          <span className="text-sm font-heading font-bold text-coral">
            {created ? "Stream Ready!" : "New Stream"}
          </span>
          {!created && (
            <Button
              size="sm"
              onClick={handleSubmit}
              loading={submitting}
            >
              Create
            </Button>
          )}
          {created && <div className="w-12" />}
        </div>

        {error && (
          <div className="mx-5 mt-3 bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5 text-xs text-coral">
            {error}
          </div>
        )}

        {/* Created — show stream key */}
        {created ? (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-emerald/10 border border-emerald/20 p-4 text-center">
              <p className="text-sm font-semibold text-emerald mb-1">
                Stream Created!
              </p>
              <p className="text-[11px] text-txt-secondary">
                Use these credentials in OBS, Streamyard, or any RTMP app
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  Stream Title
                </label>
                <div className="bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm">
                  {created.title}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  RTMP URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-xs font-mono truncate">
                    {created.rtmp_url}
                  </div>
                  <button
                    onClick={() => handleCopy(created.rtmp_url, "rtmp")}
                    className={`shrink-0 px-3 py-3 rounded-xl border text-xs font-semibold press transition-all ${
                      copied === "rtmp"
                        ? "bg-emerald/20 border-emerald/30 text-emerald"
                        : "bg-white/5 border-border-subtle text-txt-secondary hover:text-white"
                    }`}
                  >
                    {copied === "rtmp" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                  Stream Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-xs font-mono truncate">
                    {created.mux_stream_key}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(created.mux_stream_key, "key")
                    }
                    className={`shrink-0 px-3 py-3 rounded-xl border text-xs font-semibold press transition-all ${
                      copied === "key"
                        ? "bg-emerald/20 border-emerald/30 text-emerald"
                        : "bg-white/5 border-border-subtle text-txt-secondary hover:text-white"
                    }`}
                  >
                    {copied === "key" ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-gold/10 border border-gold/20 p-4">
              <p className="text-[11px] text-gold font-semibold mb-1">
                How to go live:
              </p>
              <ol className="text-[11px] text-txt-secondary space-y-1 list-decimal list-inside">
                <li>Open OBS, Streamyard, or Larix Broadcaster</li>
                <li>Paste the RTMP URL as the server</li>
                <li>Paste the Stream Key</li>
                <li>Hit &quot;Start Streaming&quot; — you&apos;re live!</li>
              </ol>
            </div>
          </div>
        ) : (
          /* Form */
          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                Stream Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Compton High vs Dominguez — Varsity Football"
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-coral/40 transition-colors"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are we streaming?"
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-coral/40 transition-colors resize-none min-h-[60px]"
                maxLength={300}
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium press transition-all ${
                      category === cat.value
                        ? "bg-coral/20 text-coral border border-coral/30"
                        : "bg-white/5 text-txt-secondary border border-border-subtle hover:border-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scheduled time */}
            <div>
              <label className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider block mb-1.5">
                Scheduled Time (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-coral/40 transition-colors"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
