import { notFound } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import ApplyButton from "@/components/ui/ApplyButton";
import PullQuote from "@/components/ui/PullQuote";
import {
  HeroBlock,
  EditorialNumber,
  SectionKicker,
  EditorialCard,
  Tag,
  IssueDivider,
} from "@/components/ui/editorial";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/types/database";

const categoryIcons: Record<string, IconName> = {
  business: "briefcase",
  housing: "house",
  health: "heart-pulse",
  youth: "baby",
  jobs: "briefcase",
  food: "apple",
  legal: "gavel",
  senior: "elder",
  education: "education",
  veterans: "veteran",
  utilities: "lightbulb",
};

type StatusTone = "emerald" | "coral" | "cyan" | "gold";
const statusMeta: Record<
  string,
  { tone: StatusTone; label: string; upper: string }
> = {
  open: { tone: "emerald", label: "Open", upper: "OPEN" },
  closed: { tone: "coral", label: "Closed", upper: "CLOSED" },
  upcoming: { tone: "cyan", label: "Coming Soon", upper: "COMING SOON" },
  limited: { tone: "gold", label: "Limited", upper: "LIMITED SPOTS" },
};

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: resource } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (!resource) notFound();

  const res = resource as Resource;
  const icon = categoryIcons[res.category] ?? ("document" as IconName);
  const status = statusMeta[res.status] ?? {
    tone: "cyan" as StatusTone,
    label: res.status,
    upper: String(res.status).toUpperCase(),
  };

  const categoryLabel = res.category.toUpperCase();
  const city = "Compton";

  const firstSentence =
    res.description?.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";

  const deadlineLabel = res.deadline
    ? new Date(res.deadline).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="animate-fade-in pb-safe bg-midnight">
      {/* Back link */}
      <div className="px-5 pt-4 mb-3 flex items-center justify-between">
        <Link
          href="/resources"
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
          Back to Support
        </Link>
        <SaveButton itemType="resource" itemId={res.id} />
      </div>

      {/* ── Cover ── */}
      {res.image_url ? (
        <div className="relative">
          <HeroBlock image={res.image_url} aspect="3/2" alt={res.name}>
            <div className="absolute inset-x-0 bottom-0 px-6 pb-7 z-10">
              <div className="flex items-center gap-2 mb-3">
                <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
                <Tag tone={status.tone} size="sm">{status.label}</Tag>
                {res.is_free && <Tag tone="emerald" size="sm">Free</Tag>}
              </div>
              <h1 className="font-display text-[38px] sm:text-[52px] leading-[0.95] tracking-tight text-ivory max-w-[26ch]">
                {res.name}
              </h1>
              <div className="mt-5 h-px w-16 bg-gold" />
              {res.organization && (
                <p className="mt-4 text-[11px] uppercase tracking-editorial-tight text-ivory/70">
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
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <SectionKicker tone="gold">{categoryLabel}</SectionKicker>
                <Tag tone={status.tone} size="xs">{status.label}</Tag>
                {res.is_free && <Tag tone="emerald" size="xs">Free</Tag>}
              </div>
              <h1 className="font-display text-[34px] sm:text-[42px] leading-[0.98] tracking-tight text-ivory">
                {res.name}
              </h1>
              <div className="mt-4 h-px w-14 bg-gold" />
              {res.organization && (
                <p className="mt-3 text-[11px] uppercase tracking-editorial-tight text-ivory/70">
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
            (status.tone === "emerald"
              ? "text-emerald"
              : status.tone === "coral"
              ? "text-coral"
              : status.tone === "gold"
              ? "text-gold"
              : "text-cyan")
          }
        >
          {status.upper}
        </span>
      </div>

      {/* ── Pull Quote ── */}
      {firstSentence && (
        <section className="px-5 mt-8 max-w-[68ch]">
          <PullQuote
            quote={firstSentence}
            attribution={res.organization ?? categoryLabel}
            size="md"
          />
        </section>
      )}

      {/* ── № 01 · About ── */}
      {res.description && (
        <section className="px-5 mt-10 max-w-[68ch]">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={1} size="md" />
            <SectionKicker tone="muted">About</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />
          <p className="text-[14px] text-ivory/85 leading-relaxed first-letter:font-display first-letter:text-[52px] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-gold first-letter:leading-none">
            {res.description}
          </p>
        </section>
      )}

      {/* ── № 02 · Eligibility ── */}
      {res.eligibility && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={2} size="md" />
            <SectionKicker tone="muted">Eligibility</SectionKicker>
            {deadlineLabel && (
              <Tag tone="gold" size="xs" className="ml-auto">
                Deadline
              </Tag>
            )}
          </div>
          <div className="rule-hairline mb-5" />

          <EditorialCard variant="ink" border="gold" className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Icon name="document" size={18} className="text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                  Requirements
                </p>
                <p className="text-[14px] text-ivory/85 leading-relaxed mt-1.5">
                  {res.eligibility}
                </p>
              </div>
            </div>

            {deadlineLabel && (
              <div className="flex items-center gap-3 pt-4 mt-1 border-t border-gold/15">
                <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon name="clock" size={18} className="text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                    Deadline
                  </p>
                  <p className="font-display text-[18px] text-gold leading-tight mt-0.5">
                    {deadlineLabel}
                  </p>
                </div>
              </div>
            )}
          </EditorialCard>
        </section>
      )}

      {/* ── № 03 · Contact ── */}
      {(res.address || res.phone || res.website || res.hours) && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={3} size="md" />
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
                    <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                      Phone
                    </p>
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
                    <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                      Address
                    </p>
                    <p className="text-[14px] text-ivory/85 leading-snug mt-0.5">
                      {res.address}
                    </p>
                  </div>
                </div>
              )}

              {res.website && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Icon name="globe" size={18} className="text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                      Website
                    </p>
                    <a
                      href={
                        res.website.startsWith("http")
                          ? res.website
                          : `https://${res.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[14px] text-gold font-medium truncate block mt-0.5"
                    >
                      {res.website}
                    </a>
                  </div>
                </div>
              )}

              {res.hours && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                    <Icon name="clock" size={18} className="text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] uppercase tracking-editorial-tight text-ivory/55">
                      Hours
                    </p>
                    <p className="text-[14px] text-ivory/85 leading-snug mt-0.5">
                      {res.hours}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </EditorialCard>
        </section>
      )}

      {/* ── № 04 · Tags ── */}
      {res.match_tags && res.match_tags.length > 0 && (
        <section className="px-5 mt-10">
          <div className="mb-4 flex items-baseline gap-3">
            <EditorialNumber n={4} size="md" />
            <SectionKicker tone="muted">Related</SectionKicker>
          </div>
          <div className="rule-hairline mb-5" />
          <div className="flex flex-wrap gap-2">
            {res.match_tags.map((tag) => (
              <Tag key={tag} tone="default" size="sm">
                {tag}
              </Tag>
            ))}
          </div>
        </section>
      )}

      <IssueDivider label="APPLY" className="mt-12" />

      {/* ── CTA Footer ── */}
      <section className="px-5 pb-10">
        <div className="flex gap-3">
          <ApplyButton
            resourceId={res.id}
            resourceName={res.name}
            status={res.status}
            website={res.website}
            phone={res.phone}
          />
        </div>
      </section>
    </article>
  );
}
