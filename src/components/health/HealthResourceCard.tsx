import Link from "next/link";
import type { HealthResource } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

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
 * Editorial listing card — paper surface, 2px ink frame, DM-serif name,
 * gold/ink badges. Phone row separated by a 2px ink rule.
 */
export default function HealthResourceCard({ resource }: HealthResourceCardProps) {
  const iconName = categoryIcons[resource.category] ?? "heart-pulse";

  return (
    <Link
      href={`/health/${resource.slug}`}
      className="group block relative press"
      style={{
        background: "var(--paper)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <div className="p-4">
        {/* Top row: icon + name + emergency badge */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 flex items-center justify-center shrink-0"
            style={{
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <Icon name={iconName} size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="c-card-t line-clamp-1"
                style={{ fontSize: 15 }}
              >
                {resource.name}
              </h3>
              {resource.is_emergency && (
                <span
                  className="c-badge-live shrink-0 inline-flex items-center gap-1"
                  style={{ fontSize: 9, letterSpacing: "0.12em", padding: "2px 6px" }}
                >
                  <span
                    className="rounded-full animate-pulse"
                    style={{ width: 4, height: 4, background: "#fff" }}
                  />
                  911
                </span>
              )}
            </div>
            {resource.organization && (
              <p className="c-meta mt-0.5 line-clamp-1" style={{ fontSize: 11 }}>
                {resource.organization}
              </p>
            )}
          </div>
        </div>

        {/* Meta chip row */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span
            className="c-badge-gold c-kicker"
            style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}
          >
            {categoryLabels[resource.category] ?? resource.category}
          </span>
          {resource.is_free && (
            <span
              className="c-badge-ok c-kicker"
              style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}
            >
              FREE
            </span>
          )}
          {resource.accepts_medi_cal && (
            <span
              className="c-badge-ink c-kicker"
              style={{ fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em" }}
            >
              MEDI-CAL
            </span>
          )}
          {resource.accepts_uninsured && (
            <span
              className="c-kicker"
              style={{
                fontSize: 9,
                padding: "3px 8px",
                letterSpacing: "0.12em",
                background: "transparent",
                color: "var(--ink-strong)",
                border: "1.5px solid var(--rule-strong-c)",
              }}
            >
              UNINSURED OK
            </span>
          )}
        </div>

        {/* Address */}
        {resource.address && (
          <div
            className="mt-3 flex items-center gap-1.5"
            style={{ fontSize: 11, color: "var(--ink-strong)", opacity: 0.75 }}
          >
            <Icon name="pin" size={12} style={{ color: "var(--gold-c)" }} />
            <span className="line-clamp-1">{resource.address}</span>
          </div>
        )}

        {/* Divider + phone */}
        {resource.phone && (
          <>
            <div
              className="mt-3"
              style={{ borderTop: "2px solid var(--rule-strong-c)" }}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="phone" size={13} style={{ color: "var(--gold-c)" }} />
                <span
                  className="c-card-t tabular-nums"
                  style={{ fontSize: 12, color: "var(--ink-strong)" }}
                >
                  {resource.phone}
                </span>
              </div>
              <Icon
                name="arrow-right-thin"
                size={14}
                style={{ color: "var(--ink-strong)" }}
              />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
