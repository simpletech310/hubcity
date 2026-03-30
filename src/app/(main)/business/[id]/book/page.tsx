import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookingView from "@/components/booking/BookingView";
import type { Business, Service } from "@/types/database";

export default async function BookingPage({
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

  if (!biz.accepts_bookings) {
    notFound();
  }

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", biz.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return (
    <BookingView
      business={biz}
      services={(services as Service[]) ?? []}
    />
  );
}
