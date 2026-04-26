import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface BecomeProviderBody {
  organization_name?: string;
  phone?: string;
  website?: string;
  mission?: string;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as BecomeProviderBody;

    const { data, error } = await supabase.rpc("become_resource_provider", {
      org_name: body.organization_name?.trim() || null,
      org_phone: body.phone?.trim() || null,
      org_website: body.website?.trim() || null,
      org_mission: body.mission?.trim() || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
