import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import OpenPortalButton from "./OpenPortalButton";

function fmt(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/profile/subscriptions");

  const { data: subs } = await supabase
    .from("channel_subscriptions")
    .select(
      "id, status, current_period_end, cancel_at_period_end, amount_cents, currency, channel:channels(id, name, slug, avatar_url)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (subs ?? []) as Array<{
    id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    amount_cents: number | null;
    currency: string | null;
    channel:
      | { id: string; name: string; slug: string; avatar_url: string | null }
      | { id: string; name: string; slug: string; avatar_url: string | null }[]
      | null;
  }>;

  return (
    <div className="animate-fade-in pb-safe">
      <div className="px-5 pt-6 pb-3">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-xs text-txt-secondary hover:text-white mb-3"
        >
          <Icon name="back" size={14} /> Back to profile
        </Link>
        <h1 className="font-heading font-bold text-2xl">Subscriptions</h1>
        <p className="text-xs text-txt-secondary">
          Channels you support, billing, and receipts.
        </p>
      </div>

      <div className="px-5 mb-4">
        <OpenPortalButton />
      </div>

      <div className="px-5 space-y-3 mb-8">
        {list.length === 0 ? (
          <Card>
            <div className="text-center py-6">
              <Icon
                name="dollar"
                size={28}
                className="text-txt-secondary mx-auto mb-2"
              />
              <p className="text-sm text-txt-secondary">
                You haven&apos;t subscribed to any creators yet.
              </p>
              <Link href="/live" className="text-xs text-gold underline mt-2 inline-block">
                Browse channels
              </Link>
            </div>
          </Card>
        ) : (
          list.map((sub) => {
            const channel = Array.isArray(sub.channel)
              ? sub.channel[0]
              : sub.channel;
            if (!channel) return null;
            return (
              <Card key={sub.id}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-royal to-hc-purple flex items-center justify-center overflow-hidden shrink-0">
                    {channel.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={channel.avatar_url}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gold font-heading font-bold text-sm">
                        {channel.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/live/channel/${channel.id}`}
                      className="text-sm font-bold hover:text-gold truncate block"
                    >
                      {channel.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        label={sub.status}
                        variant={
                          sub.status === "active" || sub.status === "trialing"
                            ? "emerald"
                            : sub.status === "past_due" ||
                                sub.status === "unpaid"
                              ? "coral"
                              : "gold"
                        }
                      />
                      {sub.amount_cents ? (
                        <span className="text-[10px] text-txt-secondary">
                          {fmt(sub.amount_cents, sub.currency ?? "usd")}/mo
                        </span>
                      ) : null}
                    </div>
                    {sub.current_period_end && (
                      <p className="text-[10px] text-txt-secondary mt-1">
                        {sub.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                        {new Date(sub.current_period_end).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
