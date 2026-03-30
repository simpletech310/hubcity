import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import PollResults from "@/components/admin/PollResults";
import SurveyList from "@/components/admin/SurveyList";
import SearchAnalytics from "@/components/admin/SearchAnalytics";
import type { Poll, PollOption, Survey, SurveyQuestion } from "@/types/database";

export default async function AdminDataPage() {
  const supabase = await createClient();

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["city_official", "admin"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch data in parallel
  const [pollsResult, surveysResult, pollVotesResult, surveyResponsesResult] =
    await Promise.all([
      supabase
        .from("polls")
        .select("*, options:poll_options(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("surveys")
        .select("*, questions:survey_questions(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("poll_votes")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("survey_responses")
        .select("id", { count: "exact", head: true }),
    ]);

  const polls = (pollsResult.data ?? []) as (Poll & { options: PollOption[] })[];
  const surveys = (surveysResult.data ?? []) as (Survey & { questions: SurveyQuestion[] })[];
  const totalPollVotes = pollVotesResult.count ?? 0;
  const totalSurveyResponses = surveyResponsesResult.count ?? 0;

  const activePolls = polls.filter((p) => p.status === "active").length;
  const activeSurveys = surveys.filter((s) => s.status === "active").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">
          Data & Insights
        </h1>
        <p className="text-sm text-txt-secondary">
          Polls, surveys, and community feedback
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-gold">
            {polls.length}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Total Polls</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-emerald">
            {activePolls}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Active Polls</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-cyan">
            {surveys.length}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Total Surveys</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-coral">
            {totalPollVotes + totalSurveyResponses}
          </p>
          <p className="text-[10px] text-txt-secondary mt-0.5">
            Total Responses
          </p>
        </Card>
      </div>

      {/* Polls Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-txt-secondary">
            Polls
          </h2>
          <span className="text-xs text-txt-secondary">
            {polls.length} total
          </span>
        </div>
        <PollResults polls={polls} />
      </div>

      {/* Surveys Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-txt-secondary">
            Surveys
          </h2>
          <span className="text-xs text-txt-secondary">
            {surveys.length} total
          </span>
        </div>
        <SurveyList surveys={surveys} />
      </div>

      {/* Search Analytics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-txt-secondary">
            AI Search Analytics
          </h2>
        </div>
        <SearchAnalytics />
      </div>
    </div>
  );
}
