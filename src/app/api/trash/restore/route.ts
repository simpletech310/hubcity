import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  SOFT_DELETE_TABLES,
  OWNER_COLUMN,
  restoreSoftDeleted,
  type SoftDeletableTable,
} from "@/lib/soft-delete";

/**
 * POST /api/trash/restore
 * Body: { table, id }
 *
 * Restores a soft-deleted row owned by the signed-in user (admins can
 * restore anything). Owner check happens here in JS because the RLS
 * UPDATE policy on each table varies.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { table, id } = body as {
      table?: string;
      id?: string;
    };
    if (
      !id ||
      !table ||
      !SOFT_DELETE_TABLES.includes(table as SoftDeletableTable)
    ) {
      return NextResponse.json({ error: "Invalid table or id" }, { status: 400 });
    }
    const t = table as SoftDeletableTable;
    const ownerCol = OWNER_COLUMN[t];

    // Verify ownership (or admin).
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin = profile?.role === "admin";

    const { data: rowRaw } = await supabase
      .from(t)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!rowRaw) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const ownerId = (rowRaw as unknown as Record<string, unknown>)[ownerCol];
    if (!isAdmin && ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await restoreSoftDeleted(supabase, t, id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error ?? "Restore failed" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Trash restore error:", err);
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
