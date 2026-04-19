import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Helper — returns { application, role } when the caller is allowed to see
 * the thread, or a Response to short-circuit.
 */
async function authorizeThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  userId: string
): Promise<
  | {
      application: { id: string; applicant_id: string; job_listing_id: string };
      role: "applicant" | "employer" | "admin";
    }
  | Response
> {
  const { data: application } = await supabase
    .from("job_applications")
    .select("id, applicant_id, job_listing_id")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.applicant_id === userId) {
    return { application, role: "applicant" };
  }

  const { data: listing } = await supabase
    .from("job_listings")
    .select("id, posted_by")
    .eq("id", application.job_listing_id)
    .single();

  if (listing?.posted_by === userId) {
    return { application, role: "employer" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return { application, role: "admin" };
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * GET /api/jobs/applications/[id]/messages
 * Returns the full message thread for an application, oldest first.
 * Marks the caller's incoming unread messages as read.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeThread(supabase, applicationId, user.id);
    if (auth instanceof Response) return auth;

    const { data: messages, error } = await supabase
      .from("job_messages")
      .select(
        "id, application_id, sender_id, body, read_at, created_at, sender:profiles!job_messages_sender_id_fkey(id, display_name, avatar_url)"
      )
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Mark incoming unread messages as read for this viewer.
    const nowIso = new Date().toISOString();
    await supabase
      .from("job_messages")
      .update({ read_at: nowIso })
      .eq("application_id", applicationId)
      .is("read_at", null)
      .neq("sender_id", user.id);

    return NextResponse.json({ messages: messages ?? [] });
  } catch (error) {
    console.error("Get job messages error:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs/applications/[id]/messages
 * Body: { body: string }
 * Posts a message from the authenticated thread party.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await authorizeThread(supabase, applicationId, user.id);
    if (auth instanceof Response) return auth;

    const { body } = (await request.json()) as { body?: string };
    const text = (body || "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }
    if (text.length > 5000) {
      return NextResponse.json(
        { error: "Message must be 5000 characters or fewer" },
        { status: 400 }
      );
    }

    const { data: message, error } = await supabase
      .from("job_messages")
      .insert({
        application_id: applicationId,
        sender_id: user.id,
        body: text,
      })
      .select(
        "id, application_id, sender_id, body, read_at, created_at, sender:profiles!job_messages_sender_id_fkey(id, display_name, avatar_url)"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Post job message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
