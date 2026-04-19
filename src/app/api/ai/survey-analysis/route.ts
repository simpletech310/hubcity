import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: admin or city_official only
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Forbidden: admin or city_official role required" },
        { status: 403 }
      );
    }

    const { survey_id } = await request.json();

    if (!survey_id) {
      return NextResponse.json(
        { error: "survey_id is required" },
        { status: 400 }
      );
    }

    // Fetch the survey with questions
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", survey_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Fetch questions
    const { data: questions } = await supabase
      .from("survey_questions")
      .select("*")
      .eq("survey_id", survey_id)
      .order("sort_order");

    // Fetch all responses
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("*")
      .eq("survey_id", survey_id);

    const totalResponses = responses?.length ?? 0;

    if (totalResponses === 0) {
      return NextResponse.json({
        analysis: "No responses have been submitted for this survey yet.",
        stats: { total_responses: 0, completion_rate: 0 },
      });
    }

    // Check for OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Build context for analysis
    const questionList =
      questions
        ?.map(
          (q, i) =>
            `Q${i + 1}: "${q.question}" (type: ${q.type}${q.options ? `, options: ${JSON.stringify(q.options)}` : ""})`
        )
        .join("\n") ?? "";

    // Aggregate answers per question
    const answerSummary: Record<string, string[]> = {};
    for (const resp of responses ?? []) {
      const answers = resp.answers as Record<string, string | string[] | number>;
      for (const [qId, answer] of Object.entries(answers)) {
        if (!answerSummary[qId]) answerSummary[qId] = [];
        answerSummary[qId].push(
          Array.isArray(answer) ? answer.join(", ") : String(answer)
        );
      }
    }

    // Map question IDs to labels for context
    const questionMap = new Map(
      (questions ?? []).map((q, i) => [q.id, `Q${i + 1}: ${q.question}`])
    );

    const answerContext = Object.entries(answerSummary)
      .map(([qId, answers]) => {
        const label = questionMap.get(qId) || qId;
        // For choice questions, tally counts
        const tally: Record<string, number> = {};
        for (const a of answers) {
          tally[a] = (tally[a] || 0) + 1;
        }
        const tallyStr = Object.entries(tally)
          .sort((a, b) => b[1] - a[1])
          .map(([val, count]) => `  "${val}": ${count} responses`)
          .join("\n");
        return `${label}\n${tallyStr}`;
      })
      .join("\n\n");

    // Fetch respondent district data if available
    const respondentIds = (responses ?? []).map((r) => r.respondent_id);
    const { data: respondentProfiles } = await supabase
      .from("profiles")
      .select("id, district")
      .in("id", respondentIds);

    const districtBreakdown: Record<string, number> = {};
    for (const p of respondentProfiles ?? []) {
      const d = p.district ? `District ${p.district}` : "Unknown";
      districtBreakdown[d] = (districtBreakdown[d] || 0) + 1;
    }

    const districtContext =
      Object.keys(districtBreakdown).length > 0
        ? `\n\nRespondent district breakdown:\n${Object.entries(districtBreakdown)
            .map(([d, c]) => `  ${d}: ${c}`)
            .join("\n")}`
        : "";

    const prompt = `You are an analyst for the City of Compton, CA civic engagement platform "Knect".
Analyze the following survey results and provide a comprehensive analysis.

Survey: "${survey.title}"
${survey.description ? `Description: ${survey.description}` : ""}
Total responses: ${totalResponses}

Questions:
${questionList}

Response Data:
${answerContext}
${districtContext}

Provide your analysis in the following structure:
1. **Key Findings Summary** (3-5 bullet points of the most important takeaways)
2. **Per-Question Breakdown** (for each question, summarize the response patterns and notable insights)
3. **Cross-Tabulation Insights** (if district data is available, note any geographic patterns)
4. **Recommendations** (3-5 actionable recommendations for city officials based on the data)

Be specific, cite actual numbers, and focus on actionable insights for city governance.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an expert civic data analyst. Provide clear, structured analysis of survey data for city officials. Be concise but thorough.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("OpenAI API error:", errBody);
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 500 }
      );
    }

    const data = await res.json();
    const analysis = data.choices?.[0]?.message?.content ?? "Analysis unavailable.";

    // Calculate completion rate
    const requiredQuestions = (questions ?? []).filter((q) => q.required).length;
    let fullyCompleted = 0;
    if (requiredQuestions > 0) {
      for (const resp of responses ?? []) {
        const answers = resp.answers as Record<string, unknown>;
        const answeredRequired = (questions ?? [])
          .filter((q) => q.required)
          .filter((q) => answers[q.id] !== undefined && answers[q.id] !== "")
          .length;
        if (answeredRequired === requiredQuestions) fullyCompleted++;
      }
    } else {
      fullyCompleted = totalResponses;
    }

    const completionRate =
      totalResponses > 0
        ? Math.round((fullyCompleted / totalResponses) * 100)
        : 0;

    return NextResponse.json({
      analysis,
      stats: {
        total_responses: totalResponses,
        completion_rate: completionRate,
        district_breakdown: districtBreakdown,
      },
    });
  } catch (error) {
    console.error("Survey analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze survey" },
      { status: 500 }
    );
  }
}
