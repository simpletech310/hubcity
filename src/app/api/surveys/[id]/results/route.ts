import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/surveys/[id]/results — get survey results (officials/admins only)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["city_official", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Fetch survey with questions
    const { data: survey } = await supabase
      .from("surveys")
      .select("*, questions:survey_questions(*)")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Fetch all responses
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: false });

    // Aggregate results per question
    const aggregated: Record<
      string,
      {
        question: string;
        type: string;
        total: number;
        distribution?: Record<string, number>;
        text_responses?: string[];
        average?: number;
      }
    > = {};

    const questions = (survey.questions || []) as Array<{
      id: string;
      question: string;
      type: string;
    }>;

    for (const q of questions) {
      aggregated[q.id] = {
        question: q.question,
        type: q.type,
        total: 0,
      };

      if (
        q.type === "single_choice" ||
        q.type === "multiple_choice"
      ) {
        aggregated[q.id].distribution = {};
      } else if (q.type === "text") {
        aggregated[q.id].text_responses = [];
      } else if (q.type === "rating" || q.type === "scale") {
        aggregated[q.id].distribution = {};
        aggregated[q.id].average = 0;
      }
    }

    if (responses) {
      for (const resp of responses) {
        const answers = resp.answers as Record<string, string | string[] | number>;
        for (const [qId, answer] of Object.entries(answers)) {
          if (!aggregated[qId]) continue;
          aggregated[qId].total++;

          if (aggregated[qId].text_responses !== undefined) {
            aggregated[qId].text_responses!.push(String(answer));
          } else if (aggregated[qId].distribution !== undefined) {
            if (Array.isArray(answer)) {
              for (const a of answer) {
                aggregated[qId].distribution![a] =
                  (aggregated[qId].distribution![a] || 0) + 1;
              }
            } else {
              const key = String(answer);
              aggregated[qId].distribution![key] =
                (aggregated[qId].distribution![key] || 0) + 1;
            }
          }
        }
      }

      // Compute averages for rating/scale
      for (const [qId, agg] of Object.entries(aggregated)) {
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

    return NextResponse.json({
      survey,
      response_count: responses?.length || 0,
      results: aggregated,
    });
  } catch (error) {
    console.error("Survey results error:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
