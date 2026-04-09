import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function verifyProgramOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  programId: string,
  districtNum: number
) {
  // Verify city_official role and matching district
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, district")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "city_official") {
    return { error: "Forbidden", status: 403 };
  }

  if (profile.district !== districtNum) {
    return { error: "You can only manage programs in your own district", status: 403 };
  }

  // Verify user is the creator
  const { data: program } = await supabase
    .from("district_programs")
    .select("id, created_by")
    .eq("id", programId)
    .single();

  if (!program) {
    return { error: "Program not found", status: 404 };
  }

  if (program.created_by !== userId) {
    return { error: "You can only modify programs you created", status: 403 };
  }

  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ district: string; programId: string }> }
) {
  try {
    const { district, programId } = await params;
    const districtNum = parseInt(district);
    if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
      return NextResponse.json({ error: "Invalid district" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownershipError = await verifyProgramOwnership(
      supabase,
      user.id,
      programId,
      districtNum
    );
    if (ownershipError) {
      return NextResponse.json(
        { error: ownershipError.error },
        { status: ownershipError.status }
      );
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      "title",
      "description",
      "category",
      "location_name",
      "schedule",
      "start_date",
      "end_date",
      "contact_name",
      "contact_phone",
      "contact_email",
      "image_url",
      "is_active",
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("district_programs")
      .update(updates)
      .eq("id", programId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ program: data });
  } catch (error) {
    console.error("Update program error:", error);
    return NextResponse.json(
      { error: "Failed to update program" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ district: string; programId: string }> }
) {
  try {
    const { district, programId } = await params;
    const districtNum = parseInt(district);
    if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
      return NextResponse.json({ error: "Invalid district" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownershipError = await verifyProgramOwnership(
      supabase,
      user.id,
      programId,
      districtNum
    );
    if (ownershipError) {
      return NextResponse.json(
        { error: ownershipError.error },
        { status: ownershipError.status }
      );
    }

    const { error } = await supabase
      .from("district_programs")
      .delete()
      .eq("id", programId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete program error:", error);
    return NextResponse.json(
      { error: "Failed to delete program" },
      { status: 500 }
    );
  }
}
