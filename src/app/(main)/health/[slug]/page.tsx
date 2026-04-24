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
  EditorialCard,
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
          className="inline-flex items-center gap-1.5 text-gold text-[11px] font-bold uppercase tracking-editorial press"
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
          Back to Health
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
              <h1 className="font-display text-[38px] sm:text-[52px] leading-[0.95] tracking-tight text-ivory max-w-[26ch]">
                {res.name}
              </h1>
              <div className="mt-5 h-px w-16 bg-gold" />
              {res.organization && (
                <p className="mt-4 text-[11px] uppercase tracking-editorial-tight text-black/70">
                  {res.organization}
                </p>
              )}
            </div>
          </HeroBlock>
        </div>
      ) : (
        <section className="mx-5 mt-2 panel-editorial rounded-3xl border border-gold/20 px-6 py-10 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-gold/60 via-gold/25 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gold/10 border border-gold/25 flex items-center justify-center shrink-0">
              <Icon name={icon} size={40} className="text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-3">
                <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
                {res.is_emergency && <Tag tone="coral" size="xs">Emergency</Tag>}
                {res.is_free && <Tag tone="emerald" size="xs">Free</Tag>}
              </div>
              <h1 className="font-display text-[34px] sm:text-[42px] leading-[0.98] tracking-tight text-ivory">
                {res.name}
              </h1>
              <div className="mt-4 h-px w-14 bg-gold" />
              {res.organization && (
                <p className="mt-3 text-[11px] uppercase tracking-editorial-tight text-black/70">
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
        <span className="flex-1 h-px bg-gradient-to-r from-gold/40 via-gold/15 to-transparent" />
        <span
          className={
            "text-[10px] uppercase tracking-editorial-tight whitespace-nowrap " +
            (res.is_emergency ? "text-coral" : "text-emerald")
          }
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
          <div className="rule-hairline mb-5" />
          <p className="text-[14px] text-black/85 leading-relaxed first-letter:font-display first-letter:text-[52px] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-gold first-letter:leading-none">
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
        <div className="rule-hairline mb-5" />

        <EditorialCard variant="ink" border="gold" className="p-5">
          <div className="space-y-4">
            {res.phone && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon name="phone" size={18} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-editorial-tight text-black/55">Phone</p>
                  <a
                    href={`tel:${res.phone}`}
                    className="font-display text-[18px] text-gold leading-tight block mt-0.5"
                  >
                    {res.phone}
                  </a>
                </div>
              </div>
            )}

            {res.address && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon name="pin" size={18} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-editorial-tight text-black/55">Address</p>
                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-black/85 leading-snug block mt-0.5 hover:text-gold transition-colors"
                    >
                      {res.address}
                    </a>
                  ) : (
                    <p className="text-[14px] text-black/85 leading-snug mt-0.5">{res.address}</p>
                  )}
                </div>
              </div>
            )}

            {res.website && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon name="globe" size={18} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-editorial-tight text-black/55">Website</p>
                  <a
                    href={res.website.startsWith("http") ? res.website : `https://${res.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-gold font-medium truncate block mt-0.5"
                  >
                    {res.website}
                  </a>
                </div>
              </div>
            )}

            {hoursString && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon name="clock" size={18} className="text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] uppercase tracking-editorial-tight text-black/55">Hours</p>
                  <p className="text-[14px] text-black/85 leading-snug mt-0.5">{hoursString}</p>
                </div>
              </div>
            )}
          </div>
        </EditorialCard>
      </section>

      {/* ── № 03 · Languages ── */}
      {res.languages && res.languages.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={3} size="md" />
            <SectionKicker tone="muted">Languages</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />
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
              className="flex items-center justify-center gap-2 bg-gold text-midnight px-5 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-editorial-tight press hover:bg-gold-light transition-colors"
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
              Get Directions
            </a>
          )}
          {res.phone && (
            <a
              href={`tel:${res.phone}`}
              className="flex items-center justify-center gap-2 bg-transparent text-ivory px-5 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-editorial-tight press hover:bg-gold/5 transition-colors border border-gold/25"
            >
              <Icon name="phone" size={14} className="text-gold" /> Call Now
            </a>
          )}
        </div>
      </section>
    </article>
  );
}
