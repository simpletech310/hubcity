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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full max-w-[430px] bg-card border-t border-border-subtle rounded-t-3xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-border-subtle">
          <span className="text-sm font-heading font-bold text-gold">Create Poll</span>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-txt-secondary hover:text-white press transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {error && (
            <div className="bg-coral/10 border border-coral/20 rounded-xl px-4 py-2.5 text-xs text-coral">
              {error}
            </div>
          )}

          {/* Poll type toggle */}
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-2 block">Poll Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPollType("multiple_choice")}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all press ${
                  pollType === "multiple_choice"
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "bg-deep/50 text-txt-secondary border border-border-subtle hover:border-white/10"
                }`}
              >
                Multiple Choice
              </button>
              <button
                type="button"
                onClick={() => setPollType("temperature_check")}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all press ${
                  pollType === "temperature_check"
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "bg-deep/50 text-txt-secondary border border-border-subtle hover:border-white/10"
                }`}
              >
                Temperature Check
              </button>
            </div>
          </div>

          {/* Question */}
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-2 block">Question</label>
            <div className="relative">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask your community something..."
                maxLength={280}
                rows={3}
                className="w-full bg-deep/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-txt-primary placeholder:text-txt-secondary/50 focus:border-gold/30 focus:outline-none resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-txt-secondary">
                {question.length}/280
              </span>
            </div>
          </div>

          {/* Options */}
          {pollType === "multiple_choice" ? (
            <div>
              <label className="text-xs font-medium text-txt-secondary mb-2 block">Options</label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.emoji}
                      onChange={(e) => updateOption(opt.id, "emoji", e.target.value)}
                      placeholder="\uD83D\uDE00"
                      maxLength={2}
                      className="w-10 bg-deep/50 border border-border-subtle rounded-lg px-2 py-3 text-sm text-center text-txt-primary placeholder:text-txt-secondary/50 focus:border-gold/30 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(opt.id, "label", e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      maxLength={80}
                      className="flex-1 bg-deep/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-txt-primary placeholder:text-txt-secondary/50 focus:border-gold/30 focus:outline-none"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(opt.id)}
                        className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-txt-secondary hover:text-coral press transition-colors shrink-0"
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
                  className="mt-2 flex items-center gap-1.5 text-xs text-gold hover:text-gold-light press transition-colors"
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
              <label className="text-xs font-medium text-txt-secondary mb-2 block">Temperature Scale Preview</label>
              <div className="bg-deep/50 border border-border-subtle rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{TEMP_CHECK_OPTIONS[1].emoji}</span>
                    <span className="text-xs text-txt-secondary font-medium">Cold</span>
                  </div>
                  <div className="flex-1 mx-4 h-2 rounded-full bg-gradient-to-r from-blue-500 via-yellow-400 to-red-500 opacity-60" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-txt-secondary font-medium">Hot</span>
                    <span className="text-2xl">{TEMP_CHECK_OPTIONS[0].emoji}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-txt-primary font-medium">Anonymous</p>
              <p className="text-xs text-txt-secondary">Hide voter identities</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-11 h-6 rounded-full transition-colors press ${
                isAnonymous ? "bg-gold" : "bg-deep/50 border border-border-subtle"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isAnonymous ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Ends at */}
          <div>
            <label className="text-xs font-medium text-txt-secondary mb-2 block">Ends at (optional)</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full bg-deep/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-txt-primary focus:border-gold/30 focus:outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border-subtle">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all press bg-gradient-to-r from-gold to-gold-light text-midnight ${
              submitting ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Publishing...
              </span>
            ) : (
              "Publish Poll"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
