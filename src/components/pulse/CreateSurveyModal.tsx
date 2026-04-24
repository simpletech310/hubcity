"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionType } from "@/types/database";

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SurveyQuestionItem {
  id: string;
  question: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Text",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
  rating: "Rating (1-5)",
  scale: "Scale (1-10)",
};

function createEmptyQuestion(): SurveyQuestionItem {
  return {
    id: crypto.randomUUID(),
    question: "",
    type: "text",
    options: ["", ""],
    required: true,
  };
}

const CHOICE_TYPES: QuestionType[] = ["single_choice", "multiple_choice"];

export default function CreateSurveyModal({ isOpen, onClose }: CreateSurveyModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestionItem[]>([createEmptyQuestion()]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [endsAt, setEndsAt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const updateQuestion = (id: string, updates: Partial<SurveyQuestionItem>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const addQuestion = () => {
    if (questions.length >= 20) return;
    setQuestions([...questions, createEmptyQuestion()]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (qId: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q || q.options.length >= 8) return;
    updateQuestion(qId, { options: [...q.options, ""] });
  };

  const removeOption = (qId: string, optIdx: number) => {
    const q = questions.find((q) => q.id === qId);
    if (!q || q.options.length <= 2) return;
    updateQuestion(qId, { options: q.options.filter((_, i) => i !== optIdx) });
  };

  const updateOption = (qId: string, optIdx: number, value: string) => {
    const q = questions.find((q) => q.id === qId);
    if (!q) return;
    const newOpts = [...q.options];
    newOpts[optIdx] = value;
    updateQuestion(qId, { options: newOpts });
  };

  const handleClose = () => {
    if (submitting) return;
    setTitle("");
    setDescription("");
    setQuestions([createEmptyQuestion()]);
    setIsAnonymous(false);
    setEndsAt("");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a survey title");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is missing text`);
        return;
      }
      if (CHOICE_TYPES.includes(q.type)) {
        const filled = q.options.filter((o) => o.trim());
        if (filled.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError("");

    try {
      const submitQuestions = questions.map((q, i) => ({
        question: q.question.trim(),
        type: q.type,
        options: CHOICE_TYPES.includes(q.type)
          ? q.options.filter((o) => o.trim()).map((o) => o.trim())
          : null,
        required: q.required,
        sort_order: i,
      }));

      const res = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          questions: submitQuestions,
          ends_at: endsAt || null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create survey");
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
        className="relative w-full max-w-[430px] animate-slide-up max-h-[90vh] flex flex-col"
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
          <span className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>§ CREATE SURVEY</span>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center press transition-colors"
            style={{ border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
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

          {/* Title */}
          <div>
            <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>TITLE</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Survey title..."
              maxLength={100}
              className="w-full px-4 py-3 text-sm focus:outline-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            />
            <span className="c-meta mt-1 block text-right" style={{ fontSize: 10 }}>{title.length}/100</span>
          </div>

          {/* Description */}
          <div>
            <label className="c-kicker mb-2 block" style={{ fontSize: 10 }}>DESCRIPTION (OPTIONAL)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this survey about?"
              maxLength={500}
              rows={2}
              className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
              }}
            />
            <span className="c-meta mt-1 block text-right" style={{ fontSize: 10 }}>{description.length}/500</span>
          </div>

          {/* Questions */}
          <div>
            <label className="c-kicker mb-3 block" style={{ fontSize: 10 }}>
              QUESTIONS ({questions.length}/20)
            </label>

            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-4 space-y-3"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {/* Question header */}
                  <div className="flex items-center justify-between">
                    <span className="c-kicker" style={{ fontSize: 10 }}>Q{qIdx + 1}</span>
                    <div className="flex items-center gap-2">
                      {/* Required toggle */}
                      <button
                        type="button"
                        onClick={() => updateQuestion(q.id, { required: !q.required })}
                        className="px-2 py-1 c-meta transition-colors press"
                        style={
                          q.required
                            ? { background: "var(--gold-c)", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)", fontSize: 10 }
                            : { background: "transparent", color: "var(--ink-strong)", border: "1.5px solid var(--rule-strong-c)", fontSize: 10 }
                        }
                      >
                        {q.required ? "REQUIRED" : "OPTIONAL"}
                      </button>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="w-6 h-6 flex items-center justify-center press transition-colors"
                          style={{ border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                    placeholder="Enter your question..."
                    maxLength={300}
                    className="w-full px-4 py-3 text-sm focus:outline-none"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  />

                  {/* Question type */}
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
                    className="w-full px-4 py-3 text-sm focus:outline-none appearance-none cursor-pointer"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                    }}
                  >
                    {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
                      <option key={type} value={type}>
                        {QUESTION_TYPE_LABELS[type]}
                      </option>
                    ))}
                  </select>

                  {/* Choice options (for single_choice and multiple_choice) */}
                  {CHOICE_TYPES.includes(q.type) && (
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            maxLength={100}
                            className="flex-1 px-3 py-2 text-xs focus:outline-none"
                            style={{
                              background: "var(--paper)",
                              border: "2px solid var(--rule-strong-c)",
                              color: "var(--ink-strong)",
                            }}
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(q.id, optIdx)}
                              className="w-6 h-6 flex items-center justify-center press transition-colors shrink-0"
                              style={{ border: "2px solid var(--rule-strong-c)", color: "var(--ink-strong)" }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 8 && (
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="flex items-center gap-1 c-meta press transition-colors"
                          style={{ color: "var(--ink-strong)" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                          Add Option
                        </button>
                      )}
                    </div>
                  )}

                  {/* Preview for rating type */}
                  {q.type === "rating" && (
                    <div className="flex items-center gap-1 px-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className="text-lg" style={{ color: "var(--gold-c)" }}>{"\u2605"}</span>
                      ))}
                      <span className="c-meta ml-2">1-5 stars</span>
                    </div>
                  )}

                  {/* Preview for scale type */}
                  {q.type === "scale" && (
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 flex items-center justify-center c-meta"
                          style={{
                            background: "var(--paper)",
                            border: "1.5px solid var(--rule-strong-c)",
                            fontSize: 10,
                          }}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {questions.length < 20 && (
              <button
                type="button"
                onClick={addQuestion}
                className="mt-3 flex items-center gap-1.5 c-meta press transition-colors"
                style={{ color: "var(--ink-strong)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Question
              </button>
            )}
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="c-card-t" style={{ fontSize: 12 }}>Anonymous</p>
              <p className="c-meta">Hide respondent identities</p>
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
              "PUBLISH SURVEY"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
