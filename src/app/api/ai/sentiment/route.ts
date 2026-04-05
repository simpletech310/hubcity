import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeSentiment } from "@/lib/ai";

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

    // Role check: admin only (for batch analysis)
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

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Text must be at least 5 characters" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const result = await analyzeSentiment(text.trim());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze sentiment" },
      { status: 500 }
    );
  }
}
