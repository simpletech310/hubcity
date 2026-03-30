import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

const POLL_TEMPLATES = [
  {
    question: "What should Compton invest in next?",
    options: ["Parks & Recreation", "Road Repairs", "Youth Programs", "Small Business Grants", "Public Safety"],
  },
  {
    question: "What's the biggest challenge facing our community?",
    options: ["Housing Costs", "Job Opportunities", "Public Safety", "Infrastructure", "Education"],
  },
  {
    question: "How would you rate city services this month?",
    options: ["Excellent", "Good", "Average", "Needs Improvement", "Poor"],
  },
  {
    question: "What type of events do you want more of?",
    options: ["Music & Concerts", "Food Festivals", "Sports Tournaments", "Community Cleanups", "Education Workshops"],
  },
  {
    question: "Best way to get around Compton?",
    options: ["Driving", "Bus/Metro", "Biking", "Walking", "Rideshare"],
  },
  {
    question: "What would make you shop local more?",
    options: ["Better Prices", "More Variety", "Loyalty Programs", "Delivery Options", "Better Hours"],
  },
  {
    question: "How connected do you feel to your neighbors?",
    options: ["Very Connected", "Somewhat Connected", "Not Really", "I Keep to Myself", "Just Moved Here"],
  },
  {
    question: "What's your favorite thing about Compton?",
    options: ["The People", "The Food", "The Culture", "The History", "The Community Spirit"],
  },
];

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "weekly-poll");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Get bot account
    const { data: bot } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_bot", true)
      .eq("handle", "hubcity")
      .single();

    if (!bot) {
      return NextResponse.json({ error: "Bot account not found" }, { status: 404 });
    }

    // Check if we already created a poll this week
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: recentPolls } = await supabase
      .from("polls")
      .select("id, question")
      .eq("created_by", bot.id)
      .gte("created_at", weekAgo)
      .limit(1);

    if (recentPolls && recentPolls.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Already created a poll this week" });
    }

    // Get recent poll questions to avoid repeats
    const { data: pastPolls } = await supabase
      .from("polls")
      .select("question")
      .eq("created_by", bot.id)
      .order("created_at", { ascending: false })
      .limit(8);

    const pastQuestions = (pastPolls || []).map((p) => p.question);

    // Pick a template that hasn't been used recently
    const eligible = POLL_TEMPLATES.filter((t) => !pastQuestions.includes(t.question));
    const template = eligible.length > 0
      ? eligible[Math.floor(Math.random() * eligible.length)]
      : POLL_TEMPLATES[Math.floor(Math.random() * POLL_TEMPLATES.length)];

    // Create poll
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({
        question: template.question,
        created_by: bot.id,
        is_published: true,
        status: "active",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // Create options
    const optionRows = template.options.map((text, i) => ({
      poll_id: poll.id,
      option_text: text,
      display_order: i + 1,
    }));

    const { error: optError } = await supabase
      .from("poll_options")
      .insert(optionRows);

    if (optError) throw optError;

    // Create accompanying post
    const body = `📊 **Weekly Poll** — Your voice matters!\n\n"${template.question}"\n\nHead to City Pulse to vote! Results shared next week.\n\n#poll #comptonvoice #community`;

    await supabase.from("posts").insert({
      author_id: bot.id,
      body,
      post_type: "update",
      is_automated: true,
      hashtags: ["poll", "comptonvoice", "community"],
    });

    return NextResponse.json({
      success: true,
      poll_id: poll.id,
      question: template.question,
    });
  } catch (error) {
    console.error("Weekly poll bot error:", error);
    return NextResponse.json({ error: "Failed to create weekly poll" }, { status: 500 });
  }
}
