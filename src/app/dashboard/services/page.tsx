import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Service, TimeSlot } from "@/types/database";
import ServiceActions from "./ServiceActions";
import ScheduleEditor from "./ScheduleEditor";
import StaffManager from "./StaffManager";

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

  const { data: timeSlots } = await supabase
    .from("time_slots")
    .select("*")
    .eq("business_id", business.id)
    .order("day_of_week", { ascending: true });

  const allServices = (services ?? []) as Service[];
  const allTimeSlots = (timeSlots ?? []) as TimeSlot[];

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-bold">Services</h1>
          <span className="text-xs text-txt-secondary">
            {allServices.length} service{allServices.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allServices.length === 0 ? (
          <Card className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-hc-purple/10 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
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
              <div key={service.id}>
                <Card>
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
                        {(service.deposit_amount ?? 0) > 0 && (
                          <span className="text-[10px] text-emerald bg-emerald/10 px-1.5 py-0.5 rounded-full font-medium">
                            {formatCents(service.deposit_amount)} deposit
                          </span>
                        )}
                        {(service.lead_time_hours ?? 1) > 1 && (
                          <span className="text-[10px] text-txt-secondary">
                            {service.lead_time_hours}hr advance
                          </span>
                        )}
                      </div>
                    </div>
                    <ServiceActions service={service} businessId={business.id} />
                  </div>
                </Card>
                {/* Edit form renders below the card when active */}
              </div>
            ))}
          </div>
        )}

        <ServiceActions businessId={business.id} isAddButton />
      </div>

      {/* Team Section */}
      <div className="space-y-3">
        <div className="border-t border-border-subtle pt-5">
          <h2 className="font-heading text-lg font-bold">Team Members</h2>
          <p className="text-xs text-txt-secondary mt-0.5">
            Add your staff so customers know who provides each service
          </p>
        </div>
        <StaffManager businessId={business.id} services={allServices} />
      </div>

      {/* Schedule Section */}
      <div className="space-y-3">
        <div className="border-t border-border-subtle pt-5">
          <h2 className="font-heading text-lg font-bold">Business Hours & Availability</h2>
          <p className="text-xs text-txt-secondary mt-0.5">
            Set when customers can book appointments
          </p>
        </div>
        <ScheduleEditor businessId={business.id} initialSlots={allTimeSlots} />
      </div>
    </div>
  );
}
