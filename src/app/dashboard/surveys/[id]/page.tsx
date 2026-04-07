"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface QuestionResult {
  question: string;
  type: string;
  total: number;
  distribution?: Record<string, number>;
  text_responses?: string[];
  average?: number;
}

interface SurveyResultsData {
  survey: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    is_anonymous: boolean;
    ends_at: string | null;
    created_at: string;
    questions: Array<{
      id: string;
      question: string;
      type: string;
      options: string[] | null;
      required: boolean;
      sort_order: number;
    }>;
  };
  response_count: number;
  results: Record<string, QuestionResult>;
}

export default function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<SurveyResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [closingSurvey, setClosingSurvey] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/surveys/${id}/results`);
      if (!res.ok) {
        setError("Failed to load survey results");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleCloseSurvey = async () => {
    if (!data || closingSurvey) return;
    setClosingSurvey(true);
    try {
      const res = await fetch(`/api/surveys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        setData({
          ...data,
          survey: { ...data.survey, status: "closed" },
        });
      }
    } catch {
      // ignore
    } finally {
      setClosingSurvey(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-60 rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl block mb-3"><Icon name="warning" size={28} /></span>
        <p className="text-sm font-medium mb-1">{error || "Survey not found"}</p>
        <Link href="/dashboard/surveys" className="text-gold text-sm font-semibold">
          Back to Surveys
        </Link>
      </div>
    );
  }

  const { survey, response_count, results } = data;
  const sortedQuestions = [...(survey.questions || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/surveys" className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold mb-3">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10 12L6 8l4-4" /></svg>
          All Surveys
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge
                label={survey.status === "active" ? "Active" : survey.status === "draft" ? "Draft" : "Closed"}
                variant={survey.status === "active" ? "emerald" : survey.status === "draft" ? "gold" : "coral"}
              />
              {survey.is_anonymous && <Badge label="Anonymous" variant="purple" />}
            </div>
            <h1 className="font-display text-xl text-white leading-tight">{survey.title}</h1>
            {survey.description && (
              <p className="text-sm text-txt-secondary mt-1">{survey.description}</p>
            )}
            <p className="text-xs text-txt-secondary mt-1.5">
              Created {new Date(survey.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {survey.status === "active" && (
            <button
              onClick={handleCloseSurvey}
              disabled={closingSurvey}
              className="shrink-0 px-4 py-2 bg-coral/10 text-coral border border-coral/20 rounded-xl text-xs font-bold hover:bg-coral/20 transition-colors"
            >
              {closingSurvey ? "Closing..." : "Close Survey"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Responses</p>
          <p className="text-2xl font-bold text-hc-purple mt-1">{response_count}</p>
        </Card>
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Questions</p>
          <p className="text-2xl font-bold text-white mt-1">{sortedQuestions.length}</p>
        </Card>
        <Card padding>
          <p className="text-[10px] text-txt-secondary uppercase tracking-wider font-semibold">Status</p>
          <p className={`text-lg font-bold mt-1 ${survey.status === "active" ? "text-emerald" : survey.status === "draft" ? "text-gold" : "text-coral"}`}>
            {survey.status === "active" ? "Live" : survey.status === "draft" ? "Draft" : "Closed"}
          </p>
        </Card>
      </div>

      {/* Question Results */}
      {response_count === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-3"><Icon name="document" size={28} /></span>
          <p className="text-sm font-medium mb-1">No responses yet</p>
          <p className="text-xs text-txt-secondary">
            Results will appear here as residents respond to this survey.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedQuestions.map((q, qIdx) => {
            const result = results[q.id];
            if (!result) return null;

            return (
              <Card key={q.id} padding>
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-[11px] font-bold text-hc-purple bg-hc-purple/10 rounded-md px-1.5 py-0.5 shrink-0">
                    Q{qIdx + 1}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-white">{result.question}</p>
                    <p className="text-[10px] text-txt-secondary mt-0.5">
                      {result.total} response{result.total !== 1 ? "s" : ""} &bull; {q.type.replace("_", " ")}
                    </p>
                  </div>
                </div>

                {/* Choice Distribution */}
                {(q.type === "single_choice" || q.type === "multiple_choice") && result.distribution && (
                  <ChoiceChart distribution={result.distribution} total={result.total} />
                )}

                {/* Rating/Scale Distribution */}
                {(q.type === "rating" || q.type === "scale") && result.distribution && (
                  <div>
                    {result.average !== undefined && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl font-bold text-gold">{result.average}</span>
                        <span className="text-xs text-txt-secondary">
                          / {q.type === "rating" ? "5" : "10"} average
                        </span>
                        {q.type === "rating" && (
                          <div className="flex gap-0.5 ml-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${star <= Math.round(result.average!) ? "text-gold" : "text-white/10"}`}
                              >
                                <Icon name="star" size={16} />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <NumericChart
                      distribution={result.distribution}
                      total={result.total}
                      max={q.type === "rating" ? 5 : 10}
                    />
                  </div>
                )}

                {/* Text Responses */}
                {q.type === "text" && result.text_responses && (
                  <TextResponses responses={result.text_responses} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Choice Chart ────────────────────────────── */

function ChoiceChart({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...entries.map(([, c]) => c), 1);

  return (
    <div className="space-y-2">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        const barWidth = (count / maxCount) * 100;
        const isTop = count === maxCount && count > 0;

        return (
          <div key={label}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[12px] ${isTop ? "font-semibold text-white" : "text-txt-secondary"}`}>
                {label}
              </span>
              <span className="text-[11px] text-txt-secondary">
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-6 bg-deep/50 rounded-lg overflow-hidden relative">
              <div
                className={`h-full rounded-lg transition-all duration-700 ${isTop ? "bg-gradient-to-r from-hc-purple/40 to-hc-purple/20" : "bg-white/8"}`}
                style={{ width: `${barWidth}%` }}
              />
              <div className="absolute inset-0 flex items-center px-2">
                <span className={`text-[10px] font-bold ${isTop ? "text-hc-purple" : "text-white/40"}`}>
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Numeric Chart (Rating/Scale) ────────────── */

function NumericChart({
  distribution,
  total,
  max,
}: {
  distribution: Record<string, number>;
  total: number;
  max: number;
}) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className="flex items-end gap-1.5 h-20">
      {Array.from({ length: max }, (_, i) => {
        const key = String(i + 1);
        const count = distribution[key] || 0;
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={key} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-txt-secondary">{pct > 0 ? `${pct}%` : ""}</span>
            <div className="w-full flex items-end" style={{ height: "60px" }}>
              <div
                className="w-full rounded-t bg-hc-purple/30 hover:bg-hc-purple/50 transition-colors"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
            <span className="text-[10px] text-txt-secondary font-medium">{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Text Responses ──────────────────────────── */

function TextResponses({ responses }: { responses: string[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? responses : responses.slice(0, 5);

  return (
    <div className="space-y-2">
      {visible.map((text, i) => (
        <div key={i} className="bg-deep/40 rounded-xl px-3 py-2.5">
          <p className="text-[12px] text-txt-secondary leading-relaxed">&ldquo;{text}&rdquo;</p>
        </div>
      ))}
      {responses.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[11px] text-gold font-semibold hover:text-gold-light transition-colors"
        >
          Show all {responses.length} responses
        </button>
      )}
    </div>
  );
}
