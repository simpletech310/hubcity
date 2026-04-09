import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — Officials for a given district (1-4)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ district: string }> }
) {
  try {
    const { district } = await params;
    const districtNum = parseInt(district, 10);

    if (isNaN(districtNum) || districtNum < 1 || districtNum > 4) {
      return NextResponse.json(
        { error: "Invalid district. Must be 1-4." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get council member for this district
    const { data: councilMember, error: councilError } = await supabase
      .from("civic_officials")
      .select("*")
      .eq("official_type", "council_member")
      .eq("district", districtNum)
      .single();

    if (councilError && councilError.code !== "PGRST116") throw councilError;

    // Get the mayor (district IS NULL, type = mayor)
    const { data: mayor, error: mayorError } = await supabase
      .from("civic_officials")
      .select("*")
      .eq("official_type", "mayor")
      .is("district", null)
      .single();

    if (mayorError && mayorError.code !== "PGRST116") throw mayorError;

    // Look up trustee areas for ZIPs associated with this district
    const { data: zipMappings, error: zipError } = await supabase
      .from("zip_to_trustee_area")
      .select("trustee_area")
      .eq("district", districtNum);

    if (zipError) throw zipError;

    // Get unique trustee areas
    const trusteeAreas = [
      ...new Set((zipMappings ?? []).map((z) => z.trustee_area)),
    ];

    let trustees: typeof councilMember[] = [];

    if (trusteeAreas.length > 0) {
      const { data: trusteeData, error: trusteeError } = await supabase
        .from("civic_officials")
        .select("*")
        .in("official_type", [
          "school_trustee",
          "board_president",
          "board_vp",
          "board_clerk",
          "board_member",
        ])
        .in("trustee_area", trusteeAreas);

      if (trusteeError) throw trusteeError;
      trustees = trusteeData ?? [];
    }

    return NextResponse.json({
      council_member: councilMember ?? null,
      mayor: mayor ?? null,
      trustees,
    });
  } catch (error) {
    console.error("District officials fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch district officials" },
      { status: 500 }
    );
  }
}
