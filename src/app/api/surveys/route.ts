import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/surveys — list active surveys
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: surveys, error } = await supabase
      .from("surveys")
      .select(
        "*, questions:survey_questions(*), author:profiles!surveys_author_id_fkey(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ surveys: surveys || [] });
  } catch (error) {
    console.error("Surveys fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}

// POST /api/surveys — create a survey (city_official/admin only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["city_official", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Only city officials and admins can create surveys" },
        { status: 403 }
      );
    }

    const { title, description, questions, ends_at, is_anonymous } =
      await request.json();

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" },
        { status: 400 }
      );
    }

    if (questions.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 questions per survey" },
        { status: 400 }
      );
    }

    // Create survey
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .insert({
        author_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        ends_at: ends_at || null,
        is_anonymous: is_anonymous || false,
        is_published: true,
        status: "active",
      })
      .select("*")
      .single();

    if (surveyError) throw surveyError;

    // Create questions
    const questionRows = questions.map(
      (
        q: {
          question: string;
          type: string;
          options?: string[];
          required?: boolean;
        },
        idx: number
      ) => ({
        survey_id: survey.id,
        question: q.question.trim(),
        type: q.type || "text",
        options: q.options ? JSON.stringify(q.options) : null,
        required: q.required !== false,
        sort_order: idx,
      })
    );

    const { error: qError } = await supabase
      .from("survey_questions")
      .insert(questionRows);

    if (qError) throw qError;

    // Fetch complete survey
    const { data: completeSurvey } = await supabase
      .from("surveys")
      .select(
        "*, questions:survey_questions(*), author:profiles!surveys_author_id_fkey(id, display_name, avatar_url, role, verification_status)"
      )
      .eq("id", survey.id)
      .single();

    return NextResponse.json({ survey: completeSurvey });
  } catch (error) {
    console.error("Survey creation error:", error);
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    );
  }
}
