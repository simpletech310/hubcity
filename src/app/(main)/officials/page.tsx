import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { CivicOfficial } from "@/types/database";
import OfficialsClient from "./officials-client";

export const metadata = {
  title: "Elected Officials | Hub City",
  description:
    "Track Compton's elected officials — City Council, Mayor, City Manager, CUSD Board of Trustees, and Superintendent. Voting records, accountability, and transparency.",
};

export default async function OfficialsPage() {
  const supabase = await createClient();

  const [{ data: officials }, { data: vectors }] = await Promise.all([
    supabase
      .from("civic_officials")
      .select("*, flags:official_flags(*)")
      .order("official_type")
      .order("district", { ascending: true, nullsFirst: false })
      .order("trustee_area", { ascending: true, nullsFirst: false }),
    supabase
      .from("accountability_vectors")
      .select("*")
      .order("sort_order"),
  ]);

  const councilOfficials = (officials ?? []).filter((o: CivicOfficial) =>
    ["mayor", "council_member", "city_manager"].includes(o.official_type)
  );

  const schoolOfficials = (officials ?? []).filter((o: CivicOfficial) =>
    ["school_trustee", "board_president", "board_vp", "board_clerk", "board_member", "superintendent"].includes(o.official_type)
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <span className="text-gold text-lg">&#127963;</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-heading tracking-tight">
                Elected Officials
              </h1>
              <p className="text-sm text-zinc-400">
                Compton City Council &amp; CUSD Board of Trustees
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-3 max-w-2xl leading-relaxed">
            Real votes. Real decisions. Built from official City of Compton
            records, court filings, state audits, CUSD BoardDocs, and
            investigative reporting. Know who represents you and how they use
            their power.
          </p>
        </div>
      </div>

      <OfficialsClient
        councilOfficials={councilOfficials}
        schoolOfficials={schoolOfficials}
      />
    </div>
  );
}
