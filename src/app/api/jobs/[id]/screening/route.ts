import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ScreeningQuestionInput = {
  id?: string;
  question: string;
  type: "yes_no" | "short_text" | "long_text" | "multiple_choice" | "number";
  options?: unknown;
  required?: boolean;
  sort_order?: number;
};

const ALLOWED_TYPES = new Set([
  "yes_no",
  "short_text",
  "long_text",
  "multiple_choice",
  "number",
]);

/**
 * GET /api/jobs/[id]/screening
 * Public — returns the screening questions attached to a posted job.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();

    const { data: questions, error } = await supabase
      .from("job_screening_questions")
      .select("*")
      .eq("job_id", jobId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ questions: questions ?? [] });
  } catch (error) {
    console.error("Get screening questions error:", error);
    return NextResponse.json(
      { error: "Failed to load screening questions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/[id]/screening
 * Employer-only. Replaces the full question list for a job listing with
 * the payload provided. Server verifies the caller is the poster or an
 * admin; RLS is a second line of defense.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: listing } = await supabase
      .from("job_listings")
      .select("id, posted_by")
      .eq("id", jobId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    let isAllowed = listing.posted_by === user.id;
    if (!isAllowed) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAllowed = profile?.role === "admin";
    }

    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { questions?: ScreeningQuestionInput[] };
    const input = Array.isArray(body.questions) ? body.questions : [];

    // Validate first so we fail before mutating.
    for (const q of input) {
      if (!q.question || typeof q.question !== "string") {
        return NextResponse.json(
          { error: "Each question must have a non-empty `question` string" },
          { status: 400 }
        );
      }
      if (!ALLOWED_TYPES.has(q.type)) {
        return NextResponse.json(
          { error: `Invalid question type: ${q.type}` },
          { status: 400 }
        );
      }
    }

    // Replace-all semantics: simplest reliable shape for upsert of a list.
    const { error: deleteError } = await supabase
      .from("job_screening_questions")
      .delete()
      .eq("job_id", jobId);

    if (deleteError) throw deleteError;

    if (input.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    const rows = input.map((q, i) => ({
      job_id: jobId,
      question: q.question,
      type: q.type,
      options: q.options ?? null,
      required: q.required ?? false,
      sort_order: q.sort_order ?? i,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("job_screening_questions")
      .insert(rows)
      .select("*");

    if (insertError) throw insertError;

    return NextResponse.json({ questions: inserted ?? [] });
  } catch (error) {
    console.error("Save screening questions error:", error);
    return NextResponse.json(
      { error: "Failed to save screening questions" },
      { status: 500 }
    );
  }
}
