import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/surveys/[id]/respond — submit survey response
export async function POST(
  request: Request,
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

    const { answers } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "Answers are required" },
        { status: 400 }
      );
    }

    // Verify survey is active
    const { data: survey } = await supabase
      .from("surveys")
      .select("id, status, ends_at")
      .eq("id", surveyId)
      .single();

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "Survey is not active" },
        { status: 400 }
      );
    }

    if (survey.ends_at && new Date(survey.ends_at) < new Date()) {
      await supabase
        .from("surveys")
        .update({ status: "closed" })
        .eq("id", surveyId);
      return NextResponse.json(
        { error: "Survey has expired" },
        { status: 400 }
      );
    }

    // Check if already responded
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("survey_id", surveyId)
      .eq("respondent_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already responded to this survey" },
        { status: 409 }
      );
    }

    // Validate required questions answered
    const { data: questions } = await supabase
      .from("survey_questions")
      .select("id, required")
      .eq("survey_id", surveyId);

    if (questions) {
      for (const q of questions) {
        if (q.required && (!answers[q.id] || answers[q.id] === "")) {
          return NextResponse.json(
            { error: "Please answer all required questions" },
            { status: 400 }
          );
        }
      }
    }

    // Insert response
    const { data: response, error: respError } = await supabase
      .from("survey_responses")
      .insert({
        survey_id: surveyId,
        respondent_id: user.id,
        answers,
      })
      .select("*")
      .single();

    if (respError) throw respError;

    // Increment response count
    const { count } = await supabase
      .from("survey_responses")
      .select("*", { count: "exact", head: true })
      .eq("survey_id", surveyId);

    await supabase
      .from("surveys")
      .update({ response_count: count || 0 })
      .eq("id", surveyId);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Survey response error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
