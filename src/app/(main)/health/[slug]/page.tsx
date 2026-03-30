import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/server";
import type { HealthResource, HealthCategory } from "@/types/database";

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
  const icon = categoryEmojis[res.category] ?? "🏥";
  const categoryLabel = categoryLabels[res.category] ?? res.category;

  const mapsUrl = res.address
    ? `https://maps.google.com/?q=${encodeURIComponent(res.address)}`
    : null;

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <div className="px-5 pt-4 mb-3">
        <Link
          href="/health"
          className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold press"
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
      </div>

      <div className="px-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] flex items-center justify-center shrink-0 border border-border-subtle">
            <span className="text-2xl">{icon}</span>
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

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Badge label={categoryLabel} variant="purple" size="md" />
          {res.is_emergency && (
            <span className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/20 rounded-full px-3 py-1 text-[10px] font-semibold text-red-400 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Emergency
            </span>
          )}
          {res.is_free && <Badge label="Free" variant="emerald" size="md" />}
          {res.accepts_medi_cal && <Badge label="Accepts Medi-Cal" variant="cyan" size="md" />}
          {res.accepts_uninsured && <Badge label="Accepts Uninsured" variant="gold" size="md" />}
        </div>

        {/* Description */}
        <div className="mb-5">
          <h2 className="font-heading font-bold text-base mb-2">About</h2>
          <p className="text-[13px] text-txt-secondary leading-relaxed">
            {res.description}
          </p>
        </div>

        {/* Contact Info */}
        <Card className="mb-5">
          <h3 className="font-heading font-bold text-sm mb-3">Contact Information</h3>
          <div className="space-y-3">
            {res.phone && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <a
                  href={`tel:${res.phone}`}
                  className="text-sm text-gold font-medium"
                >
                  {res.phone}
                </a>
              </div>
            )}
            {res.website && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🌐</span>
                <a
                  href={
                    res.website.startsWith("http")
                      ? res.website
                      : `https://${res.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gold font-medium truncate"
                >
                  {res.website}
                </a>
              </div>
            )}
            {res.address && (
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gold font-medium"
                  >
                    {res.address}
                  </a>
                ) : (
                  <p className="text-sm">{res.address}</p>
                )}
              </div>
            )}
            {res.hours && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🕐</span>
                <p className="text-sm">{typeof res.hours === 'string' ? res.hours : JSON.stringify(res.hours)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Languages */}
        {res.languages && res.languages.length > 0 && (
          <div className="mb-5">
            <h3 className="font-heading font-bold text-sm mb-2">Languages Spoken</h3>
            <div className="flex flex-wrap gap-1.5">
              {res.languages.map((lang) => (
                <Badge key={lang} label={lang} variant="purple" />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gold text-midnight px-5 py-3 rounded-full text-sm font-bold press hover:bg-gold-light transition-colors"
            >
              <svg
                width="18"
                height="18"
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
              className="flex items-center justify-center gap-2 bg-white/10 text-white px-5 py-3 rounded-full text-sm font-medium press hover:bg-white/15 transition-colors border border-white/10"
            >
              📞 Call Now
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
