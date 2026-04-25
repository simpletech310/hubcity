import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SubmitShowForm from "@/components/live/SubmitShowForm";

export default async function SubmitShowPage() {
  const supabase = await createClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("slug, name")
    .eq("scope", "national")
    .eq("is_active", true)
    .neq("slug", "knect-tv-live")
    .order("name", { ascending: true });

  return (
    <div className="animate-fade-in pb-24">
      <div className="px-5 pt-4">
        <Link
          href="/live"
          className="inline-flex items-center gap-1.5 text-[12px] c-meta hover:text-[var(--ink-strong)] transition-colors press mb-3"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </Link>

        <h1 className="font-heading font-bold text-2xl mb-2" style={{ color: "var(--ink-strong)" }}>Pitch a Show</h1>
        <p className="text-sm c-meta mb-6">
          Got an idea for a Culture TV show? Tell us about it. We&apos;ll review it and reach out if
          it&apos;s a fit.
        </p>

        <SubmitShowForm channels={channels || []} />
      </div>
    </div>
  );
}
