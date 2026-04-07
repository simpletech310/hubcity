import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
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

const statusStyles: Record<string, { variant: "emerald" | "coral" | "cyan" | "gold"; label: string }> = {
  open: { variant: "emerald", label: "Open" },
  closed: { variant: "coral", label: "Closed" },
  upcoming: { variant: "cyan", label: "Coming Soon" },
  limited: { variant: "gold", label: "Limited" },
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
  const icon = categoryIcons[res.category] ?? "document" as IconName;
  const status = statusStyles[res.status] ?? { variant: "cyan" as const, label: res.status };

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </Link>
      </div>

      <div className="px-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center shrink-0 border border-border-subtle">
            <Icon name={icon} size={28} className="text-white/70" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold mb-1 leading-tight">
              {res.name}
            </h1>
            {res.organization && (
              <p className="text-sm text-txt-secondary font-medium">
                {res.organization}
              </p>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge label={status.label} variant={status.variant} size="md" />
          <Badge label={res.category} variant="purple" size="md" />
          {res.is_free && <Badge label="Free" variant="emerald" size="md" />}
        </div>

        {/* Description */}
        <div className="mb-5">
          <h2 className="font-heading font-bold text-base mb-2">About</h2>
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            {res.description}
          </p>
        </div>

        {/* Eligibility */}
        {res.eligibility && (
          <Card variant="glass" glow className="mb-5 border-gold/15 bg-gradient-to-br from-gold/[0.05] to-transparent">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />
            <h3 className="font-heading font-bold text-sm mb-2 flex items-center gap-2">
              <Icon name="document" size={16} className="text-gold" /> Eligibility Requirements
            </h3>
            <p className="text-[13px] text-txt-secondary leading-relaxed">
              {res.eligibility}
            </p>
            {res.deadline && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-subtle">
                <Icon name="clock" size={16} className="text-gold" />
                <p className="text-sm text-gold font-bold">
                  Deadline: {new Date(res.deadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Contact Info */}
        <Card variant="glass" className="mb-5">
          <h3 className="font-heading font-bold text-sm mb-3">Contact Information</h3>
          <div className="space-y-3">
            {res.address && (
              <div className="flex items-center gap-3">
                <Icon name="pin" size={20} className="text-white/50 shrink-0" />
                <p className="text-sm">{res.address}</p>
              </div>
            )}
            {res.phone && (
              <div className="flex items-center gap-3">
                <Icon name="phone" size={20} className="text-white/50 shrink-0" />
                <a href={`tel:${res.phone}`} className="text-sm text-gold font-medium">
                  {res.phone}
                </a>
              </div>
            )}
            {res.website && (
              <div className="flex items-center gap-3">
                <Icon name="globe" size={20} className="text-white/50 shrink-0" />
                <a
                  href={res.website.startsWith("http") ? res.website : `https://${res.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gold font-medium"
                >
                  {res.website}
                </a>
              </div>
            )}
            {res.hours && (
              <div className="flex items-center gap-3">
                <Icon name="clock" size={20} className="text-white/50 shrink-0" />
                <p className="text-sm">{res.hours}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Match Tags */}
        {res.match_tags && res.match_tags.length > 0 && (
          <div className="mb-5">
            <h3 className="font-heading font-bold text-sm mb-2">Related Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {res.match_tags.map((tag) => (
                <Badge key={tag} label={tag} variant="purple" />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <ApplyButton
            resourceId={res.id}
            resourceName={res.name}
            status={res.status}
            website={res.website}
            phone={res.phone}
          />
          <SaveButton itemType="resource" itemId={res.id} />
        </div>
      </div>
    </div>
  );
}
