import Link from "next/link";
import type { HealthResource } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Tag from "@/components/ui/editorial/Tag";

const categoryIcons: Record<string, IconName> = {
  clinic: "stethoscope",
  hospital: "first-aid",
  mental_health: "brain",
  dental: "tooth",
  vision: "eye",
  pharmacy: "pill",
  emergency: "alert",
  substance_abuse: "shield",
  prenatal: "baby",
  pediatric: "baby",
  senior_care: "elder",
  insurance_help: "document",
};

const categoryLabels: Record<string, string> = {
  clinic: "Clinic",
  hospital: "Hospital",
  mental_health: "Mental Health",
  dental: "Dental",
  vision: "Vision",
  pharmacy: "Pharmacy",
  emergency: "Emergency",
  substance_abuse: "Substance Abuse",
  prenatal: "Prenatal",
  pediatric: "Pediatric",
  senior_care: "Senior Care",
  insurance_help: "Insurance Help",
};

interface HealthResourceCardProps {
  resource: HealthResource;
}

/**
 * Editorial listing card — ink panel, hairline gold border, DM Serif name,
 * compact meta tags. The whole card is the link; only the category icon on
 * the left breaks the grid to add a subtle gold ghost border.
 */
export default function HealthResourceCard({ resource }: HealthResourceCardProps) {
  const iconName = categoryIcons[resource.category] ?? "heart-pulse";

  return (
    <Link
      href={`/health/${resource.slug}`}
      className="group block relative rounded-2xl panel-editorial hover:border-gold/30 transition-colors press"
    >
      <div className="p-4">
        {/* Top row: icon + name + emergency dot */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl border border-gold/15 bg-ink flex items-center justify-center shrink-0">
            <Icon name={iconName} size={20} className="text-gold" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-[17px] leading-tight text-white group-hover:text-gold transition-colors line-clamp-1">
                {resource.name}
              </h3>
              {resource.is_emergency && (
                <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-editorial-tight text-coral bg-coral/10 border border-coral/30 rounded-full px-2 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-coral animate-pulse" />
                  911
                </span>
              )}
            </div>
            {resource.organization && (
              <p className="text-[11px] text-ivory/55 font-medium mt-0.5 line-clamp-1">
                {resource.organization}
              </p>
            )}
          </div>
        </div>

        {/* Meta chip row */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Tag tone="gold" size="xs">
            {categoryLabels[resource.category] ?? resource.category}
          </Tag>
          {resource.is_free && (
            <Tag tone="emerald" size="xs">Free</Tag>
          )}
          {resource.accepts_medi_cal && (
            <Tag tone="cyan" size="xs">Medi-Cal</Tag>
          )}
          {resource.accepts_uninsured && (
            <Tag tone="default" size="xs">Uninsured OK</Tag>
          )}
        </div>

        {/* Address */}
        {resource.address && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ivory/55">
            <Icon name="pin" size={12} className="text-gold/60 shrink-0" />
            <span className="line-clamp-1">{resource.address}</span>
          </div>
        )}

        {/* Divider + phone */}
        {resource.phone && (
          <>
            <div className="mt-3 rule-hairline" />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="phone" size={13} className="text-gold" />
                <span className="text-[12px] text-gold font-semibold tabular-nums">
                  {resource.phone}
                </span>
              </div>
              <Icon
                name="arrow-right-thin"
                size={14}
                className="text-gold/70 group-hover:text-gold transition-colors"
              />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
