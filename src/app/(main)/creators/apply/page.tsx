"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const PILLARS: { iconName: IconName; title: string; subtitle: string; desc: string; color: string }[] = [
  {
    iconName: "live",
    title: "Culture",
    subtitle: "Distribution Platform",
    desc: "Live & on-demand streaming, creator profiles, and direct audience connection across Compton.",
    color: "#F2A900",
  },
  {
    iconName: "graduation",
    title: "Creator Academy",
    subtitle: "Training Pipeline",
    desc: "Production skills, AI tools, digital content creation, and mentorship from industry pros.",
    color: "#3B82F6",
  },
  {
    iconName: "film",
    title: "Culture Studios",
    subtitle: "Content Network",
    desc: "Scripted shows, news, cooking, animation, and original programming made in Compton.",
    color: "#8B5CF6",
  },
  {
    iconName: "dollar",
    title: "Ad Network",
    subtitle: "Revenue Engine",
    desc: "In-house ads with fair splits: 40% Creator / 30% Platform / 30% Community Fund.",
    color: "#22C55E",
  },
];

type ContentType = "video" | "podcast" | "both";

export default function CreatorApplyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [channelName, setChannelName] = useState("");
  const [contentType, setContentType] = useState<ContentType>("video");
  const [description, setDescription] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Check for existing application
        const { data: existing } = await supabase
          .from("creator_applications")
          .select("status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (existing) {
          setExistingStatus(existing.status);
        }
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/creators/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_name: channelName,
          content_type: contentType,
          description,
          portfolio_url: portfolioUrl || null,
          social_links: {
            instagram: instagram || null,
            youtube: youtube || null,
            tiktok: tiktok || null,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--paper)" }}>
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: "2px solid var(--rule-strong-c)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="relative z-10 px-5 pt-8 pb-6 text-center">
          <div className="c-badge-gold inline-flex items-center gap-2 mb-4">
            <Icon name="film" size={14} />
            <span>Creator Program</span>
          </div>
          <h1 className="c-hero mb-3" style={{ color: "var(--ink-strong)" }}>
            Compton Creator Program
          </h1>
          <p className="c-body max-w-md mx-auto leading-relaxed" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
            Empowering local voices to tell Compton&apos;s story. Create content, build an audience,
            and earn revenue — all from your community.
          </p>
        </div>
      </div>

      {/* Program Pillars */}
      <section className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>The Four Pillars</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: pillar.color }} />
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 flex items-center justify-center shrink-0"
                  style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
                >
                  <Icon name={pillar.iconName} size={22} style={{ color: "var(--ink-strong)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="c-card-t mb-0.5" style={{ fontSize: 14, color: "var(--ink-strong)" }}>{pillar.title}</h3>
                  <p className="c-kicker mb-1.5" style={{ color: "var(--ink-strong)" }}>
                    {pillar.subtitle}
                  </p>
                  <p className="c-body leading-relaxed" style={{ fontSize: 11, color: "var(--ink-strong)" }}>{pillar.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Revenue Split Banner */}
      <section className="px-5 mb-8">
        <div
          className="p-4"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          <p className="c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>Revenue Split</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>40%</p>
              <p className="c-kicker" style={{ fontSize: 9 }}>Creator</p>
            </div>
            <div className="w-px h-8" style={{ background: "var(--rule-strong-c)" }} />
            <div className="flex-1 text-center">
              <p className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>30%</p>
              <p className="c-kicker" style={{ fontSize: 9 }}>Platform</p>
            </div>
            <div className="w-px h-8" style={{ background: "var(--rule-strong-c)" }} />
            <div className="flex-1 text-center">
              <p className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)" }}>30%</p>
              <p className="c-kicker" style={{ fontSize: 9 }}>Community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form or Sign-in CTA */}
      <section className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5" style={{ background: "var(--gold-c)" }} />
          <h2 className="c-card-t" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Apply Now</h2>
        </div>

        {existingStatus ? (
          <Card>
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name={existingStatus === "approved" ? "check" : existingStatus === "pending" ? "clock" : "close"} size={28} style={{ color: "var(--ink-strong)" }} />
              </div>
              <h3 className="c-card-t mb-2" style={{ fontSize: 18, color: "var(--ink-strong)" }}>
                {existingStatus === "approved" ? "You're a Creator!" : existingStatus === "pending" ? "Application Under Review" : "Application Not Approved"}
              </h3>
              <p className="c-body mb-4 max-w-sm mx-auto" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                {existingStatus === "approved"
                  ? "Your creator application has been approved. Head to your dashboard to start creating."
                  : existingStatus === "pending"
                  ? "Your application is being reviewed. We'll notify you once a decision is made."
                  : "Your previous application was not approved. You may reapply after making updates to your content or portfolio."}
              </p>
              {existingStatus === "approved" ? (
                <Link href="/creators/dashboard">
                  <Button variant="primary" size="sm">Go to Dashboard</Button>
                </Link>
              ) : (
                <Link href="/">
                  <Button variant="outline" size="sm">Back to Home</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : submitted ? (
          <Card>
            <div className="text-center py-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="sparkle" size={28} style={{ color: "var(--ink-strong)" }} />
              </div>
              <h3 className="c-card-t mb-2" style={{ fontSize: 18, color: "var(--ink-strong)" }}>Application Submitted!</h3>
              <p className="c-body mb-4 max-w-sm mx-auto" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                We&apos;ll review your application and get back to you soon. Welcome to the future of Compton media.
              </p>
              <Link href="/">
                <Button variant="outline" size="sm">Back to Home</Button>
              </Link>
            </div>
          </Card>
        ) : !user ? (
          <Card>
            <div className="text-center py-8">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--gold-c)", border: "2px solid var(--rule-strong-c)" }}
              >
                <Icon name="lock" size={24} style={{ color: "var(--ink-strong)" }} />
              </div>
              <h3 className="c-card-t mb-2" style={{ fontSize: 16, color: "var(--ink-strong)" }}>Sign in to Apply</h3>
              <p className="c-body mb-5 max-w-xs mx-auto" style={{ fontSize: 12, color: "var(--ink-strong)" }}>
                You need a Culture account to apply to the Creator Program.
              </p>
              <Link href="/login?redirect=/creators/apply">
                <Button variant="primary">Sign In to Apply</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  className="p-3"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <p className="c-body" style={{ fontSize: 12, color: "var(--ink-strong)" }}>{error}</p>
                </div>
              )}

              {/* Channel Name */}
              <div>
                <label className="block c-kicker mb-1.5" style={{ color: "var(--ink-strong)" }}>Channel Name *</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Compton Chronicles"
                  required
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                    fontSize: 14,
                    fontFamily: "var(--font-fraunces), serif",
                  }}
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>Content Type *</label>
                <div className="flex gap-3">
                  {(["video", "podcast", "both"] as ContentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className="flex-1 py-3 capitalize transition-all"
                      style={{
                        background: contentType === type ? "var(--gold-c)" : "var(--paper)",
                        color: "var(--ink-strong)",
                        border: "2px solid var(--rule-strong-c)",
                        fontFamily: "var(--font-archivo-narrow), sans-serif",
                        fontSize: 12,
                        fontWeight: contentType === type ? 800 : 600,
                      }}
                    >
                      {type === "both" ? "Video & Podcast" : type === "video" ? "Video" : "Podcast"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block c-kicker mb-1.5" style={{ color: "var(--ink-strong)" }}>Tell us about your content vision *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What stories do you want to tell? What makes your perspective unique?"
                  required
                  rows={4}
                  className="w-full px-4 py-3 focus:outline-none transition-colors resize-none"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                    fontSize: 14,
                    fontFamily: "var(--font-fraunces), serif",
                  }}
                />
              </div>

              {/* Portfolio URL */}
              <div>
                <label className="block c-kicker mb-1.5" style={{ color: "var(--ink-strong)" }}>
                  Portfolio URL <span className="c-meta" style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://your-portfolio.com"
                  className="w-full px-4 py-3 focus:outline-none transition-colors"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                    fontSize: 14,
                    fontFamily: "var(--font-fraunces), serif",
                  }}
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block c-kicker mb-2" style={{ color: "var(--ink-strong)" }}>
                  Social Links <span className="c-meta" style={{ fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="space-y-2.5">
                  {[
                    { val: instagram, set: setInstagram, icon: "camera" as IconName, ph: "Instagram handle" },
                    { val: youtube, set: setYoutube, icon: "video" as IconName, ph: "YouTube channel" },
                    { val: tiktok, set: setTiktok, icon: "music" as IconName, ph: "TikTok handle" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-6 text-center" style={{ color: "var(--ink-strong)" }}><Icon name={row.icon} size={16} /></span>
                      <input
                        type="text"
                        value={row.val}
                        onChange={(e) => row.set(e.target.value)}
                        placeholder={row.ph}
                        className="flex-1 px-4 py-2.5 focus:outline-none transition-colors"
                        style={{
                          background: "var(--paper-warm)",
                          border: "2px solid var(--rule-strong-c)",
                          color: "var(--ink-strong)",
                          fontSize: 14,
                          fontFamily: "var(--font-fraunces), serif",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={submitting}
              >
                Submit Application
              </Button>

              <p className="c-meta text-center" style={{ fontSize: 10 }}>
                By applying, you agree to the{" "}
                <Link href="/creators/terms" className="underline underline-offset-2" style={{ color: "var(--ink-strong)" }}>
                  Culture Creator Program terms
                </Link>{" "}
                and{" "}
                <Link href="/community-guidelines" className="underline underline-offset-2" style={{ color: "var(--ink-strong)" }}>
                  community guidelines
                </Link>.
              </p>
            </form>
          </Card>
        )}
      </section>
    </div>
  );
}
