"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const PILLARS = [
  {
    icon: "📱",
    title: "Hub City App",
    subtitle: "Distribution Platform",
    desc: "Live & on-demand streaming, creator profiles, and direct audience connection across Compton.",
    color: "#F2A900",
  },
  {
    icon: "🎓",
    title: "Creator Academy",
    subtitle: "Training Pipeline",
    desc: "Production skills, AI tools, digital content creation, and mentorship from industry pros.",
    color: "#3B82F6",
  },
  {
    icon: "🎬",
    title: "Hub City Studios",
    subtitle: "Content Network",
    desc: "Scripted shows, news, cooking, animation, and original programming made in Compton.",
    color: "#8B5CF6",
  },
  {
    icon: "💰",
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
      <div className="min-h-dvh bg-midnight flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-deep to-hc-purple/8" />
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-midnight to-transparent" />

        <div className="relative z-10 px-5 pt-8 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <span className="text-sm">🎬</span>
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider">Creator Program</span>
          </div>
          <h1 className="font-heading text-3xl font-bold mb-3">
            Compton <span className="text-gold">Creator</span> Program
          </h1>
          <p className="text-sm text-txt-secondary max-w-md mx-auto leading-relaxed">
            Empowering local voices to tell Compton&apos;s story. Create content, build an audience,
            and earn revenue — all from your community.
          </p>
        </div>
      </div>

      {/* Program Pillars */}
      <section className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">The Four Pillars</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: pillar.color }} />
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${pillar.color}15` }}
                >
                  <span className="text-xl">{pillar.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-sm mb-0.5">{pillar.title}</h3>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: pillar.color }}>
                    {pillar.subtitle}
                  </p>
                  <p className="text-[11px] text-txt-secondary leading-relaxed">{pillar.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Revenue Split Banner */}
      <section className="px-5 mb-8">
        <div className="rounded-2xl bg-gradient-to-r from-gold/10 via-gold/5 to-emerald/10 border border-gold/20 p-4">
          <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-2">Revenue Split</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="font-heading font-bold text-xl text-gold">40%</p>
              <p className="text-[9px] text-txt-secondary font-semibold uppercase">Creator</p>
            </div>
            <div className="w-px h-8 bg-border-subtle" />
            <div className="flex-1 text-center">
              <p className="font-heading font-bold text-xl text-hc-blue">30%</p>
              <p className="text-[9px] text-txt-secondary font-semibold uppercase">Platform</p>
            </div>
            <div className="w-px h-8 bg-border-subtle" />
            <div className="flex-1 text-center">
              <p className="font-heading font-bold text-xl text-emerald">30%</p>
              <p className="text-[9px] text-txt-secondary font-semibold uppercase">Community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form or Sign-in CTA */}
      <section className="px-5 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full bg-hc-purple" />
          <h2 className="font-heading font-bold text-base">Apply Now</h2>
        </div>

        {existingStatus ? (
          <Card glow>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{
                background: existingStatus === "approved" ? "rgba(34,197,94,0.15)" : existingStatus === "pending" ? "rgba(242,169,0,0.15)" : "rgba(239,68,68,0.15)"
              }}>
                <span className="text-3xl">{existingStatus === "approved" ? "✅" : existingStatus === "pending" ? "⏳" : "❌"}</span>
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                {existingStatus === "approved" ? "You're a Creator!" : existingStatus === "pending" ? "Application Under Review" : "Application Not Approved"}
              </h3>
              <p className="text-sm text-txt-secondary mb-4 max-w-sm mx-auto">
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
          <Card glow>
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald/15 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">Application Submitted!</h3>
              <p className="text-sm text-txt-secondary mb-4 max-w-sm mx-auto">
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
              <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-heading font-bold text-base mb-2">Sign in to Apply</h3>
              <p className="text-xs text-txt-secondary mb-5 max-w-xs mx-auto">
                You need a Hub City account to apply to the Creator Program.
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
                <div className="rounded-xl bg-coral/10 border border-coral/20 p-3">
                  <p className="text-xs text-coral">{error}</p>
                </div>
              )}

              {/* Channel Name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Channel Name *</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Compton Chronicles"
                  required
                  className="w-full bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>

              {/* Content Type */}
              <div>
                <label className="block text-xs font-semibold mb-2">Content Type *</label>
                <div className="flex gap-3">
                  {(["video", "podcast", "both"] as ContentType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setContentType(type)}
                      className={`
                        flex-1 py-3 rounded-xl text-xs font-semibold capitalize transition-all
                        ${contentType === type
                          ? "bg-gold/15 text-gold border border-gold/30"
                          : "bg-white/[0.04] text-txt-secondary border border-border-subtle hover:border-white/20"
                        }
                      `}
                    >
                      {type === "both" ? "Video & Podcast" : type === "video" ? "📹 Video" : "🎙️ Podcast"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Tell us about your content vision *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What stories do you want to tell? What makes your perspective unique?"
                  required
                  rows={4}
                  className="w-full bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors resize-none"
                />
              </div>

              {/* Portfolio URL */}
              <div>
                <label className="block text-xs font-semibold mb-1.5">
                  Portfolio URL <span className="text-txt-secondary font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://your-portfolio.com"
                  className="w-full bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors"
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-xs font-semibold mb-2">
                  Social Links <span className="text-txt-secondary font-normal">(optional)</span>
                </label>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">📸</span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Instagram handle"
                      className="flex-1 bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">▶️</span>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="YouTube channel"
                      className="flex-1 bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm w-6 text-center">🎵</span>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="TikTok handle"
                      className="flex-1 bg-white/[0.06] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors"
                    />
                  </div>
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

              <p className="text-[10px] text-txt-secondary text-center">
                By applying, you agree to the{" "}
                <Link href="/creators/terms" className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors">
                  Hub City Creator Program terms
                </Link>{" "}
                and{" "}
                <Link href="/community-guidelines" className="text-gold underline underline-offset-2 hover:text-gold-light transition-colors">
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
