import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Business, StripeAccount } from "@/types/database";
import SettingsToggles from "./SettingsToggles";
import StripeConnectButton from "./StripeConnectButton";

export default async function DashboardSettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  const typedBusiness = business as Business;

  const { data: stripeAccount } = await supabase
    .from("stripe_accounts")
    .select("*")
    .eq("business_id", typedBusiness.id)
    .single();

  const stripe = stripeAccount as StripeAccount | null;

  return (
    <div className="px-4 py-5 space-y-5">
      <h1 className="font-heading text-xl font-bold">Settings</h1>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/dashboard/profile">
          <Card hover className="text-center py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold mx-auto mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Profile & Photos</span>
          </Card>
        </Link>
        <Link href="/dashboard/services">
          <Card hover className="text-center py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold mx-auto mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Services</span>
          </Card>
        </Link>
        <Link href="/dashboard/customers">
          <Card hover className="text-center py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-cyan mx-auto mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Customers</span>
          </Card>
        </Link>
        <Link href="/dashboard/messages">
          <Card hover className="text-center py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold mx-auto mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Messages</span>
          </Card>
        </Link>
        <Link href={`/business/${typedBusiness.id}`}>
          <Card hover className="text-center py-3">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-emerald mx-auto mb-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-xs font-medium">View Profile</span>
          </Card>
        </Link>
      </div>

      {/* Business Profile */}
      <Card>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Business Profile
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-txt-secondary">Name</span>
            <span className="font-medium">{typedBusiness.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Category</span>
            <span className="capitalize">{typedBusiness.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-secondary">Address</span>
            <span className="text-right max-w-[200px] truncate">
              {typedBusiness.address}
            </span>
          </div>
          {typedBusiness.phone && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Phone</span>
              <span>{typedBusiness.phone}</span>
            </div>
          )}
          {typedBusiness.website && (
            <div className="flex justify-between">
              <span className="text-txt-secondary">Website</span>
              <span className="truncate max-w-[180px]">
                {typedBusiness.website}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-txt-secondary">Status</span>
            <Badge
              label={typedBusiness.is_published ? "Published" : "Draft"}
              variant={typedBusiness.is_published ? "emerald" : "gold"}
              size="sm"
            />
          </div>
        </div>
      </Card>

      {/* Stripe Connect */}
      <Card glow={!stripe?.onboarding_complete}>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
          Payments (Stripe Connect)
        </h3>
        {stripe?.onboarding_complete ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald/15 flex items-center justify-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-emerald">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Stripe Connected</p>
                <p className="text-xs text-txt-secondary">
                  {stripe.charges_enabled ? "Charges enabled" : "Charges pending"}{" "}
                  &middot;{" "}
                  {stripe.payouts_enabled ? "Payouts enabled" : "Payouts pending"}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/payouts"
              className="inline-flex items-center gap-1.5 text-xs text-gold font-semibold hover:text-gold-light transition-colors"
            >
              View payout history →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-txt-secondary">
              Connect your Stripe account to accept payments from customers for
              orders and bookings.
            </p>
            <StripeConnectButton />
          </div>
        )}
      </Card>

      {/* Feature Toggles */}
      <SettingsToggles
        businessId={typedBusiness.id}
        initialAcceptsOrders={typedBusiness.accepts_orders}
        initialAcceptsBookings={typedBusiness.accepts_bookings}
        initialDeliveryEnabled={typedBusiness.delivery_enabled}
        initialDeliveryRadius={typedBusiness.delivery_radius}
        initialMinOrder={typedBusiness.min_order}
      />
    </div>
  );
}
