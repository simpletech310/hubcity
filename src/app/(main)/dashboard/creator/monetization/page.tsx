import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MonetizationClient from "./MonetizationClient";

interface VideoRow {
  id: string;
  title: string;
  access_type: "free" | "subscribers" | "ppv" | null;
  is_premium: boolean | null;
  price_cents: number | null;
  view_count: number;
  is_published: boolean;
  published_at: string | null;
}

export default async function MonetizationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/creator/monetization");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_creator, role")
    .eq("id", user.id)
    .maybeSingle();
  const isCreator =
    profile?.is_creator === true || profile?.role === "content_creator";
  if (!isCreator) redirect("/creators/apply");

  const { data: channel } = await supabase
    .from("channels")
    .select(
      "id, name, slug, subscription_price_cents, subscription_currency"
    )
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const { data: stripe } = await supabase
    .from("creator_stripe_accounts")
    .select("charges_enabled")
    .eq("creator_id", user.id)
    .maybeSingle();

  let videos: VideoRow[] = [];
  if (channel?.id) {
    const { data: vids } = await supabase
      .from("channel_videos")
      .select(
        "id, title, access_type, is_premium, price_cents, view_count, is_published, published_at"
      )
      .eq("channel_id", channel.id)
      .order("published_at", { ascending: false });
    videos = (vids ?? []) as VideoRow[];
  }

  return (
    <MonetizationClient
      channel={channel ?? null}
      stripeReady={Boolean(stripe?.charges_enabled)}
      videos={videos}
    />
  );
}
