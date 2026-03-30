import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Service } from "@/types/database";
import ServiceActions from "./ServiceActions";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardServicesPage() {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  const allServices = (services ?? []) as Service[];

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Services</h1>
        <span className="text-xs text-txt-secondary">
          {allServices.length} service{allServices.length !== 1 ? "s" : ""}
        </span>
      </div>

      {allServices.length === 0 ? (
        <Card className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-hc-purple/10 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-hc-purple">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">No services yet</p>
          <p className="text-xs text-txt-secondary">
            Add services so customers can book appointments
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {allServices.map((service) => (
            <Card key={service.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{service.name}</p>
                    {!service.is_available && (
                      <Badge label="Unavailable" variant="coral" size="sm" />
                    )}
                  </div>
                  {service.description && (
                    <p className="text-xs text-txt-secondary mt-0.5 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-semibold text-gold">
                      {formatCents(service.price)}
                    </span>
                    <span className="text-xs text-txt-secondary">
                      {service.duration} min
                    </span>
                  </div>
                </div>
                <ServiceActions serviceId={service.id} businessId={business.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Service Form Trigger */}
      <ServiceActions businessId={business.id} isAddButton />
    </div>
  );
}
