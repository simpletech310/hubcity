import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SchoolsClientPage from "./schools-client";

export const revalidate = 300; // revalidate every 5 minutes

export type SchoolLevel = "high_school" | "middle_school" | "elementary" | "college";

export interface SchoolColor {
  hex: string;
  name: string;
}

export interface School {
  id: string;
  slug: string;
  name: string;
  level: SchoolLevel;
  address: string;
  grades: string;
  phone: string | null;
  website: string | null;
  mascot: string | null;
  tagline: string | null;
  enrollment: number | null;
  rating: number | null;
  established: number | null;
  colors: SchoolColor[] | null;
  programs: string[] | null;
  highlights: string[] | null;
  notable_alumni: string[] | null;
  image_url: string | null;
  principal: string | null;
}

function SchoolsLoadingSkeleton() {
  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>
          § CIVIC · SCHOOLS · COMPTON
        </div>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 56, lineHeight: 0.88, letterSpacing: "-0.02em" }}
        >
          Schools.
        </h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Loading the district.
        </p>
      </div>
      <div className="px-[18px] mt-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse"
            style={{ border: "2px solid var(--rule-strong-c)", background: "var(--paper-soft)", padding: 16 }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                style={{ width: 48, height: 48, background: "var(--ink-strong)", opacity: 0.15 }}
              />
              <div className="flex-1 space-y-2">
                <div style={{ height: 14, width: 160, background: "var(--ink-strong)", opacity: 0.15 }} />
                <div style={{ height: 10, width: 220, background: "var(--ink-strong)", opacity: 0.08 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function SchoolsData() {
  const supabase = await createClient();

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id, slug, name, level, address, grades, phone, website, mascot, tagline, enrollment, rating, established, colors, programs, highlights, notable_alumni, image_url, principal")
    .eq("is_published", true)
    .order("name");

  if (error) {
    console.error("Failed to fetch schools:", error);
    return (
      <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
        <div className="px-5 py-20 text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 56, height: 56, border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--ink-strong)", opacity: 0.5 }} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10" />
            </svg>
          </div>
          <p className="c-card-t" style={{ fontSize: 14 }}>Unable to load schools</p>
          <p className="c-serif-it mt-1" style={{ fontSize: 12, opacity: 0.7 }}>Please try again later</p>
        </div>
      </div>
    );
  }

  if (!schools || schools.length === 0) {
    return (
      <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
        <div className="px-5 py-20 text-center">
          <div
            className="mx-auto mb-4 flex items-center justify-center"
            style={{ width: 56, height: 56, border: "2px solid var(--rule-strong-c)", background: "var(--paper)" }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--ink-strong)", opacity: 0.5 }} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10" />
            </svg>
          </div>
          <p className="c-card-t" style={{ fontSize: 14 }}>No schools yet</p>
          <p className="c-serif-it mt-1" style={{ fontSize: 12, opacity: 0.7 }}>Schools will appear here once added</p>
        </div>
      </div>
    );
  }

  return <SchoolsClientPage schools={schools as School[]} />;
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={<SchoolsLoadingSkeleton />}>
      <SchoolsData />
    </Suspense>
  );
}
