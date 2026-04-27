"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export type ReportableType =
  | "post"
  | "comment"
  | "review"
  | "business"
  | "event"
  | "group"
  | "reel"
  | "album"
  | "track"
  | "profile";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "Spam" },
  { value: "inappropriate", label: "Inappropriate" },
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate / Discrimination" },
  { value: "misinformation", label: "Misinformation" },
  { value: "illegal", label: "Illegal" },
  { value: "other", label: "Other" },
];

/**
 * Drop-in report button for any entity. Opens a small inline sheet,
 * collects reason + optional notes, POSTs to /api/reports. Pairs
 * visually with <ShareButton> / <SaveButton> in entity headers.
 */
export default function ReportButton({
  contentType,
  contentId,
  size = "md",
}: {
  contentType: ReportableType;
  contentId: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          details: details.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Report failed");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setSubmitting(false);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setDetails("");
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report failed");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report"
        className={`inline-flex items-center justify-center rounded-full ${
          size === "sm" ? "w-7 h-7" : "w-9 h-9"
        }`}
        style={{
          background: "var(--paper)",
          border: "1.5px solid var(--rule-c)",
          color: "var(--ink-mute)",
        }}
      >
        <Icon name="flag" size={size === "sm" ? 12 : 14} />
      </button>
    );
  }

  return (
    <div
      className="p-3 rounded-xl"
      style={{
        background: "var(--paper-warm)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      {done ? (
        <p className="text-sm" style={{ color: "var(--ink-strong)" }}>
          Thanks — ops will review it.
        </p>
      ) : (
        <>
          <p
            className="c-kicker mb-2"
            style={{ color: "var(--ink-mute)", fontSize: 11 }}
          >
            § REPORT
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 mb-2 text-sm"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add detail (optional)…"
            rows={2}
            className="w-full px-3 py-2 text-sm mb-2"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          />
          {error && (
            <p
              className="text-xs mb-2"
              style={{ color: "var(--red-c, #E84855)" }}
            >
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="text-xs"
              style={{ color: "var(--ink-mute)" }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider"
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
              }}
            >
              {submitting ? "SENDING…" : "SUBMIT"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
