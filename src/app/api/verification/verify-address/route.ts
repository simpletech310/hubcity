import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveCityByZip, listLiveCities } from "@/lib/cities";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

type Body = {
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
};

const ZIP_RE = /^\d{5}$/;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Body;
    const addressLine1 = (body.address_line1 ?? "").trim();
    const addressLine2 = (body.address_line2 ?? "").trim();
    const cityName = (body.city ?? "").trim();
    const state = (body.state ?? "").trim();
    const zip = (body.zip ?? "").trim();

    if (!addressLine1) {
      return NextResponse.json(
        { error: "Street address is required" },
        { status: 400 }
      );
    }
    if (!ZIP_RE.test(zip)) {
      return NextResponse.json(
        { error: "ZIP must be a 5-digit US ZIP code" },
        { status: 400 }
      );
    }

    const submittedAddress = [addressLine1, addressLine2, cityName, state, zip]
      .filter(Boolean)
      .join(", ");

    const admin = createAdminClient();

    const { city, ambiguous } = await resolveCityByZip(zip);

    // ── 1. Ambiguous ZIP → queue for manual review ────────────────────
    if (ambiguous) {
      await admin.from("address_verifications").insert({
        user_id: user.id,
        submitted_address: submittedAddress,
        normalized_address: submittedAddress,
        zip,
        city_id: null,
        method: "manual",
        source: "zip_match",
        outcome: "ambiguous",
        confidence: null,
        notes: "ZIP matches multiple cities; awaiting manual review.",
      });
      return NextResponse.json(
        {
          status: "pending_review",
          message:
            "Your address matches multiple cities; an admin will review.",
        },
        { status: 202 }
      );
    }

    // ── 2. No city match → reject ─────────────────────────────────────
    if (!city) {
      const live = await listLiveCities();
      await admin.from("address_verifications").insert({
        user_id: user.id,
        submitted_address: submittedAddress,
        normalized_address: submittedAddress,
        zip,
        city_id: null,
        method: "automated",
        source: "zip_match",
        outcome: "rejected",
        confidence: 0,
        notes: `ZIP ${zip} is not in any supported city.`,
      });
      return NextResponse.json(
        {
          error: "Address not in a supported city",
          supported: live.map((c) => c.name),
        },
        { status: 400 }
      );
    }

    // ── 3. City found but not live ────────────────────────────────────
    if (city.launch_status !== "live") {
      await admin.from("address_verifications").insert({
        user_id: user.id,
        submitted_address: submittedAddress,
        normalized_address: submittedAddress,
        zip,
        city_id: city.id,
        method: "automated",
        source: "zip_match",
        outcome: "rejected",
        confidence: 0,
        notes: `City ${city.name} is not live yet.`,
      });
      return NextResponse.json(
        { error: "This city is not live yet" },
        { status: 400 }
      );
    }

    // ── 4. Success path: audit + update profile + upsert home city ────
    const { error: auditErr } = await admin
      .from("address_verifications")
      .insert({
        user_id: user.id,
        submitted_address: submittedAddress,
        normalized_address: submittedAddress,
        zip,
        city_id: city.id,
        method: "automated",
        source: "zip_match",
        outcome: "verified",
        confidence: 0.8,
      });
    if (auditErr) throw auditErr;

    const profileUpdate: Record<string, unknown> = {
      verification_status: "verified",
      city_id: city.id,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      zip,
      address_verified_at: new Date().toISOString(),
      verification_method: "automated",
      verification_source: "zip_match",
      verification_confidence: 0.8,
    };
    if (cityName) profileUpdate.city = cityName;
    if (state) profileUpdate.state = state;

    const { error: profileErr } = await admin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);
    if (profileErr) throw profileErr;

    const { error: ucErr } = await admin.from("user_cities").upsert(
      {
        user_id: user.id,
        city_id: city.id,
        role: "home",
        verified_at: new Date().toISOString(),
      },
      { onConflict: "user_id,city_id" }
    );
    if (ucErr) throw ucErr;

    return NextResponse.json({
      status: "verified",
      city: { id: city.id, slug: city.slug, name: city.name },
    });
  } catch (error) {
    console.error("verify-address error:", error);
    return NextResponse.json(
      { error: "Failed to verify address" },
      { status: 500 }
    );
  }
}
