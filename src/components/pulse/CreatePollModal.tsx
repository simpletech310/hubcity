"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PollType } from "@/types/database";

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PollOptionItem {
  id: string;
  label: string;
  emoji: string;
}

const TEMP_CHECK_OPTIONS: PollOptionItem[] = [
  { id: "hot", label: "Hot", emoji: "\uD83D\uDD25" },
  { id: "cold", label: "Cold", emoji: "\u2744\uFE0F" },
];

export default function CreatePollModal({ isOpen, onClose }: CreatePollModalProps) {
  const router = useRouter();

  const [pollType, setPollType] = useState<PollType>("multiple_choice");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOptionItem[]>([
    { id: crypto.randomUUID(), label: "", emoji: "" },
    { id: crypto.randomUUID(), label: "", emoji: "" },
  ]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { id: crypto.randomUUID(), label: "", emoji: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  };

  const updateOption = (id: string, field: "label" | "emoji", value: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const handleClose = () => {
    if (submitting) return;
    setQuestion("");
    setPollType("multiple_choice");
    setOptions([
      { id: crypto.randomUUID(), label: "", emoji: "" },
      { id: crypto.randomUUID(), label: "", emoji: "" },
    ]);
    setIsAnonymous(false);
    setEndsAt("");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    if (pollType === "multiple_choice") {
      const filled = options.filter((o) => o.label.trim());
      if (filled.length < 2) {
        setError("Add at least 2 options");
        return;
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const submitOptions =
        pollType === "temperature_check"
          ? TEMP_CHECK_OPTIONS.map((o, i) => ({ label: o.label, emoji: o.emoji, sort_order: i }))
          : options
              .filter((o) => o.label.trim())
              .map((o, i) => ({ label: o.label.trim(), emoji: o.emoji || null, sort_order: i }));

      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          poll_type: pollType,
          options: submitOptions,
          ends_at: endsAt || null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create poll");
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop (stays dark — scrim) */}
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-[430px] animate-slide-up max-h-[85vh] flex flex-col"
        style={{
          background: "var(--paper)",
          borderTop: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className="w-10 h-1"
            style={{ background: "var(--rule-strong-c)", opacity: 0.3, borderRadius: 999 }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pb-3"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <span className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
            § CREATE POLL
          </span>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center press transition-colors"
            style={{
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div
              className="px-4 py-2.5"
              style={{
                background: "rgba(232, 72, 85, 0.1)",
                border: "2px solid #E84855",
                color: "#E84855",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          {/* Poll type toggle */}
          <div>
            <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>POLL TYPE</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPollType("multiple_choice")}
                className="flex-1 px-4 py-2.5 c-card-t transition-all press"
                style={
                  pollType === "multiple_choice"
                    ? { background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)" }
                    : { background: "transparent", color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }
                }
              >
                Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => setPollType("temperature_check")}
                className="flex-1 px-4 py-2.5 c-card-t transition-all press"
                style={
                  pollType === "temperature_check"
                    ? { background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)" }
                    : { background: "transparent", color: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }
                }
              >
                Temperature Check
              </button>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>QUESTION</label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your community something..."
                maxLength={280}
                rows={3}
                className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                }}
              />
              <span className="absolute bottom-2 right-3 c-meta" style={{ fontSize: 10 }}>
                {question.length}/280
              </span>
            </div>
          </div>

          {/* Options */}
          {pollType === "multiple_choice" ? (
            <div>
              <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>OPTIONS</label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.emoji}
                      onChange={(e) => updateOption(opt.id, "emoji", e.target.value)}
                      placeholder="\uD83D\uDE00"
                      maxLength={2}
                      className="w-10 px-2 py-3 text-sm text-center focus:outline-none"
                      style={{
                        background: "var(--paper-warm)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                      }}
                    />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={80}
                      className="flex-1 px-4 py-3 text-sm focus:outline-none"
                      style={{
                        background: "var(--paper-warm)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                      }}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="w-8 h-8 flex items-center justify-center press transition-colors shrink-0"
                        style={{ border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 flex items-center gap-1.5 c-meta press transition-colors"
                  style={{ color: "var(--ink-strong)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Option
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>TEMPERATURE SCALE PREVIEW</label>
              <div
                className="p-4"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TEMP_CHECK_OPTIONS[1].emoji}</span>
                    <span className="c-meta">Cold</span>
                  </div>
                  <div className="flex-1 mx-4 h-2 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500 opacity-60" />
                  <div className="flex items-center gap-2">
                    <span className="c-meta">Hot</span>
                    <span className="text-2xl">{TEMP_CHECK_OPTIONS[0].emoji}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="c-card-t" style={{ fontSize: 12 }}>Anonymous</p>
              <p className="c-meta">Hide voter identities</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className="relative w-11 h-6 rounded-full transition-colors press"
              style={
                isAnonymous
                  ? { background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }
                  : { background: "transparent", border: "2px solid var(--rule-strong-c)" }
              }
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                  isAnonymous ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
                style={{ background: "var(--ink-strong)" }}
              />
            </button>
          </div>

          {/* Ends at */}
          <div>
            <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>ENDS AT (OPTIONAL)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`c-btn c-btn-primary w-full press ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                PUBLISHING...
              </span>
            ) : (
              "PUBLISH POLL"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
