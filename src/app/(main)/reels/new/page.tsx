import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ReelComposer from "@/components/reels/ReelComposer";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

export const metadata = { title: "New Reel | Culture" };

export default async function NewReelPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/reels/new");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.verification_status === "verified";

  return (
    <div className="animate-fade-in pb-safe min-h-screen">
      <div className="flex items-center gap-3 px-5 pt-4 pb-5 border-b border-border-subtle">
        <Link
          href="/reels"
          className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-white press"
          aria-label="Back"
        >
          <Icon name="back" size={16} />
        </Link>
        <h1 className="font-heading font-bold text-lg">New Reel</h1>
      </div>

      <div className="px-5 py-5">
        {!isVerified ? (
          <div className="rounded-2xl border border-coral/30 bg-coral/[0.08] p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-coral/20 flex items-center justify-center">
              <Icon name="warning" size={20} className="text-coral" />
            </div>
            <h2 className="font-heading font-bold text-base mb-1">
              Verification required
            </h2>
            <p className="text-sm text-white/60 mb-4">
              Your account needs to be verified before posting reels.
            </p>
            <Link
              href="/settings"
              className="inline-block px-4 py-2 rounded-full bg-gold text-midnight font-bold text-sm press"
            >
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
