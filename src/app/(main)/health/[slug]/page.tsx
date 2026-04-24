import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { HealthResource } from "@/types/database";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import PullQuote from "@/components/ui/PullQuote";
import {
  HeroBlock,
  EditorialNumber,
  SectionKicker,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";

const categoryIcons: Record<string, IconName> = {
  clinic: "heart-pulse",
  hospital: "building",
  mental_health: "lightbulb",
  dental: "heart-pulse",
  vision: "eye",
  pharmacy: "heart-pulse",
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
    .single();

  if (!resource) notFound();

  const res = resource as HealthResource;
  const icon = categoryIcons[res.category] ?? "heart-pulse";
  const categoryLabel = (categoryLabels[res.category] ?? res.category).toUpperCase();

  const mapsUrl = res.address
    ? `https://maps.google.com/?q=${encodeURIComponent(res.address)}`
    : null;

  const city = "Compton";
  const statusLabel = res.is_emergency ? "EMERGENCY" : "OPEN";
  const hoursString =
    typeof res.hours === "string"
      ? res.hours
      : res.hours
      ? Object.entries(res.hours)
          .map(([day, val]) => `${day}: ${val}`)
          .join(" · ")
      : null;

  // First sentence of description for the pull quote
  const firstSentence =
    res.description?.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";

  return (
    <article className="culture-surface min-h-dvh animate-fade-in pb-safe">
      {/* Back link */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/health"
          className="c-kicker inline-flex items-center gap-1.5 press"
          style={{ fontSize: 11, color: "var(--ink-strong)", letterSpacing: "0.14em" }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
          BACK TO HEALTH
        </Link>
      </div>

      {/* ── Cover ── */}
      {res.image_url ? (
        <div className="relative">
          <HeroBlock image={res.image_url} aspect="3/2" alt={res.name}>
            <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
              <div className="flex items-center gap-2 mb-3">
                <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
                {res.is_emergency && (
                  <Tag tone="coral" size="sm">Emergency</Tag>
                )}
                {res.is_free && <Tag tone="emerald" size="sm">Free</Tag>}
              </div>
              <h1
                className="c-hero max-w-[26ch]"
                style={{ fontSize: 48, lineHeight: 0.92, letterSpacing: "-0.02em", color: "var(--paper)" }}
              >
                {res.name}
              </h1>
              <div className="mt-5 h-[3px] w-16" style={{ background: "var(--gold-c)" }} />
              {res.organization && (
                <p
                  className="c-kicker mt-4"
                  style={{ fontSize: 11, color: "var(--paper)", opacity: 0.75, letterSpacing: "0.14em" }}
                >
                  {res.organization}
                </p>
              )}
            </div>
          </HeroBlock>
        </div>
      ) : (
        <section
          className="mx-5 mt-2 px-6 py-10 relative overflow-hidden"
          style={{
            background: "var(--ink-strong)",
            border: "3px solid var(--rule-strong-c)",
          }}
        >
          {/* Gold foil bar top */}
          <div className="absolute inset-x-0 top-0" style={{ height: 4, background: "var(--gold-c)" }} />
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 flex items-center justify-center shrink-0"
              style={{
                background: "var(--gold-c)",
                color: "var(--ink-strong)",
                border: "3px solid var(--paper)",
              }}
            >
              <Icon name={icon} size={40} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
                {res.is_emergency && <Tag tone="coral" size="xs">Emergency</Tag>}
                {res.is_free && <Tag tone="emerald" size="xs">Free</Tag>}
              </div>
              <h1
                className="c-hero"
                style={{ fontSize: 40, lineHeight: 0.96, letterSpacing: "-0.02em", color: "var(--paper)" }}
              >
                {res.name}
              </h1>
              <div className="mt-4 h-[3px] w-14" style={{ background: "var(--gold-c)" }} />
              {res.organization && (
                <p
                  className="c-kicker mt-3"
                  style={{ fontSize: 11, color: "var(--paper)", opacity: 0.75, letterSpacing: "0.14em" }}
                >
                  {res.organization}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Byline Strip ── */}
      <div className="px-5 mt-6 flex items-baseline gap-4">
        <EditorialNumber n={1} size="sm" />
        <SectionKicker tone="gold">
          {categoryLabel} · {city.toUpperCase()}
        </SectionKicker>
        <span
          className="flex-1 self-center"
          style={{ borderTop: "2px solid var(--rule-strong-c)" }}
        />
        <span
          className="c-kicker whitespace-nowrap"
          style={{
            fontSize: 10,
            letterSpacing: "0.14em",
            color: res.is_emergency ? "#E03C3C" : "var(--ink-strong)",
            fontWeight: 700,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── Pull Quote — tagline / first sentence ── */}
      {firstSentence && (
        <section className="px-5 mt-8 max-w-[68ch]">
          <PullQuote quote={firstSentence} attribution={res.organization ?? categoryLabels[res.category] ?? undefined} size="md" />
        </section>
      )}

      {/* Top-level meta chips — Medi-Cal, Uninsured */}
      {(res.accepts_medi_cal || res.accepts_uninsured) && (
        <div className="px-5 mt-6 flex flex-wrap gap-2">
          {res.accepts_medi_cal && <Tag tone="cyan" size="sm">Accepts Medi-Cal</Tag>}
          {res.accepts_uninsured && <Tag tone="gold" size="sm">Accepts Uninsured</Tag>}
        </div>
      )}

      {/* ── № 01 · About ── */}
      {res.description && (
        <section className="px-5 mt-10 max-w-[68ch]">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={1} size="md" />
            <SectionKicker tone="muted">About</SectionKicker>
          </div>
          <div style={{ borderTop: "2px solid var(--rule-strong-c)" }} className="mb-5" />
          <p
            className="c-body first-letter:font-display first-letter:text-[52px] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:leading-none"
            style={{ fontSize: 14, color: "var(--ink-strong)" }}
          >
            {res.description}
          </p>
        </section>
      )}

      {/* ── № 02 · Contact ── */}
      <section className="px-5 mt-10">
        <div className="mb-4 flex items-baseline gap-3">
          <EditorialNumber n={2} size="md" />
          <SectionKicker tone="muted">Contact</SectionKicker>
        </div>
        <div style={{ borderTop: "2px solid var(--rule-strong-c)" }} className="mb-5" />

        <div
          className="p-5 relative overflow-hidden"
          style={{
            background: "var(--ink-strong)",
            border: "3px solid var(--rule-strong-c)",
          }}
        >
          <div style={{ height: 4, background: "var(--gold-c)", marginTop: -20, marginLeft: -20, marginRight: -20, marginBottom: 20 }} />
          <div className="space-y-4">
            {res.phone && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--paper)",
                  }}
                >
                  <Icon name="phone" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6, letterSpacing: "0.14em" }}
                  >
                    PHONE
                  </p>
                  <a
                    href={`tel:${res.phone}`}
                    className="c-card-t block mt-0.5"
                    style={{ fontSize: 18, color: "var(--gold-c)" }}
                  >
                    {res.phone}
                  </a>
                </div>
              </div>
            )}

            {res.address && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--paper)",
                  }}
                >
                  <Icon name="pin" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6, letterSpacing: "0.14em" }}
                  >
                    ADDRESS
                  </p>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-0.5"
                      style={{ fontSize: 14, color: "var(--paper)", opacity: 0.9 }}
                    >
                      {res.address}
                    </a>
                  ) : (
                    <p className="mt-0.5" style={{ fontSize: 14, color: "var(--paper)", opacity: 0.9 }}>{res.address}</p>
                  )}
                </div>
              </div>
            )}

            {res.website && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--paper)",
                  }}
                >
                  <Icon name="globe" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6, letterSpacing: "0.14em" }}
                  >
                    WEBSITE
                  </p>
                  <a
                    href={res.website.startsWith("http") ? res.website : `https://${res.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate block mt-0.5"
                    style={{ fontSize: 14, color: "var(--gold-c)", fontWeight: 500 }}
                  >
                    {res.website}
                  </a>
                </div>
              </div>
            )}

            {hoursString && (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--gold-c)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--paper)",
                  }}
                >
                  <Icon name="clock" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className="c-kicker"
                    style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6, letterSpacing: "0.14em" }}
                  >
                    HOURS
                  </p>
                  <p className="mt-0.5" style={{ fontSize: 14, color: "var(--paper)", opacity: 0.9 }}>{hoursString}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── № 03 · Languages ── */}
      {res.languages && res.languages.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={3} size="md" />
            <SectionKicker tone="muted">Languages</SectionKicker>
          </div>
          <div style={{ borderTop: "2px solid var(--rule-strong-c)" }} className="mb-5" />
          <div className="flex flex-wrap gap-2">
            {res.languages.map((lang) => (
              <Tag key={lang} tone="default" size="sm">
                {lang}
              </Tag>
            ))}
          </div>
        </section>
      )}

      <IssueDivider label="VISIT" className="mt-12" />

      {/* ── CTA Footer ── */}
      <section className="px-5 pb-10">
        <div className="flex flex-col gap-3">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="c-btn c-btn-primary w-full press flex items-center justify-center gap-2"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 1L9 17" />
                <path d="M1 6s2-3 8-3 8 3 8 3" />
                <circle cx="9" cy="9" r="3" />
              </svg>
              GET DIRECTIONS
            </a>
          )}
          {res.phone && (
            <a
              href={`tel:${res.phone}`}
              className="c-btn c-btn-outline w-full press flex items-center justify-center gap-2"
            >
              <Icon name="phone" size={14} /> CALL NOW
            </a>
          )}
        </div>
      </section>
    </article>
  );
}
