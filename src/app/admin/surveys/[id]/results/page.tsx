import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import type { SurveyQuestion, SurveyResponse } from "@/types/database";

interface AggregatedResult {
  question: string;
  type: string;
  total: number;
  distribution?: Record<string, number>;
  text_responses?: string[];
  average?: number;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SurveyResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: surveyId } = await params;
  const supabase = await createClient();

  // Auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["city_official", "admin"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch survey with questions
  const { data: survey } = await supabase
    .from("surveys")
    .select("*, questions:survey_questions(*)")
    .eq("id", surveyId)
    .single();

  if (!survey) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">404</p>
        <p className="text-sm text-txt-secondary mb-4">Survey not found</p>
        <Link href="/admin/data">
          <Button variant="ghost" size="sm">
            Back to Data &amp; Insights
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch all responses
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("survey_id", surveyId)
    .order("created_at", { ascending: false });

  const questions = ((survey.questions || []) as SurveyQuestion[]).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const responseCount = responses?.length || 0;

  // Aggregate results per question
  const results: Record<string, AggregatedResult> = {};

  for (const q of questions) {
    results[q.id] = {
      question: q.question,
      type: q.type,
      total: 0,
    };

    if (q.type === "single_choice" || q.type === "multiple_choice") {
      results[q.id].distribution = {};
      if (q.options) {
        for (const opt of q.options) {
          results[q.id].distribution![opt] = 0;
        }
      }
    } else if (q.type === "text") {
      results[q.id].text_responses = [];
    } else if (q.type === "rating" || q.type === "scale") {
      results[q.id].distribution = {};
      results[q.id].average = 0;
    }
  }

  if (responses) {
    for (const resp of responses) {
      const answers = resp.answers as Record<
        string,
        string | string[] | number
      >;
      for (const [qId, answer] of Object.entries(answers)) {
        if (!results[qId]) continue;
        results[qId].total++;

        if (results[qId].text_responses !== undefined) {
          results[qId].text_responses!.push(String(answer));
        } else if (results[qId].distribution !== undefined) {
          if (Array.isArray(answer)) {
            for (const a of answer) {
              results[qId].distribution![a] =
                (results[qId].distribution![a] || 0) + 1;
            }
          } else {
            const key = String(answer);
            results[qId].distribution![key] =
              (results[qId].distribution![key] || 0) + 1;
          }
        }
      }
    }

    // Compute averages for rating/scale
    for (const agg of Object.values(results)) {
      if (
        (agg.type === "rating" || agg.type === "scale") &&
        agg.distribution &&
        agg.total > 0
      ) {
        let sum = 0;
        for (const [val, count] of Object.entries(agg.distribution)) {
          sum += Number(val) * count;
        }
        agg.average = Math.round((sum / agg.total) * 10) / 10;
      }
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case "text":
        return "Free Text";
      case "single_choice":
        return "Single Choice";
      case "multiple_choice":
        return "Multiple Choice";
      case "rating":
        return "Rating";
      case "scale":
        return "Scale";
      default:
        return type;
    }
  };

  const statusVariant =
    survey.status === "active"
      ? "emerald"
      : survey.status === "draft"
      ? "gold"
      : "coral";

  return (
    <div>
      {/* Back link */}
      <Link
        href="/admin/data"
        className="inline-flex items-center gap-1.5 text-xs text-txt-secondary hover:text-white transition-colors mb-5"
      >
        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Data &amp; Insights
      </Link>

      {/* Survey Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">
          {survey.title}
        </h1>
        {survey.description && (
          <p className="text-sm text-txt-secondary mb-3">
            {survey.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            label={survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
            variant={statusVariant}
          />
          <span className="text-xs text-txt-secondary">
            {responseCount} response{responseCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-txt-secondary">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
          {survey.is_anonymous && (
            <Badge label="Anonymous" variant="purple" />
          )}
          <span className="text-xs text-txt-secondary">
            Created {formatDate(survey.created_at)}
          </span>
        </div>
      </div>

      {responseCount === 0 ? (
        <Card className="text-center py-12">
          <p className="text-txt-secondary text-sm">No responses yet</p>
          <p className="text-xs text-txt-secondary mt-1">
            Responses will appear here once community members participate
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const result = results[q.id];
            if (!result) return null;

            return (
              <Card key={q.id}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-semibold leading-snug">
                    <span className="text-txt-secondary mr-1.5">
                      Q{idx + 1}.
                    </span>
                    {result.question}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge label={typeLabel(q.type)} variant="cyan" />
                    <span className="text-[10px] text-txt-secondary">
                      {result.total} answer{result.total !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Text responses */}
                {q.type === "text" && result.text_responses && (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {result.text_responses.length === 0 ? (
                      <p className="text-xs text-txt-secondary italic">
                        No text responses
                      </p>
                    ) : (
                      result.text_responses.map((resp, i) => (
                        <div
                          key={i}
                          className="text-xs leading-relaxed bg-white/5 rounded-xl px-3 py-2"
                        >
                          {resp}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Choice distribution bar chart */}
                {(q.type === "single_choice" ||
                  q.type === "multiple_choice") &&
                  result.distribution && (
                    <DistributionChart
                      distribution={result.distribution}
                      total={result.total}
                    />
                  )}

                {/* Rating display */}
                {q.type === "rating" && result.distribution && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-heading font-bold text-gold">
                        {result.average}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={
                              star <= Math.round(result.average || 0)
                                ? "currentColor"
                                : "none"
                            }
                            stroke="currentColor"
                            strokeWidth={2}
                            className={
                              star <= Math.round(result.average || 0)
                                ? "text-gold"
                                : "text-white/20"
                            }
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-txt-secondary">
                        ({result.total} rating{result.total !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <DistributionChart
                      distribution={result.distribution}
                      total={result.total}
                    />
                  </div>
                )}

                {/* Scale display */}
                {q.type === "scale" && result.distribution && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl font-heading font-bold text-cyan">
                        {result.average}
                      </span>
                      <span className="text-xs text-txt-secondary">
                        average score &middot; {result.total} response
                        {result.total !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <DistributionChart
                      distribution={result.distribution}
                      total={result.total}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Export placeholder */}
      <div className="mt-6">
        <ExportCSVButton />
      </div>
    </div>
  );
}

/* Reusable horizontal bar chart for distributions */
function DistributionChart({
  distribution,
  total,
}: {
  distribution: Record<string, number>;
  total: number;
}) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  // Sort entries: numeric keys sorted numerically, strings alphabetically
  const entries = Object.entries(distribution).sort(([a], [b]) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-2">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const barWidth =
          maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
        return (
          <div key={label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium">{label}</span>
              <span className="text-txt-secondary">
                {count} ({pct}%)
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
