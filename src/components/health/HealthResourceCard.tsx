import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { HealthResource } from "@/types/database";

const categoryEmojis: Record<string, string> = {
  clinic: "🏥",
  hospital: "🏨",
  mental_health: "🧠",
  dental: "🦷",
  vision: "👁️",
  pharmacy: "💊",
  emergency: "🚑",
  substance_abuse: "💚",
  prenatal: "🤰",
  pediatric: "👶",
  senior_care: "🧓",
  insurance_help: "📋",
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

export default function HealthResourceCard({ resource }: HealthResourceCardProps) {
  return (
    <Link href={`/health/${resource.slug}`}>
      <Card hover>
        {/* Top row: icon, name, emergency indicator */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center text-lg shrink-0 border border-border-subtle">
              {categoryEmojis[resource.category] ?? "🏥"}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[13px] mb-0.5 line-clamp-1">
                {resource.name}
              </h3>
              {resource.organization && (
                <p className="text-[11px] text-txt-secondary font-medium">
                  {resource.organization}
                </p>
              )}
            </div>
          </div>
          {resource.is_emergency && (
            <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/20 rounded-full px-2.5 py-0.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-red-400 uppercase tracking-wide">
                Emergency
              </span>
            </div>
          )}
        </div>

        {/* Address */}
        {resource.address && (
          <p className="text-[11px] text-txt-secondary mb-2.5 line-clamp-1">
            📍 {resource.address}
          </p>
        )}

        {/* Badges */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              label={categoryLabels[resource.category] ?? resource.category}
              variant="purple"
            />
            {resource.is_free && <Badge label="Free" variant="emerald" />}
            {resource.accepts_medi_cal && (
              <Badge label="Medi-Cal" variant="cyan" />
            )}
            {resource.accepts_uninsured && (
              <Badge label="Uninsured OK" variant="gold" />
            )}
          </div>
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-txt-secondary shrink-0 ml-2"
            strokeLinecap="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>

        {/* Phone */}
        {resource.phone && (
          <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border-subtle">
            <span className="text-xs">📞</span>
            <p className="text-[11px] text-gold font-semibold">{resource.phone}</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
