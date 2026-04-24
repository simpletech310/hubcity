import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { CivicOfficial } from "@/types/database";
import OfficialsClient from "./officials-client";

export const metadata = {
  title: "Elected Officials | Culture",
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
    <div className="culture-surface min-h-dvh">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § CIVIC · ACCOUNTABILITY · COMPTON
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Officials.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Compton City Council &amp; CUSD Board of Trustees. Real votes, real
          decisions — drawn from official records, court filings, state audits,
          CUSD BoardDocs, and investigative reporting.
        </p>
      </div>

      <OfficialsClient
        councilOfficials={councilOfficials}
        schoolOfficials={schoolOfficials}
      />
    </div>
  );
}
