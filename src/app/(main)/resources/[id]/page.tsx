import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import SaveButton from "@/components/ui/SaveButton";
import ApplyButton from "@/components/ui/ApplyButton";
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

const categoryLabels: Record<string, string> = {
  business: "Business",
  housing: "Housing",
  health: "Health",
  youth: "Youth",
  jobs: "Jobs",
  food: "Food",
  legal: "Legal",
  senior: "Senior",
  education: "Education",
  veterans: "Veterans",
  utilities: "Utilities",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  upcoming: "Coming Soon",
  limited: "Limited",
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "open":
      return "c-badge-ok";
    case "closed":
      return "c-badge-live";
    case "upcoming":
    case "limited":
    default:
      return "c-badge-gold";
  }
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let resource = null;
  if (!isUuid) {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("slug", id)
      .maybeSingle();
    resource = data;
  }
  if (!resource) {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    resource = data;
  }

  if (!resource) notFound();

  const res = resource as Resource;
  const icon = categoryIcons[res.category] ?? ("document" as IconName);
  const categoryName = categoryLabels[res.category] ?? res.category;

  const deadlineLabel = res.deadline
    ? new Date(res.deadline).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const spotsLeft =
    res.max_spots != null
      ? Math.max(0, res.max_spots - (res.filled_spots ?? 0))
      : null;

  return (
    <article className="culture-surface min-h-dvh animate-fade-in pb-24">
      {/* Header bar */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <Link
          href="/resources"
          className="c-kicker inline-flex items-center gap-1.5 press"
          style={{ color: "var(--ink-strong)" }}
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
          Back
        </Link>
        <SaveButton itemType="resource" itemId={res.id} />
      </div>

      {/* Hero image */}
      {res.image_url && (
        <div
          className="relative w-full aspect-[16/10] overflow-hidden"
          style={{ borderTop: "2px solid var(--rule-strong-c)", borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <Image
            src={res.image_url}
            alt={res.name}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Title block */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="c-kicker inline-flex items-center gap-1.5"
            style={{ color: "var(--ink-strong)", opacity: 0.7 }}
          >
            <Icon name={icon} size={11} style={{ color: "var(--ink-strong)" }} />
            § {categoryName.toUpperCase()}
          </span>
          <span className={`c-badge ${statusBadgeClass(res.status)}`} style={{ padding: "4px 8px", fontSize: 10 }}>
            {(statusLabel[res.status] ?? res.status).toUpperCase()}
          </span>
          {res.is_free && (
            <span className="c-badge c-badge-ok" style={{ padding: "4px 8px", fontSize: 10 }}>
              FREE
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

      {/* Deadline / Spots row */}
      {(deadlineLabel || spotsLeft != null) && (
        <section className="px-5 mt-5 grid grid-cols-2 gap-3">
          {deadlineLabel && (
            <div
              className="p-3 c-frame text-center"
              style={{ background: "var(--paper-warm)" }}
            >
              <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
                DEADLINE
              </p>
              <p className="c-card-t mt-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                {deadlineLabel}
              </p>
            </div>
          )}
          {spotsLeft != null && (
            <div
              className="p-3 c-frame text-center"
              style={{ background: "var(--paper-warm)" }}
            >
              <p className="c-kicker" style={{ fontSize: 9, opacity: 0.7 }}>
                SPOTS LEFT
              </p>
              <p className="c-card-t mt-1" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                {spotsLeft} of {res.max_spots}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Eligibility / Requirements */}
      {res.eligibility && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
            § REQUIREMENTS
          </p>
          <div className="c-frame p-4" style={{ background: "var(--paper-warm)" }}>
            <p className="c-body" style={{ color: "var(--ink-strong)" }}>
              {res.eligibility}
            </p>
          </div>
        </section>
      )}

      {/* Contact info */}
      {(res.address || res.phone || res.website || res.hours) && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
            § CONTACT
          </p>
          <div className="c-frame p-4 space-y-3" style={{ background: "var(--paper-warm)" }}>
            {res.address && (
              <div className="flex items-start gap-3">
                <Icon name="pin" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <p className="c-body" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                  {res.address}
                </p>
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
            {res.hours && (
              <div className="flex items-start gap-3">
                <Icon name="clock" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <p className="c-body" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
                  {res.hours}
                </p>
              </div>
            )}
            {res.website && (
              <div className="flex items-start gap-3">
                <Icon name="globe" size={16} style={{ color: "var(--ink-strong)", marginTop: 2 }} />
                <a
                  href={
                    res.website.startsWith("http")
                      ? res.website
                      : `https://${res.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="c-body truncate"
                  style={{ fontSize: 13, color: "var(--ink-strong)" }}
                >
                  {res.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tags */}
      {res.match_tags && res.match_tags.length > 0 && (
        <section className="px-5 mt-6">
          <p className="c-kicker mb-2" style={{ fontSize: 10, opacity: 0.7 }}>
            § TAGS
          </p>
          <div className="flex flex-wrap gap-1.5">
            {res.match_tags.map((tag) => (
              <span
                key={tag}
                className="c-meta px-2.5 py-1"
                style={{
                  fontSize: 11,
                  color: "var(--ink-strong)",
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Apply CTA */}
      <section className="px-5 mt-8">
        <ApplyButton
          resourceId={res.id}
          resourceName={res.name}
          resourceSlug={res.slug}
          acceptsApplications={res.accepts_applications}
          status={res.status}
          website={res.website}
          phone={res.phone}
        />
      </section>
    </article>
  );
}
