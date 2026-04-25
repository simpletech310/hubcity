import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReelComposer from "@/components/reels/ReelComposer";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

export const metadata = { title: "New Moment | Culture" };

export default async function NewMomentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/moments/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.verification_status === "verified";

  return (
    <div className="animate-fade-in pb-safe min-h-screen">
      <div
        className="flex items-center gap-3 px-5 pt-4 pb-5"
        style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/moments"
          className="w-9 h-9 rounded-full flex items-center justify-center press"
          style={{
            background: "var(--paper-soft)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--ink-strong)",
          }}
          aria-label="Back"
        >
          <Icon name="back" size={16} />
        </Link>
        <h1 className="c-card-t" style={{ fontSize: 18, color: "var(--ink-strong)" }}>New Moment</h1>
      </div>

      <div className="px-5 py-5">
        {!isVerified ? (
          <div
            className="p-5 text-center"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                background: "var(--gold-c)",
                border: "2px solid var(--rule-strong-c)",
              }}
            >
              <Icon name="warning" size={20} style={{ color: "var(--ink-strong)" }} />
            </div>
            <h2 className="c-card-t mb-1" style={{ fontSize: 16, color: "var(--ink-strong)" }}>
              Verification required
            </h2>
            <p className="c-body mb-4" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
              Your account needs to be verified before sharing moments.
            </p>
            <Link href="/settings" className="c-btn c-btn-primary c-btn-sm inline-block">
              Verify account
            </Link>
          </div>
        ) : (
          <ReelComposer />
        )}
      </div>
    </div>
  );
}
