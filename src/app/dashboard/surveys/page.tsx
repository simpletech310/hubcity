"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface SurveySummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
  response_count: number;
  ends_at: string | null;
  created_at: string;
  questions: Array<{ id: string }>;
}

export default function DashboardSurveysPage() {
  const [surveys, setSurveys] = useState<SurveySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/surveys?all=true");
      const data = await res.json();
      setSurveys(data.surveys ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const activeSurveys = surveys.filter((s) => s.status === "active");
  const closedSurveys = surveys.filter((s) => s.status === "closed");
  const draftSurveys = surveys.filter((s) => s.status === "draft");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-white">Surveys</h1>
          <p className="text-sm text-txt-secondary mt-1">
            Create surveys and analyze community responses.
          </p>
        </div>
        <Link
          href="/pulse"
          className="px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-midnight rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
        >
          Create Survey
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-3"><Icon name="document" size={28} /></span>
          <p className="text-sm font-medium mb-1">No surveys created yet</p>
          <p className="text-xs text-txt-secondary mb-4">
            Go to Pulse to create your first survey.
          </p>
        </div>
      ) : (
        <>
          {activeSurveys.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-sm text-white mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-emerald" />
                Active ({activeSurveys.length})
              </h2>
              <div className="space-y-3">
                {activeSurveys.map((s) => (
                  <SurveyRow key={s.id} survey={s} />
                ))}
              </div>
            </section>
          )}

          {draftSurveys.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-sm text-white/80 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-gold" />
                Drafts ({draftSurveys.length})
              </h2>
              <div className="space-y-3">
                {draftSurveys.map((s) => (
                  <SurveyRow key={s.id} survey={s} />
                ))}
              </div>
            </section>
          )}

          {closedSurveys.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-sm text-white/60 mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-white/20" />
                Closed ({closedSurveys.length})
              </h2>
              <div className="space-y-3">
                {closedSurveys.map((s) => (
                  <SurveyRow key={s.id} survey={s} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SurveyRow({ survey }: { survey: SurveySummary }) {
  const isActive = survey.status === "active";
  const isDraft = survey.status === "draft";

  return (
    <Link href={`/dashboard/surveys/${survey.id}`}>
      <Card hover padding>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                label={isActive ? "Active" : isDraft ? "Draft" : "Closed"}
                variant={isActive ? "emerald" : isDraft ? "gold" : "coral"}
              />
              <span className="text-[10px] text-txt-secondary">
                {survey.questions?.length ?? 0} question{(survey.questions?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-white line-clamp-2 mt-1.5">
              {survey.title}
            </p>
            {survey.description && (
              <p className="text-[11px] text-txt-secondary line-clamp-1 mt-0.5">
                {survey.description}
              </p>
            )}
            <p className="text-[11px] text-txt-secondary mt-2">
              {new Date(survey.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-bold text-hc-purple">{survey.response_count}</span>
            <p className="text-[10px] text-txt-secondary">responses</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
