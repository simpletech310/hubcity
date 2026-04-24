"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { value: "sports", label: "SPORTS" },
  { value: "government", label: "GOVERNMENT" },
  { value: "education", label: "EDUCATION" },
  { value: "culture", label: "CULTURE" },
  { value: "community", label: "COMMUNITY" },
];

const inputStyle: React.CSSProperties = {
  background: "var(--paper-warm)",
  border: "2px solid var(--rule-strong-c)",
  color: "var(--ink-strong)",
  fontSize: 14,
  fontFamily: "var(--font-archivo), Archivo, sans-serif",
};

const monoValueStyle: React.CSSProperties = {
  background: "var(--paper-warm)",
  border: "2px solid var(--rule-strong-c)",
  color: "var(--ink-strong)",
  fontSize: 12,
  fontFamily: "var(--font-dm-mono), monospace",
  letterSpacing: "0.04em",
};

const labelClass = "c-kicker block mb-1.5";
const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--ink-strong)",
  opacity: 0.7,
  letterSpacing: "0.14em",
};

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
      {/* Backdrop — stays dark, no blur */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(10,10,10,0.7)" }}
        onClick={handleClose}
      />

      {/* Panel — paper sheet, ink top rule, hard corners */}
      <div
        className="relative w-full max-w-[430px] animate-slide-up max-h-[85vh] overflow-y-auto"
        style={{
          background: "var(--paper)",
          borderTop: "3px solid var(--rule-strong-c)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            style={{ width: 40, height: 3, background: "var(--ink-strong)", opacity: 0.25 }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <button
            onClick={handleClose}
            className="c-kicker press"
            style={{ fontSize: 11, color: "var(--ink-strong)", letterSpacing: "0.14em" }}
          >
            {created ? "DONE" : "CANCEL"}
          </button>
          <span
            className="c-kicker"
            style={{
              fontSize: 11,
              color: "var(--ink-strong)",
              letterSpacing: "0.16em",
              background: created ? "var(--gold-c)" : "transparent",
              padding: created ? "2px 10px" : 0,
              border: created ? "2px solid var(--rule-strong-c)" : "none",
            }}
          >
            {created ? "STREAM READY" : "NEW STREAM"}
          </span>
          {!created && (
            <Button size="sm" onClick={handleSubmit} loading={submitting}>
              Create
            </Button>
          )}
          {created && <div className="w-12" />}
        </div>

        {error && (
          <div
            className="mx-5 mt-3 px-4 py-2.5"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
              fontSize: 12,
              fontFamily: "var(--font-archivo-narrow), sans-serif",
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        {/* Created — show stream key */}
        {created ? (
          <div className="p-5 space-y-4">
            <div
              className="p-4 text-center"
              style={{
                background: "var(--gold-c)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <p
                className="c-hero"
                style={{ fontSize: 18, color: "var(--ink-strong)", lineHeight: 1 }}
              >
                STREAM CREATED
              </p>
              <p
                className="c-serif-it mt-1"
                style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.8 }}
              >
                Use these credentials in OBS, Streamyard, or any RTMP app
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass} style={labelStyle}>STREAM TITLE</label>
                <div className="px-4 py-3" style={inputStyle}>
                  {created.title}
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>RTMP URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 truncate" style={monoValueStyle}>
                    {created.rtmp_url}
                  </div>
                  <button
                    onClick={() => handleCopy(created.rtmp_url, "rtmp")}
                    className="shrink-0 c-btn c-btn-sm press"
                    style={{
                      background: copied === "rtmp" ? "var(--gold-c)" : "var(--paper)",
                      color: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {copied === "rtmp" ? "COPIED" : "COPY"}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass} style={labelStyle}>STREAM KEY</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 truncate" style={monoValueStyle}>
                    {created.mux_stream_key}
                  </div>
                  <button
                    onClick={() => handleCopy(created.mux_stream_key, "key")}
                    className="shrink-0 c-btn c-btn-sm press"
                    style={{
                      background: copied === "key" ? "var(--gold-c)" : "var(--paper)",
                      color: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {copied === "key" ? "COPIED" : "COPY"}
                  </button>
                </div>
              </div>
            </div>

            <div
              className="p-4"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <p
                className="c-kicker mb-1"
                style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.16em" }}
              >
                HOW TO GO LIVE:
              </p>
              <ol
                className="space-y-1 list-decimal list-inside"
                style={{ fontSize: 12, color: "var(--paper)", opacity: 0.85 }}
              >
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
              <label className={labelClass} style={labelStyle}>STREAM TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Compton High vs Dominguez — Varsity Football"
                className="w-full px-4 py-3 focus:outline-none"
                style={inputStyle}
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass} style={labelStyle}>DESCRIPTION</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are we streaming?"
                className="w-full px-4 py-3 focus:outline-none resize-none min-h-[60px]"
                style={{ ...inputStyle, fontFamily: "var(--font-fraunces), serif" }}
                maxLength={300}
              />
            </div>

            {/* Category */}
            <div>
              <label className={labelClass} style={labelStyle}>CATEGORY</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const selected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className="press c-kicker"
                      style={{
                        background: selected ? "var(--gold-c)" : "var(--paper)",
                        color: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        padding: "6px 10px",
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scheduled time */}
            <div>
              <label className={labelClass} style={labelStyle}>SCHEDULED TIME (OPTIONAL)</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-3 focus:outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
