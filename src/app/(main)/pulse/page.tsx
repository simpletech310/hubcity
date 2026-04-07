import { createClient } from "@/lib/supabase/server";
import PulseFeed from "@/components/pulse/PulseFeed";
import type { Post, ReactionEmoji, LiveStream, Poll, Survey } from "@/types/database";

export default async function PulsePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Fetch posts, live streams, polls, surveys, events, and promotions in parallel
  const [
    { data: rawPosts },
    { data: rawLiveStreams },
    { data: rawPolls },
    { data: rawSurveys },
    { data: rawEvents },
    { data: rawPromos },
    { count: trafficAlertCount },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "*, author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("live_streams")
      .select(
        "*, creator:profiles(id, display_name, avatar_url, role, verification_status), channel:channels(id, name, slug)"
      )
      .eq("status", "active")
      .limit(5),
    supabase
      .from("polls")
      .select(
        "*, options:poll_options(*), author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .in("status", ["active"])
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("surveys")
      .select(
        "*, questions:survey_questions(*), author:profiles!posts_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10),
    // Upcoming events (next 7 days)
    supabase
      .from("events")
      .select("id, title, slug, start_date, start_time, location_name, category, image_url, rsvp_count")
      .eq("is_published", true)
      .gte("start_date", today)
      .order("start_date")
      .limit(6),
    // Active food promotions
    supabase
      .from("food_promotions")
      .select("*, business:businesses(id, name, slug, image_urls)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(6),
    // Active traffic alerts count
    supabase
      .from("city_alerts")
      .select("id", { count: "exact", head: true })
      .eq("type", "traffic")
      .eq("is_active", true),
  ]);

  const posts: Post[] = (rawPosts as Post[]) || [];
  const liveStreams: LiveStream[] = (rawLiveStreams as LiveStream[]) || [];
  const polls: Poll[] = (rawPolls as Poll[]) || [];
  const surveys: Survey[] = (rawSurveys as Survey[]) || [];
  const events = rawEvents || [];
  const promotions = rawPromos || [];

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userId: string | null = null;
  let userName = "User";
  let userRole = "citizen";
  const userReactions: Record<string, ReactionEmoji[]> = {};

  if (user) {
    userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single();

    if (profile) {
      userName = profile.display_name;
      userRole = profile.role;
    }

    // Get user's reactions
    if (posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: reactions } = await supabase
        .from("post_reactions")
        .select("post_id, emoji")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      if (reactions) {
        for (const r of reactions) {
          if (!userReactions[r.post_id]) userReactions[r.post_id] = [];
          userReactions[r.post_id].push(r.emoji as ReactionEmoji);
        }
      }
    }

    // Get user's poll votes
    if (polls.length > 0) {
      const pollIds = polls.map((p) => p.id);
      const { data: votes } = await supabase
        .from("poll_votes")
        .select("poll_id, option_id")
        .eq("user_id", user.id)
        .in("poll_id", pollIds);

      if (votes) {
        for (const v of votes) {
          const poll = polls.find((p) => p.id === v.poll_id);
          if (poll) poll.user_vote = v.option_id;
        }
      }
    }

    // Check survey responses
    if (surveys.length > 0) {
      const surveyIds = surveys.map((s) => s.id);
      const { data: responses } = await supabase
        .from("survey_responses")
        .select("survey_id")
        .eq("respondent_id", user.id)
        .in("survey_id", surveyIds);

      if (responses) {
        for (const r of responses) {
          const survey = surveys.find((s) => s.id === r.survey_id);
          if (survey) survey.user_responded = true;
        }
      }
    }
  }

  return (
    <PulseFeed
      posts={posts}
      userReactions={userReactions}
      userId={userId}
      userName={userName}
      userRole={userRole}
      liveStreams={liveStreams}
      polls={polls}
      surveys={surveys}
      events={events}
      promotions={promotions}
      trafficAlertCount={trafficAlertCount ?? 0}
    />
  );
}
