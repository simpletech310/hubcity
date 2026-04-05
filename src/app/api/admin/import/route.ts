import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_TYPES = ["businesses", "events", "resources", "schools", "jobs"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
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

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { type, records } = await request.json();

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "Records must be a non-empty array" },
        { status: 400 }
      );
    }

    if (records.length > 500) {
      return NextResponse.json(
        { error: "Maximum 500 records per import" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let inserted = 0;
    let errors: string[] = [];

    // Process based on type
    if (type === "businesses") {
      const rows = records.map((r: Record<string, unknown>, i: number) => {
        if (!r.name) {
          errors.push(`Row ${i + 1}: name is required`);
          return null;
        }
        return {
          name: r.name,
          slug: String(r.slug || r.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          category: r.category || "other",
          description: r.description || null,
          address: r.address || null,
          phone: r.phone || null,
          email: r.email || null,
          website: r.website || null,
          hours: r.hours || null,
          owner_id: r.owner_id || null,
          is_published: r.is_published !== false,
          is_featured: r.is_featured === true,
          district: r.district || null,
        };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { data, error } = await admin.from("businesses").insert(rows).select("id");
        if (error) throw error;
        inserted = data?.length || 0;
      }
    } else if (type === "events") {
      const rows = records.map((r: Record<string, unknown>, i: number) => {
        if (!r.title || !r.start_date) {
          errors.push(`Row ${i + 1}: title and start_date are required`);
          return null;
        }
        return {
          title: r.title,
          slug: String(r.slug || r.title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          description: r.description || null,
          category: r.category || "other",
          start_date: r.start_date,
          start_time: r.start_time || null,
          end_date: r.end_date || null,
          end_time: r.end_time || null,
          location_name: r.location_name || null,
          address: r.address || null,
          is_published: r.is_published !== false,
          is_featured: r.is_featured === true,
          created_by: user.id,
        };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { data, error } = await admin.from("events").insert(rows).select("id");
        if (error) throw error;
        inserted = data?.length || 0;
      }
    } else if (type === "resources") {
      const rows = records.map((r: Record<string, unknown>, i: number) => {
        if (!r.title) {
          errors.push(`Row ${i + 1}: title is required`);
          return null;
        }
        return {
          title: r.title,
          description: r.description || null,
          category: r.category || "other",
          eligibility: r.eligibility || null,
          how_to_apply: r.how_to_apply || null,
          deadline: r.deadline || null,
          contact_phone: r.contact_phone || null,
          contact_email: r.contact_email || null,
          website_url: r.website_url || null,
          is_published: r.is_published !== false,
          created_by: user.id,
        };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { data, error } = await admin.from("resources").insert(rows).select("id");
        if (error) throw error;
        inserted = data?.length || 0;
      }
    } else if (type === "schools") {
      const rows = records.map((r: Record<string, unknown>, i: number) => {
        if (!r.name) {
          errors.push(`Row ${i + 1}: name is required`);
          return null;
        }
        return {
          name: r.name,
          slug: String(r.slug || r.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          school_type: r.school_type || "elementary",
          address: r.address || null,
          phone: r.phone || null,
          website: r.website || null,
          principal: r.principal || null,
          district: r.district || null,
          enrollment: r.enrollment || null,
          grades: r.grades || null,
          rating: r.rating || null,
        };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { data, error } = await admin.from("schools").insert(rows).select("id");
        if (error) throw error;
        inserted = data?.length || 0;
      }
    } else if (type === "jobs") {
      const rows = records.map((r: Record<string, unknown>, i: number) => {
        if (!r.title) {
          errors.push(`Row ${i + 1}: title is required`);
          return null;
        }
        return {
          title: r.title,
          description: r.description || null,
          company_name: r.company_name || null,
          category: r.category || "other",
          employment_type: r.employment_type || "full_time",
          salary_min: r.salary_min || null,
          salary_max: r.salary_max || null,
          location: r.location || "Compton, CA",
          is_remote: r.is_remote === true,
          is_published: r.is_published !== false,
          posted_by: user.id,
        };
      }).filter(Boolean);

      if (rows.length > 0) {
        const { data, error } = await admin.from("jobs").insert(rows).select("id");
        if (error) throw error;
        inserted = data?.length || 0;
      }
    }

    // Audit log
    await admin.from("audit_log").insert({
      admin_id: user.id,
      action: "bulk_import",
      target_type: type,
      details: { inserted, errors: errors.length, total_records: records.length },
    });

    return NextResponse.json({
      success: true,
      inserted,
      errors,
      total: records.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
