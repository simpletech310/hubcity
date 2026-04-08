import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseHashtags,
  extractLocationFromText,
  generateIssueTitle,
  ISSUE_DEPARTMENT_MAP,
} from "@/lib/hashtags";
import { parseMentions } from "@/lib/mentions";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

// Issue-type hashtags that auto-create city issues
const ISSUE_HASHTAGS = new Set([
  "pothole",
  "streetlight",
  "graffiti",
  "trash",
  "flooding",
  "parking",
  "noise",
  "sidewalk",
  "tree",
  "parks",
  "water",
  "stray",
  "safety",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only non-citizen roles can create posts
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role === "citizen") {
      return NextResponse.json(
        { error: "Citizens cannot create posts. Only official accounts, businesses, and creators can post." },
        { status: 403 }
      );
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const {
      body,
      image_url,
      video_url,
      mux_upload_id,
      is_highlight,
      location_text: inputLocation,
      latitude,
      longitude,
    } = await request.json();

    if (!body || typeof body !== "string" || !body.trim()) {
      return NextResponse.json(
        { error: "Post body is required" },
        { status: 400 }
      );
    }

    // Parse hashtags
    const hashtags = parseHashtags(body);
    const hashtagStrings = hashtags.map((h) => h.tag);

    // Determine media type
    let media_type: string | null = null;
    let video_status: string | null = null;

    if (is_highlight && !video_url && !image_url) {
      return NextResponse.json(
        { error: "Highlights require a photo or video" },
        { status: 400 }
      );
    }

    if (image_url) {
      media_type = "image";
    } else if (video_url) {
      media_type = "video";
      video_status = "ready";
    } else if (mux_upload_id) {
      media_type = "video";
      video_status = "preparing";
    }

    // Extract location from text if not provided
    const extractedLocation =
      inputLocation || extractLocationFromText(body);

    // Use admin client to bypass RLS for insert (auth already validated above)
    const adminClient = createAdminClient();
    const { data: post, error } = await adminClient
      .from("posts")
      .insert({
        author_id: user.id,
        body: body.trim(),
        image_url: image_url || null,
        video_url: video_url || null,
        media_type,
        mux_upload_id: mux_upload_id || null,
        video_status,
        reaction_counts: {},
        is_highlight: is_highlight || false,
        is_published: true,
        hashtags: hashtagStrings,
        location_text: extractedLocation || null,
        latitude: latitude || null,
        longitude: longitude || null,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Check for issue-type hashtags and auto-create city issues
    const issueHashtags = hashtagStrings.filter((h) =>
      ISSUE_HASHTAGS.has(h)
    );
    const createdIssues: string[] = [];

    if (issueHashtags.length > 0 && post) {
      // Get user's district for the issue
      const { data: profile } = await adminClient
        .from("profiles")
        .select("district")
        .eq("id", user.id)
        .single();

      for (const issueType of issueHashtags) {
        const dept = ISSUE_DEPARTMENT_MAP[issueType];
        const title = generateIssueTitle(issueType, extractedLocation);

        const { data: issue } = await adminClient
          .from("city_issues")
          .insert({
            type: issueType,
            title,
            description: body.trim(),
            location_text: extractedLocation || null,
            latitude: latitude || null,
            longitude: longitude || null,
            district: profile?.district || null,
            image_url: image_url || null,
            source_post_id: post.id,
            reported_by: user.id,
            assigned_department: dept?.department || null,
            department_email: dept?.email || null,
          })
          .select("id")
          .single();

        if (issue) {
          createdIssues.push(issue.id);
        }
      }

      // Auto-reply comment on the post about the issue being tracked
      if (createdIssues.length > 0) {
        // Find or use a system bot for the reply
        const { data: botProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("is_bot", true)
          .eq("handle", "hubcity")
          .limit(1)
          .single();

        if (botProfile) {
          const issueWord =
            createdIssues.length === 1 ? "issue" : "issues";
          await adminClient.from("post_comments").insert({
            post_id: post.id,
            author_id: botProfile.id,
            body: `✅ Thanks for reporting! ${createdIssues.length} city ${issueWord} automatically created and added to the tracker. The relevant department has been notified. Track status at /city-hall/issues`,
            is_published: true,
          });

          // Update comment count
          await adminClient
            .from("posts")
            .update({ comment_count: 1 })
            .eq("id", post.id);
        }
      }
    }

    // Parse @mentions and create notifications
    const mentionedHandles = parseMentions(body);
    if (mentionedHandles.length > 0 && post) {
      // Get author display name
      const { data: authorProfile } = await adminClient
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const authorName = authorProfile?.display_name || "Someone";

      // Look up profiles by handle (case-insensitive via ilike)
      for (const handle of mentionedHandles) {
        const { data: mentioned } = await adminClient
          .from("profiles")
          .select("id")
          .ilike("handle", handle)
          .single();

        if (mentioned && mentioned.id !== user.id) {
          await adminClient.from("notifications").insert({
            user_id: mentioned.id,
            type: "mention",
            title: `${authorName} mentioned you`,
            body: post.body.slice(0, 100),
            link_type: "post",
            link_id: post.id,
          });
        }
      }
    }

    return NextResponse.json({
      post,
      hashtags: hashtagStrings,
      created_issues: createdIssues,
    });
  } catch (error) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
