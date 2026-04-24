import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import type { MenuItem } from "@/types/database";
import MenuAvailabilityToggle, { EightySixBadge } from "./MenuAvailabilityToggle";
import MenuItemDeleteButton from "./MenuItemDeleteButton";

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
    .select("id, category")
    .eq("owner_id", user.id)
    .single();

  if (!business) return null;

  const isRetail = business.category === "retail";
  const label = isRetail ? "Products" : "Menu";
  const itemLabel = isRetail ? "product" : "item";

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
        <h1 className="font-heading text-xl font-bold">{label}</h1>
        <span className="text-xs text-txt-secondary">
          {items.length} {itemLabel}{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No {itemLabel}s yet</p>
          <p className="text-xs text-txt-secondary mb-4">
            Add {itemLabel}s so customers can place orders
          </p>
          <Link
            href="/dashboard/menu/new"
            className="inline-flex px-4 py-2 bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold rounded-xl"
          >
            Add First {isRetail ? "Product" : "Item"}
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
                  <Card key={item.id} hover className={!item.is_available ? "opacity-60" : ""}>
                    <Link
                      href={`/dashboard/menu/${item.id}/edit`}
                      className="flex items-center gap-3"
                    >
                      {/* Thumbnail */}
                      {item.image_url ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-border-subtle flex items-center justify-center shrink-0">
                          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-secondary">
                            <path d="M2 14l4-4 3 3 4-5 3 3" strokeLinecap="round" strokeLinejoin="round" />
                            <rect x="1" y="1" width="16" height="16" rx="2" />
                          </svg>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!item.is_available ? "line-through text-txt-secondary" : ""}`}>
                            {item.name}
                          </p>
                          <EightySixBadge itemId={item.id} isAvailable={item.is_available} />
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

                      {/* Edit icon */}
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-secondary">
                          <path d="M8.5 2.5l3 3M1 10l7-7 3 3-7 7H1v-3z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </Link>

                    {/* Actions row below the link */}
                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border-subtle">
                      <MenuItemDeleteButton itemId={item.id} />
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
