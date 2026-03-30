import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import ServiceCard from "@/components/city-hall/ServiceCard";
import { createClient } from "@/lib/supabase/server";
import type { Department, CityService } from "@/types/database";

const categoryEmojis: Record<string, string> = {
  administration: "🏛️",
  public_safety: "🛡️",
  public_works: "🚧",
  community: "🤝",
  finance: "💰",
  planning: "📐",
  parks: "🌳",
  utilities: "💡",
};

const categoryLabels: Record<string, string> = {
  administration: "Administration",
  public_safety: "Public Safety",
  public_works: "Public Works",
  community: "Community",
  finance: "Finance",
  planning: "Planning",
  parks: "Parks & Recreation",
  utilities: "Utilities",
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: department } = await supabase
    .from("city_departments")
    .select("*, services:city_services(*)")
    .eq("slug", slug)
    .single();

  if (!department) notFound();

  const dept = department as Department & { services: CityService[] };
  const emoji = categoryEmojis[dept.category] ?? "🏛️";
  const categoryLabel = categoryLabels[dept.category] ?? dept.category;
  const services = (dept.services ?? []).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/city-hall/departments"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Departments
        </Link>
      </div>

      <div className="px-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center shrink-0 border border-gold/15">
            <span className="text-2xl">{emoji}</span>
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold mb-1 leading-tight">
              {dept.name}
            </h1>
            {dept.head_name && (
              <p className="text-sm text-txt-secondary font-medium">
                {dept.head_name}
                {dept.head_title ? ` — ${dept.head_title}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Category badge */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge label={categoryLabel} variant="gold" size="md" />
        </div>

        {/* Description */}
        {dept.description && (
          <div className="mb-5">
            <h2 className="font-heading font-bold text-base mb-2">About</h2>
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              {dept.description}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <Card className="mb-5">
          <h3 className="font-heading font-bold text-sm mb-3">Contact Information</h3>
          <div className="space-y-3">
            {dept.address && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <p className="text-sm">{dept.address}</p>
              </div>
            )}
            {dept.phone && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <a href={`tel:${dept.phone}`} className="text-sm text-gold font-medium">
                  {dept.phone}
                </a>
              </div>
            )}
            {dept.email && (
              <div className="flex items-center gap-3">
                <span className="text-lg">✉️</span>
                <a href={`mailto:${dept.email}`} className="text-sm text-gold font-medium">
                  {dept.email}
                </a>
              </div>
            )}
            {dept.hours && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🕐</span>
                <p className="text-sm">{typeof dept.hours === 'string' ? dept.hours : JSON.stringify(dept.hours)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Services */}
        {services.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading font-bold text-base mb-3">
              Services ({services.length})
            </h2>
            <div className="space-y-2.5 stagger">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        )}

        {/* No services fallback */}
        {services.length === 0 && (
          <div className="text-center py-10 mb-6">
            <span className="text-4xl block mb-2">📋</span>
            <p className="text-sm text-txt-secondary">
              No services listed for this department yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
