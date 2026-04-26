import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { HealthResource } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const categoryIcons: Record<string, IconName> = {
  clinic: "heart-pulse",
  hospital: "building",
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

export default async function HealthResourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("health_resources")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!resource) notFound();

  const res = resource as HealthResource;
  const icon = (categoryIcons[res.category] ?? "heart-pulse") as IconName;
  const categoryLabel = categoryLabels[res.category] ?? res.category;

  const mapsUrl = res.address
    ? `https://maps.google.com/?q=${encodeURIComponent(res.address)}`
    : null;

  const hoursString =
    typeof res.hours === "string"
      ? res.hours
      : res.hours
      ? Object.entries(res.hours)
          .map(([day, val]) => `${day}: ${val}`)
          .join(" · ")
      : null;

  const websiteHref = res.website
    ? res.website.startsWith("http")
      ? res.website
      : `https://${res.website}`
    : null;

  return (
    <article className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Hero with overlaid back */}
      {res.image_url ? (
        <div
          className="relative w-full aspect-[16/10] overflow-hidden"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <Image
            src={res.image_url}
            alt={res.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 px-4 pt-4 z-10">
            <Link
              href="/health"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] press"
              style={{
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M10 12L6 8l4-4" />
              </svg>
              Back
            </Link>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-4 pb-3">
          <Link
            href="/health"
            className="c-kicker inline-flex items-center gap-1.5 press"
            style={{ color: "var(--ink-strong)" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back to Health
          </Link>
        </div>
      )}

      {/* Title block */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="c-kicker inline-flex items-center gap-1.5" style={{ color: "var(--ink-strong)", opacity: 0.7 }}>
            <Icon name={icon} size={11} style={{ color: "var(--ink-strong)" }} />
            § {categoryLabel.toUpperCase()}
          </span>
          {res.is_emergency && (
            <span className="c-badge c-badge-live" style={{ padding: "3px 7px", fontSize: 9 }}>
              EMERGENCY
            </span>
          )}
          {res.is_free && (
            <span className="c-badge c-badge-ok" style={{ padding: "3px 7px", fontSize: 9 }}>
              FREE
            </span>
          )}
          {res.accepts_medi_cal && (
            <span className="c-badge c-badge-gold" style={{ padding: "3px 7px", fontSize: 9 }}>
              MEDI-CAL
            </span>
          )}
          {res.accepts_uninsured && (
            <span className="c-badge c-badge-gold" style={{ padding: "3px 7px", fontSize: 9 }}>
              UNINSURED OK
            </span>
          )}
        </div>

        <h1 className="c-hero" style={{ fontSize: 32, lineHeight: 1.02, color: "var(--ink-strong)" }}>
          {res.name}
        </h1>
        {res.organization && (
          <p className="c-meta mt-2" style={{ fontSize: 12 }}>
            {res.organization}
          </p>
        )}
      </div>

      {/* Description */}
      {res.description && (
        <section className="px-5 mt-5">
          <p className="c-body" style={{ color: "var(--ink-strong)" }}>
            {res.description}
          </p>
        </section>
      )}

      {/* Contact card */}
      {(res.address || res.phone || res.website || hoursString) && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ CONTACT</p>
          <div className="c-frame p-4 space-y-3" style={{ background: "var(--paper-warm)" }}>
            {res.address && (
              <div className="flex items-start gap-3">
                <Icon name="pin" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <div className="min-w-0 flex-1">
                  <p className="c-body" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{res.address}</p>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="c-kicker inline-block mt-1"
                      style={{ fontSize: 9, color: "var(--ink-strong)" }}
                    >
                      Open in Maps →
                    </a>
                  )}
                </div>
              </div>
            )}
            {res.phone && (
              <div className="flex items-start gap-3">
                <Icon name="phone" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <a
                  href={`tel:${res.phone}`}
                  className="c-body font-semibold"
                  style={{ fontSize: 13, color: "var(--ink-strong)" }}
                >
                  {res.phone}
                </a>
              </div>
            )}
            {hoursString && (
              <div className="flex items-start gap-3">
                <Icon name="clock" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <p className="c-body" style={{ fontSize: 13, color: "var(--ink-strong)" }}>{hoursString}</p>
              </div>
            )}
            {websiteHref && (
              <div className="flex items-start gap-3">
                <Icon name="globe" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-body truncate"
                  style={{ fontSize: 13, color: "var(--ink-strong)" }}
                >
                  {res.website?.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Languages */}
      {res.languages && res.languages.length > 0 && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>§ LANGUAGES</p>
          <div className="flex flex-wrap gap-1.5">
            {res.languages.map((lang) => (
              <span
                key={lang}
                className="c-meta px-2.5 py-1"
                style={{
                  fontSize: 11,
                  color: "var(--ink-strong)",
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Quick CTAs */}
      <section className="px-5 mt-8 grid grid-cols-1 gap-2.5">
        {res.phone && (
          <a href={`tel:${res.phone}`} className="c-btn c-btn-primary press text-center">
            CALL {res.phone}
          </a>
        )}
        {websiteHref && (
          <a href={websiteHref} target="_blank" rel="noopener noreferrer" className="c-btn c-btn-outline press text-center">
            VISIT WEBSITE
          </a>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="c-btn c-btn-outline press text-center">
            GET DIRECTIONS
          </a>
        )}
      </section>
    </article>
  );
}
