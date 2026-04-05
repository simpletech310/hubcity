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
    <div className="animate-fade-in pb-safe">
      {/* Hero skeleton */}
      <div className="relative h-56 overflow-hidden bg-card">
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/60 via-midnight/80 to-midnight" />
        <div className="absolute inset-0 flex flex-col items-start justify-end px-5 pb-5">
          <div className="h-6 w-48 bg-white/10 rounded-full mb-3 animate-pulse" />
          <div className="h-8 w-40 bg-white/10 rounded-lg mb-1 animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="px-5 -mt-3 mb-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-border-subtle rounded-xl p-2.5 text-center">
              <div className="h-5 w-8 bg-white/10 rounded mx-auto mb-1 animate-pulse" />
              <div className="h-2 w-12 bg-white/10 rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      {/* Search skeleton */}
      <div className="px-5 mb-4">
        <div className="h-12 bg-card border border-border-subtle rounded-xl animate-pulse" />
      </div>
      {/* Filter chips skeleton */}
      <div className="flex gap-2 px-5 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-white/[0.04] rounded-full animate-pulse shrink-0" />
        ))}
      </div>
      {/* Cards skeleton */}
      <div className="px-5 mb-8 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border-subtle rounded-2xl p-4 animate-pulse">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div className="flex-1">
                <div className="h-4 w-40 bg-white/10 rounded mb-1" />
                <div className="h-3 w-56 bg-white/10 rounded" />
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-3 w-16 bg-white/10 rounded" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-6 w-24 bg-white/[0.04] rounded-full" />
              ))}
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
      <div className="animate-fade-in pb-safe">
        <div className="px-5 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1">Unable to load schools</p>
          <p className="text-xs text-white/40">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!schools || schools.length === 0) {
    return (
      <div className="animate-fade-in pb-safe">
        <div className="px-5 py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21V7l9-4 9 4v14M3 21h18M9 21V11h6v10" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1">No schools yet</p>
          <p className="text-xs text-white/40">Schools will appear here once added</p>
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
