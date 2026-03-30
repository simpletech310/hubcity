"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { Survey } from "@/types/database";

interface SurveyListProps {
  surveys: Survey[];
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function SurveyCard({ survey }: { survey: Survey }) {
  const [closing, setClosing] = useState(false);
  const router = useRouter();

  const closeSurvey = async () => {
    if (!confirm("Close this survey? No more responses will be accepted.")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setClosing(false);
    }
  };

  const statusVariant = survey.status === "active"
    ? "emerald"
    : survey.status === "draft"
    ? "gold"
    : "coral";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug">{survey.title}</h3>
          {survey.description && (
            <p className="text-xs text-txt-secondary mt-1 line-clamp-2">
              {survey.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <Badge label={survey.status} variant={statusVariant} />
            <span className="text-[10px] text-txt-secondary">
              {survey.questions?.length || 0} question{(survey.questions?.length || 0) !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-txt-secondary">
              {survey.response_count} response{survey.response_count !== 1 ? "s" : ""}
            </span>
            <span className="text-[10px] text-txt-secondary">
              {formatDate(survey.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
        <Link href={`/admin/surveys/${survey.id}/results`}>
          <Button variant="outline" size="sm">
            View Results
          </Button>
        </Link>
        {survey.status === "active" && (
          <Button
            variant="danger"
            size="sm"
            onClick={closeSurvey}
            loading={closing}
          >
            Close Survey
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function SurveyList({ surveys }: SurveyListProps) {
  if (surveys.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-txt-secondary text-sm">No surveys yet</p>
        <p className="text-xs text-txt-secondary mt-1">
          Create surveys to gather community feedback
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {surveys.map((survey) => (
        <SurveyCard key={survey.id} survey={survey} />
      ))}
    </div>
  );
}
