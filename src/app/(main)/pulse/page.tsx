import { createClient } from "@/lib/supabase/server";
import PulseFeed from "@/components/pulse/PulseFeed";
import { getActiveCity } from "@/lib/city-context";
import type { Post, ReactionEmoji, LiveStream, Poll, Survey, Reel } from "@/types/database";

export default async function PulsePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const nowISO = new Date().toISOString();

  // Fetch posts, live streams, polls, surveys, events, promotions, reels in parallel
  const [
    { data: rawPosts },
    { data: rawLiveStreams },
    { data: rawPolls },
    { data: rawSurveys },
    { data: rawEvents },
    { data: rawPromos },
    { count: trafficAlertCount },
    { data: rawSuggestedProfiles },
    { data: rawReels },
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
    // Suggested profiles — notable roles for "People to follow"
    supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, role, verification_status, bio")
      .in("role", ["content_creator", "creator", "city_ambassador", "city_official", "business_owner"])
      .limit(10),
    // Reels — active (non-expired), newest 20
    supabase
      .from("reels")
      .select(
        "*, author:profiles!reels_author_id_fkey(id, display_name, handle, avatar_url, role, verification_status)"
      )
      .eq("is_published", true)
      .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const posts: Post[] = (rawPosts as Post[]) || [];
  const liveStreams: LiveStream[] = (rawLiveStreams as LiveStream[]) || [];
  const polls: Poll[] = (rawPolls as Poll[]) || [];
  const surveys: Survey[] = (rawSurveys as Survey[]) || [];
  const events = rawEvents || [];
  const promotions = rawPromos || [];
  const suggestedProfiles = rawSuggestedProfiles || [];
  const reels = (rawReels as unknown as Reel[]) || [];

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userId: string | null = null;
  let userName = "User";
  let userRole = "citizen";
  let followedIds: string[] = [];
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

    // Get accounts I follow — drives the "Following" toggle
    const { data: follows } = await supabase
      .from("user_follows")
      .select("followed_id")
      .eq("follower_id", user.id);
    followedIds = (follows ?? []).map((f) => f.followed_id);

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

    // Get top 2 most recent top-level comments per post for inline preview.
    // (Post-load filtering — post_recent_comments view ranks per post.)
    if (posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: previews } = await supabase
        .from("post_recent_comments")
        .select(
          "id, post_id, body, created_at, parent_id, author_display_name, author_handle, author_verification_status, rank",
        )
        .in("post_id", postIds)
        .lte("rank", 2);

      if (previews) {
        const byPost: Record<string, typeof previews> = {};
        for (const row of previews) {
          const list = byPost[row.post_id] || [];
          list.push(row);
          byPost[row.post_id] = list;
        }
        for (const p of posts) {
          const rows = byPost[p.id] || [];
          // Oldest-first so the inline preview reads top-down like Instagram.
          p.preview_comments = rows
            .sort((a, b) => a.rank - b.rank)
            .reverse()
            .map((r) => ({
              id: r.id,
              body: r.body,
              created_at: r.created_at,
              author_display_name: r.author_display_name,
              author_handle: r.author_handle,
              author_verification_status: r.author_verification_status,
            }));
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

  const city = await getActiveCity();

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
    .toUpperCase();
  const volLabel = `VOL.${now.getFullYear() % 100}`;
  const isoWeek = Math.ceil(
    ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 +
      new Date(now.getFullYear(), 0, 1).getDay() +
      1) /
      7,
  );
  const issLabel = `ISS.${isoWeek}`;

  return (
    <div className="culture-surface animate-fade-in min-h-dvh">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § {volLabel} · {issLabel} · {dateLabel}
        </div>
        <h1
          className="c-display mt-2"
          style={{ fontSize: 72, lineHeight: 0.82, letterSpacing: "-0.02em" }}
        >
          THE FEED.
        </h1>
        <p
          className="c-serif-it mt-2"
          style={{ fontSize: 14, lineHeight: 1.45 }}
        >
          Voices, photos, and dispatches from {city?.name ?? "your city"}.
        </p>
      </div>
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
        suggestedProfiles={suggestedProfiles}
        reels={reels}
        followedIds={followedIds}
      />
    </div>
  );
}
