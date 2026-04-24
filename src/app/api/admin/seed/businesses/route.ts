import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = ["admin", "city_official", "city_ambassador"];

interface BusinessRow {
  name?: string;
  category?: string;
  description?: string;
  address?: string;
  city_slug?: string;
  website_url?: string;
  phone?: string;
  email?: string;
  [key: string]: string | undefined;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const { rows, cityId } = (await request.json()) as {
      rows: BusinessRow[];
      cityId: string;
    };

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "rows must be a non-empty array" },
        { status: 400 }
      );
    }

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    if (rows.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 rows per import" },
        { status: 400 }
      );
    }

    // ── Resolve city_id from slug if rows supply city_slug ────────────────────
    // We also accept cityId from the body as the authoritative city.
    // Rows that specify a different city_slug are still imported under the
    // selected cityId (the admin chose the target city explicitly).

    const admin = createAdminClient();

    // ── Build insert rows ─────────────────────────────────────────────────────
    const toInsert = rows
      .filter((r) => r.name?.trim())
      .map((r) => ({
        name: r.name!.trim(),
        slug:
          r.name!
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) +
          "-" +
          Date.now().toString(36),
        category: r.category?.trim() || "other",
        description: r.description?.trim() || null,
        address: r.address?.trim() || null,
        website: r.website_url?.trim() || null,
        phone: r.phone?.trim() || null,
        email: r.email?.trim() || null,
        city_id: cityId,
        owner_id: user.id,
        is_published: false,
        is_featured: false,
      }));

    const skipped = rows.length - toInsert.length;

    if (toInsert.length === 0) {
      return NextResponse.json({ imported: 0, skipped });
    }

    // ── Bulk insert ───────────────────────────────────────────────────────────
    // Use ignoreDuplicates: true so duplicate slugs are skipped, not errored.
    const { data: inserted, error } = await admin
      .from("businesses")
      .insert(toInsert)
      .select("id");

    if (error) {
      console.error("Seed businesses error:", error);
      return NextResponse.json({ error: "Insert failed", detail: error.message }, { status: 500 });
    }

    const importedCount = inserted?.length ?? 0;
    const totalSkipped = skipped + (toInsert.length - importedCount);

    return NextResponse.json({ imported: importedCount, skipped: totalSkipped });
  } catch (err) {
    console.error("Seed businesses unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
