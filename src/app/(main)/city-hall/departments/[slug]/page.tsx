import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import ServiceCard from "@/components/city-hall/ServiceCard";
import { createClient } from "@/lib/supabase/server";
import type { Department, CityService } from "@/types/database";

const categoryIcons: Record<string, IconName> = {
  administration: "landmark",
  public_safety: "shield",
  public_works: "wrench",
  community: "handshake",
  finance: "dollar",
  planning: "chart",
  parks: "tree",
  utilities: "lightbulb",
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
  const iconName = categoryIcons[dept.category] ?? "landmark";
  const categoryLabel = categoryLabels[dept.category] ?? dept.category;
  const services = (dept.services ?? []).filter((s) => s.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="culture-surface min-h-dvh animate-fade-in">
      {/* Back Button */}
      <div
        className="px-[18px] pt-5 pb-4"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <Link
          href="/city-hall/departments"
          className="inline-flex items-center gap-1.5 text-sm font-semibold press mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Departments
        </Link>
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ {categoryLabel.toUpperCase()}</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 44, lineHeight: 0.92 }}>{dept.name}</h1>
        {dept.head_name && (
          <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
            {dept.head_name}{dept.head_title ? ` — ${dept.head_title}` : ""}
          </p>
        )}
      </div>

      <div className="px-5 pt-5">
        {/* Header placeholder removed — moved to hero */}
        <div className="sr-only">
          <Icon name={iconName} size={24} />
        </div>

        {/* Category badge */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge label={categoryLabel} variant="gold" size="md" />
        </div>

        {/* Description */}
        {dept.description && (
          <div className="mb-5">
            <h2 className="c-card-t mb-2">About</h2>
            <p className="c-body text-[13px] leading-relaxed">
              {dept.description}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <Card variant="glass-elevated" className="mb-5">
          <h3 className="c-card-t mb-3">Contact Information</h3>
          <div className="space-y-3">
            {dept.address && (
              <div className="flex items-center gap-3">
                <Icon name="pin" size={18} />
                <p className="text-sm" style={{ color: "var(--ink-strong)" }}>{dept.address}</p>
              </div>
            )}
            {dept.phone && (
              <div className="flex items-center gap-3">
                <Icon name="phone" size={18} />
                <a href={`tel:${dept.phone}`} className="text-sm font-medium" style={{ color: "var(--gold-c)" }}>
                  {dept.phone}
                </a>
              </div>
            )}
            {dept.email && (
              <div className="flex items-center gap-3">
                <Icon name="mail" size={18} />
                <a href={`mailto:${dept.email}`} className="text-sm font-medium" style={{ color: "var(--gold-c)" }}>
                  {dept.email}
                </a>
              </div>
            )}
            {dept.hours && (
              <div className="flex items-center gap-3">
                <Icon name="clock" size={18} />
                <p className="text-sm" style={{ color: "var(--ink-strong)" }}>{typeof dept.hours === 'string' ? dept.hours : JSON.stringify(dept.hours)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Services */}
        {services.length > 0 && (
          <div className="mb-6">
            <h2 className="c-card-t mb-3">
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
            <span className="block mb-2"><Icon name="document" size={36} /></span>
            <p className="text-sm text-txt-secondary">
              No services listed for this department yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
