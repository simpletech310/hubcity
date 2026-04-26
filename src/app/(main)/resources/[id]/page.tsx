import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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

const statusVariant: Record<string, "emerald" | "coral" | "cyan" | "gold"> = {
  open: "emerald",
  closed: "coral",
  upcoming: "cyan",
  limited: "gold",
};

const statusLabel: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  upcoming: "Coming Soon",
  limited: "Limited",
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

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // UUIDs are 36 chars with hyphens. If it doesn't match, try slug first.
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
    <article className="min-h-dvh animate-fade-in pb-24">
      {/* Header bar */}
      <div className="px-4 pt-3 pb-3 flex items-center justify-between">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold press"
        >
          <svg
            width="16"
            height="16"
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
        <div className="relative w-full aspect-[16/10] mb-4 overflow-hidden">
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
      <div className="px-4">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-txt-secondary">
            <Icon name={icon} size={12} />
            {categoryName}
          </span>
          <Badge
            label={statusLabel[res.status] ?? res.status}
            variant={statusVariant[res.status] ?? "gold"}
            size="sm"
          />
          {res.is_free && <Badge label="Free" variant="emerald" size="sm" />}
        </div>

        <h1 className="text-2xl font-heading font-bold leading-tight">
          {res.name}
        </h1>
        {res.organization && (
          <p className="mt-1 text-sm text-txt-secondary">{res.organization}</p>
        )}
      </div>

      {/* Description */}
      {res.description && (
        <section className="px-4 mt-5">
          <p className="text-[15px] leading-relaxed text-white/90">
            {res.description}
          </p>
        </section>
      )}

      {/* Key facts row */}
      {(deadlineLabel || spotsLeft != null) && (
        <section className="px-4 mt-5 grid grid-cols-2 gap-3">
          {deadlineLabel && (
            <Card className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary">
                Deadline
              </p>
              <p className="mt-1 text-sm font-bold text-gold">{deadlineLabel}</p>
            </Card>
          )}
          {spotsLeft != null && (
            <Card className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary">
                Spots Left
              </p>
              <p className="mt-1 text-sm font-bold text-gold">
                {spotsLeft} of {res.max_spots}
              </p>
            </Card>
          )}
        </section>
      )}

      {/* Eligibility / Requirements */}
      {res.eligibility && (
        <section className="px-4 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-secondary mb-2">
            Requirements
          </h2>
          <Card>
            <p className="text-sm leading-relaxed text-white/90">
              {res.eligibility}
            </p>
          </Card>
        </section>
      )}

      {/* Contact info */}
      {(res.address || res.phone || res.website || res.hours) && (
        <section className="px-4 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-secondary mb-2">
            Contact
          </h2>
          <Card className="space-y-3">
            {res.address && (
              <div className="flex items-start gap-3">
                <Icon name="pin" size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-sm text-white/90">{res.address}</p>
              </div>
            )}
            {res.phone && (
              <div className="flex items-start gap-3">
                <Icon name="phone" size={16} className="text-gold mt-0.5 shrink-0" />
                <a
                  href={`tel:${res.phone}`}
                  className="text-sm text-gold font-medium"
                >
                  {res.phone}
                </a>
              </div>
            )}
            {res.hours && (
              <div className="flex items-start gap-3">
                <Icon name="clock" size={16} className="text-gold mt-0.5 shrink-0" />
                <p className="text-sm text-white/90">{res.hours}</p>
              </div>
            )}
            {res.website && (
              <div className="flex items-start gap-3">
                <Icon name="globe" size={16} className="text-gold mt-0.5 shrink-0" />
                <a
                  href={
                    res.website.startsWith("http")
                      ? res.website
                      : `https://${res.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gold truncate"
                >
                  {res.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Tags */}
      {res.match_tags && res.match_tags.length > 0 && (
        <section className="px-4 mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-txt-secondary mb-2">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {res.match_tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-white/80 border border-border-subtle"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Apply CTA */}
      <section className="px-4 mt-8">
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
