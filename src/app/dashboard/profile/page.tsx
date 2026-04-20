import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import type { Business } from "@/types/database";
import BusinessProfileEditor from "./BusinessProfileEditor";

export const metadata = { title: "Business Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return (
      <div className="px-4 py-5">
        <Card className="text-center py-10">
          <p className="text-sm text-txt-secondary">No business found.</p>
        </Card>
      </div>
    );
  }

  const biz = business as Business;

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Business Profile</h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            Photos and story shown on your public page.
          </p>
        </div>
        <Link
          href={`/business/${biz.slug || biz.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold font-semibold press"
        >
          View public page →
        </Link>
      </div>

      <BusinessProfileEditor
        businessId={biz.id}
        initialImages={biz.image_urls || []}
        initialStory={biz.story || ""}
      />
    </div>
  );
}
