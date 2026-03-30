import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/lib/cart";
import OrderView from "@/components/order/OrderView";
import type { Business, MenuItem } from "@/types/database";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try slug first, then id
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", id)
    .single();

  if (!business) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();
    business = data;
  }

  if (!business) notFound();

  const biz = business as Business;

  if (!biz.accepts_orders) {
    notFound();
  }

  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return (
    <CartProvider>
      <OrderView
        business={biz}
        menuItems={(menuItems as MenuItem[]) ?? []}
      />
    </CartProvider>
  );
}
