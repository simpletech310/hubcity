import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartProvider } from "@/lib/cart";
import OrderView from "@/components/order/OrderView";
import type { Business, MenuItem, VendorVehicle } from "@/types/database";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pickup_vehicle?: string }>;
}) {
  const { id } = await params;
  const { pickup_vehicle } = await searchParams;
  const supabase = await createClient();

  // Resolve business by slug first, then id
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

  // Fetch menu + fleet in parallel
  const [{ data: menuItems }, { data: rawVehicles }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", biz.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
    biz.is_mobile_vendor
      ? supabase
          .from("vendor_vehicles")
          .select("*")
          .eq("business_id", biz.id)
          .eq("is_active", true)
          .order("created_at")
      : Promise.resolve({ data: [] as VendorVehicle[] }),
  ]);

  const vehicles = (rawVehicles as VendorVehicle[]) ?? [];
  const preselectedVehicleId = pickup_vehicle ?? null;

  return (
    <CartProvider>
      <OrderView
        business={biz}
        menuItems={(menuItems as MenuItem[]) ?? []}
        vehicles={vehicles}
        preselectedVehicleId={preselectedVehicleId}
      />
    </CartProvider>
  );
}
