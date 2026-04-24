"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Survey, SurveyQuestion } from "@/types/database";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import Icon from "@/components/ui/Icon";

interface SurveyCardProps {
  survey: Survey;
  userId: string | null;
}

export default function SurveyCard({ survey, userId }: SurveyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasResponded, setHasResponded] = useState(survey.user_responded ?? false);
  const [responseCount, setResponseCount] = useState(survey.response_count);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const author = survey.author;
  const initials = author?.display_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const roleBadge = author?.role ? ROLE_BADGE_MAP[author.role] : null;
  const isVerified =
    author?.verification_status === "verified" ||
    author?.role === "city_official" ||
    author?.role === "admin";

  const timeAgo = getTimeAgo(survey.created_at);
  const isClosed = survey.status === "closed";
  const timeRemaining = survey.ends_at ? getTimeRemaining(survey.ends_at) : null;

  const sortedQuestions = [...(survey.questions || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const handleSubmit = useCallback(async () => {
    if (!userId || isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    // Optimistic update
    const prevResponded = hasResponded;
    const prevCount = responseCount;
    setHasResponded(true);
    setResponseCount((prev) => prev + 1);
    setIsExpanded(false);

    try {
      const res = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }
    } catch (err) {
      // Rollback
      setHasResponded(prevResponded);
      setResponseCount(prevCount);
      setIsExpanded(true);
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, isSubmitting, survey.id, answers, hasResponded, responseCount]);

  const updateAnswer = useCallback(
    (questionId: string, value: string | string[] | number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  return (
    <Card hover className="relative overflow-hidden">
      {/* Type label row */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span><Icon name="document" size={16} /></span>
        <span className="c-kicker">SURVEY</span>
        {isClosed && (
          <span className="ml-1">
            <Badge label="Closed" variant="coral" />
          </span>
        )}
      </div>

      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        {author?.avatar_url ? (
          <Image
            src={author.avatar_url}
            alt={author.display_name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover"
            style={{ border: "2px solid var(--rule-strong-c)" }}
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--ink-strong)",
            }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-[13px] font-bold truncate"
              style={{ color: "var(--ink-strong)" }}
            >
              {author?.display_name || "Unknown"}
            </p>
            {isVerified && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="shrink-0"
                style={{ color: "var(--ink-strong)" }}
              >
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
            {roleBadge && (
              <Badge label={roleBadge.label} variant={roleBadge.variant} />
            )}
          </div>
          <p className="c-meta">{timeAgo}</p>
        </div>
      </div>

      {/* Title & description */}
      <p
        className="c-card-t leading-snug"
        style={{ color: "var(--ink-strong)" }}
      >
        {survey.title}
      </p>
      {survey.description && (
        <p
          className="c-body text-[12px] mt-1 leading-relaxed"
          style={{ color: "var(--ink-strong)" }}
        >
          {survey.description}
        </p>
      )}
      <p className="c-meta mt-1.5 mb-3">
        {sortedQuestions.length} question{sortedQuestions.length !== 1 ? "s" : ""}
      </p>

      {/* Survey body */}
      {hasResponded ? (
        <div className="flex items-center gap-2 mb-1">
          <Badge
            label="Responded"
            variant="emerald"
            icon={<span className="text-[9px]"><Icon name="check" size={16} /></span>}
          />
          <span className="c-meta">
            {responseCount} {responseCount === 1 ? "response" : "responses"}
          </span>
        </div>
      ) : isClosed ? (
        <div className="flex items-center gap-2 mb-1">
          <span className="c-meta">
            {responseCount} {responseCount === 1 ? "response" : "responses"}
          </span>
        </div>
      ) : !isExpanded ? (
        <div>
          {userId ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="c-btn c-btn-primary w-full press"
            >
              Take Survey
            </button>
          ) : (
            <p className="c-meta text-center py-2" style={{ color: "var(--ink-strong)" }}>
              Sign in to participate
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div
              className="px-4 py-2.5 text-[11px]"
              style={{
                background: "var(--paper-soft)",
                border: "2px solid var(--red-c, #c0392b)",
                color: "var(--red-c, #c0392b)",
              }}
            >
              {error}
            </div>
          )}

          {sortedQuestions.map((q, idx) => (
            <QuestionField
              key={q.id}
              question={q}
              index={idx + 1}
              value={answers[q.id]}
              onChange={(val) => updateAnswer(q.id, val)}
            />
          ))}

          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(false)}
              className="c-btn c-btn-outline flex-1 press"
            >
              Cancel
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleSubmit}
              className={`c-btn c-btn-primary flex-1 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "press"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: "2px solid var(--rule-strong-c)" }}
      >
        <div className="flex items-center gap-3">
          <span className="c-meta">
            {responseCount} {responseCount === 1 ? "response" : "responses"}
          </span>
          {timeRemaining && !isClosed && (
            <span className="c-meta">{timeRemaining}</span>
          )}
        </div>
        <button
          className="press transition-colors"
          style={{ color: "var(--ink-strong)" }}
          onClick={(e) => {
            e.stopPropagation();
            if (navigator.share) {
              navigator.share({ url: `/pulse/surveys/${survey.id}` });
            }
          }}
          aria-label="Share"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </Card>
  );
}

/* ── Question Field ────────────────────────────────── */

function QuestionField({
  question,
  index,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  index: number;
  value: string | string[] | number | undefined;
  onChange: (val: string | string[] | number) => void;
}) {
  const parsedOptions: string[] = Array.isArray(question.options)
    ? question.options
    : typeof question.options === "string"
      ? JSON.parse(question.options)
      : [];

  return (
    <div>
      <label
        className="block text-[12px] font-semibold mb-1.5"
        style={{ color: "var(--ink-strong)" }}
      >
        <span className="c-meta mr-1">Q{index}.</span>
        {question.question}
        {question.required && (
          <span className="ml-0.5" style={{ color: "var(--red-c, #c0392b)" }}>*</span>
        )}
      </label>

      {/* Text */}
      {question.type === "text" && (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="Your answer..."
          className="w-full px-3 py-2.5 text-[12px] resize-none focus:outline-none transition-all"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
          }}
        />
      )}

      {/* Single choice */}
      {question.type === "single_choice" && (
        <div className="space-y-1.5">
          {parsedOptions.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                onClick={() => onChange(opt)}
                className={`w-full py-2.5 px-3 text-[12px] text-left transition-all duration-200 press ${
                  selected ? "font-semibold" : ""
                }`}
                style={{
                  background: selected ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--ink-strong)",
                  color: "var(--ink-strong)",
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all"
                    style={{
                      border: "2px solid var(--ink-strong)",
                      background: selected ? "var(--ink-strong)" : "transparent",
                    }}
                  >
                    {selected && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--gold-c)" }}
                      />
                    )}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Multiple choice */}
      {question.type === "multiple_choice" && (
        <div className="space-y-1.5">
          {parsedOptions.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => {
                  const current = Array.isArray(value) ? value : [];
                  if (selected) {
                    onChange(current.filter((v) => v !== opt));
                  } else {
                    onChange([...current, opt]);
                  }
                }}
                className={`w-full py-2.5 px-3 text-[12px] text-left transition-all duration-200 press ${
                  selected ? "font-semibold" : ""
                }`}
                style={{
                  background: selected ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--ink-strong)",
                  color: "var(--ink-strong)",
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 flex items-center justify-center shrink-0 transition-all"
                    style={{
                      border: "2px solid var(--ink-strong)",
                      background: selected ? "var(--ink-strong)" : "transparent",
                    }}
                  >
                    {selected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--gold-c)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Rating */}
      {question.type === "rating" && (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = typeof value === "number" && star <= value;
            return (
              <button
                key={star}
                onClick={() => onChange(star)}
                className="w-10 h-10 flex items-center justify-center text-lg transition-all duration-150 press"
                style={{
                  background: active ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--ink-strong)",
                  color: "var(--ink-strong)",
                }}
              >
                <Icon name="star" size={16} />
              </button>
            );
          })}
        </div>
      )}

      {/* Scale 1-10 */}
      {question.type === "scale" && (
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
            const active = value === num;
            return (
              <button
                key={num}
                onClick={() => onChange(num)}
                className="flex-1 h-9 text-[11px] font-bold transition-all duration-150 press"
                style={{
                  background: active ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--ink-strong)",
                  color: "var(--ink-strong)",
                }}
              >
                {num}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────── */

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getTimeRemaining(endsAt: string): string | null {
  const now = new Date();
  const end = new Date(endsAt);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return null;

  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 0) return `Ends in ${diffDay}d`;
  if (diffHr > 0) return `Ends in ${diffHr}h`;
  if (diffMin > 0) return `Ends in ${diffMin}m`;
  return "Ending soon";
}
