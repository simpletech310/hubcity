"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface Survey {
  id: string;
  status: string;
  is_published: boolean;
}

export default function AdminSurveyActions({ survey }: { survey: Survey }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateSurvey = async (updates: Record<string, unknown>) => {
    setLoading(true);
    try {
      await fetch(`/api/admin/surveys/${survey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async () => {
    if (!confirm("Delete this survey and all responses permanently?")) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/surveys/${survey.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Link href={`/admin/surveys/${survey.id}/results`}>
        <Button variant="outline" size="sm">
          Results
        </Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateSurvey({ is_published: !survey.is_published })}
        loading={loading}
      >
        {survey.is_published ? "Hide" : "Show"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          updateSurvey({
            status: survey.status === "closed" ? "active" : "closed",
          })
        }
        loading={loading}
      >
        {survey.status === "closed" ? "Reopen" : "Close"}
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={deleteSurvey}
        loading={loading}
      >
        Delete
      </Button>
    </div>
  );
}
