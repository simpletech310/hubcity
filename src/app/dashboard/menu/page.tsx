import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { MenuItem } from "@/types/database";
import MenuAvailabilityToggle from "./MenuAvailabilityToggle";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardMenuPage() {
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

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", business.id)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  const items = (menuItems ?? []) as MenuItem[];

  // Group by category
  const grouped: Record<string, MenuItem[]> = {};
  items.forEach((item) => {
    const cat = item.category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  const categories = Object.keys(grouped);

  return (
    <div className="px-4 py-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Menu</h1>
        <span className="text-xs text-txt-secondary">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No menu items yet</p>
          <p className="text-xs text-txt-secondary mb-4">
            Add items so customers can place orders
          </p>
          <Link
            href="/dashboard/menu/new"
            className="inline-flex px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold rounded-xl"
          >
            Add First Item
          </Link>
        </Card>
      ) : (
        <div className="space-y-5">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
                {category}
              </h2>
              <div className="space-y-2">
                {grouped[category].map((item) => (
                  <Card key={item.id} hover>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {item.name}
                          </p>
                          {!item.is_available && (
                            <Badge label="Unavailable" variant="coral" size="sm" />
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-txt-secondary mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gold mt-1">
                          {formatCents(item.price)}
                        </p>
                      </div>
                      <MenuAvailabilityToggle
                        itemId={item.id}
                        isAvailable={item.is_available}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      {items.length > 0 && (
        <Link
          href="/dashboard/menu/new"
          className="fixed bottom-24 right-1/2 translate-x-[calc(215px-2rem)] w-14 h-14 bg-gradient-to-r from-gold to-gold-light rounded-full flex items-center justify-center shadow-lg shadow-gold/25 z-40"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="text-midnight">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </Link>
      )}
    </div>
  );
}
