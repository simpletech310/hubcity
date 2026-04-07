import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import AdminSurveyActions from "./AdminSurveyActions";
import Icon from "@/components/ui/Icon";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: string;
  response_count: number;
  is_published: boolean;
  is_anonymous: boolean;
  ends_at: string | null;
  created_at: string;
  author: { display_name: string; role: string } | null;
  questions: { id: string }[];
}

export default async function AdminSurveysPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select(
      "*, author:profiles!surveys_author_id_fkey(display_name, role), questions:survey_questions(id)"
    )
    .order("created_at", { ascending: false });

  const surveys = (data as Survey[] | null) ?? [];

  const statusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "emerald" as const;
      case "closed":
        return "coral" as const;
      default:
        return "gold" as const;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Surveys</h1>
          <p className="text-sm text-txt-secondary">
            {surveys.length} total surveys
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {surveys.map((survey) => (
          <Card key={survey.id} hover>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-sm font-semibold">{survey.title}</h3>
                  <Badge
                    label={survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                    variant={statusVariant(survey.status)}
                  />
                  <Badge
                    label={survey.is_published ? "Published" : "Hidden"}
                    variant={survey.is_published ? "emerald" : "gold"}
                  />
                </div>
                {survey.description && (
                  <p className="text-xs text-txt-secondary line-clamp-1 mb-1">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-txt-secondary">
                  <span>
                    By {survey.author?.display_name || "Unknown"}
                  </span>
                  <span>
                    {survey.questions.length} question
                    {survey.questions.length !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {survey.response_count} response
                    {survey.response_count !== 1 ? "s" : ""}
                  </span>
                  <span>
                    {new Date(survey.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {survey.ends_at && (
                    <span>
                      Ends{" "}
                      {new Date(survey.ends_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
              <AdminSurveyActions survey={survey} />
            </div>
          </Card>
        ))}

        {surveys.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3"><Icon name="document" size={28} /></p>
            <p className="text-sm text-txt-secondary">No surveys yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
