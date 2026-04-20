import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import PayoutsClient from "./PayoutsClient";

export const metadata = {
  title: "Payouts",
};

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
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

  const { data: stripeAccount } = await supabase
    .from("stripe_accounts")
    .select("onboarding_complete, payouts_enabled")
    .eq("business_id", business.id)
    .single();

  const ready = !!stripeAccount?.onboarding_complete;

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold">Payouts</h1>
          <p className="text-xs text-txt-secondary mt-0.5">
            Money paid out to your bank account.
          </p>
        </div>
      </div>

      {!ready ? (
        <Card glow>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Stripe not connected</p>
            <p className="text-xs text-txt-secondary">
              Connect your Stripe account to start receiving payouts for orders
              and bookings.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-block mt-2 px-3 py-1.5 bg-gradient-to-r from-gold to-gold-light text-midnight text-xs font-semibold rounded-lg"
            >
              Set up payments
            </Link>
          </div>
        </Card>
      ) : (
        <PayoutsClient
          payoutsEnabled={!!stripeAccount?.payouts_enabled}
        />
      )}
    </div>
  );
}
