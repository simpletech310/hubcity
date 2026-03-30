import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { BusinessCustomer } from "@/types/database";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: string | null) {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardCustomersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  const { data: customers } = await supabase
    .from("business_customers")
    .select(
      "*, customer:profiles!business_customers_customer_id_fkey(id, display_name, handle, avatar_url)"
    )
    .eq("business_id", business.id)
    .order("last_visit", { ascending: false });

  const allCustomers = (customers ?? []) as (BusinessCustomer & {
    customer: {
      id: string;
      display_name: string;
      handle: string | null;
      avatar_url: string | null;
    } | null;
  })[];

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Customers</h1>
        <span className="text-xs text-txt-secondary">
          {allCustomers.length} customer{allCustomers.length !== 1 ? "s" : ""}
        </span>
      </div>

      {allCustomers.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No customers yet</p>
          <p className="text-xs text-txt-secondary">
            Customer profiles build automatically from orders and bookings
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {allCustomers.map((bc) => (
            <Card key={bc.id}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                  {bc.customer?.avatar_url ? (
                    <img
                      src={bc.customer.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {(bc.customer?.display_name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {bc.customer?.display_name || "Unknown"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-txt-secondary mt-0.5">
                    <span>{bc.total_orders} orders</span>
                    <span className="text-gold font-semibold">
                      {formatCents(bc.total_spent)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[10px] text-txt-secondary">Last visit</p>
                  <p className="text-xs">{formatDate(bc.last_visit)}</p>
                </div>
              </div>

              {bc.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {bc.tags.map((tag) => (
                    <Badge key={tag} label={tag} variant="purple" size="sm" />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
