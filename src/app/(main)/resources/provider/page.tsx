import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

const CATEGORIES: { label: string; icon: IconName; color: string; blurb: string }[] = [
  { label: "Housing", icon: "house", color: "#3B82F6", blurb: "Rentals, rapid-rehousing, vouchers" },
  { label: "Jobs", icon: "briefcase", color: "#22C55E", blurb: "Apprenticeships, openings, training" },
  { label: "Food", icon: "apple", color: "#FF6B6B", blurb: "Pantries, hot meals, delivery" },
  { label: "Youth", icon: "baby", color: "#8B5CF6", blurb: "Camps, mentoring, after-school" },
  { label: "Education", icon: "education", color: "#06B6D4", blurb: "GED, tutoring, scholarships" },
  { label: "Health", icon: "heart-pulse", color: "#EF4444", blurb: "Clinics, mental health, dental" },
  { label: "Legal", icon: "gavel", color: "#FF006E", blurb: "Tenant rights, immigration, ID" },
  { label: "Senior", icon: "elder", color: "#F59E0B", blurb: "Wellness, meals, transport" },
];

const STEPS = [
  {
    n: "01",
    title: "Sign up as a provider",
    body: "Tell us who you are and what kinds of resources you offer.",
  },
  {
    n: "02",
    title: "Post your resources",
    body: "Add the basics — what, where, when, eligibility, spots, deadline. Custom application forms supported.",
  },
  {
    n: "03",
    title: "Review applicants & track outcomes",
    body: "Manage applications on a kanban board. Update status with notes the applicant sees in real time.",
  },
];

export default function ProviderLandingPage() {
  return (
    <div className="min-h-dvh pb-24" style={{ background: "var(--paper)", color: "var(--ink-strong)" }}>
      <div className="px-5 pt-8 max-w-2xl mx-auto">
        <p className="c-kicker" style={{ opacity: 0.6 }}>§ FOR ORGANIZATIONS</p>
        <h1 className="c-hero mt-2" style={{ fontSize: 36, lineHeight: 1.05 }}>
          Post programs that<br /> reach Compton.
        </h1>
        <p className="c-serif-it mt-3" style={{ fontSize: 16, opacity: 0.8 }}>
          Housing landlords, nonprofits, clinics, employers, food banks, schools, legal aid,
          senior services — get your programs in front of the residents who need them.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/provider-signup"
            className="c-btn c-btn-primary press"
            style={{ flex: 1, textAlign: "center" }}
          >
            BECOME A PROVIDER
          </Link>
          <Link
            href="/resources"
            className="c-btn c-btn-outline press"
            style={{ flex: 1, textAlign: "center" }}
          >
            BROWSE RESOURCES
          </Link>
        </div>

        {/* Categories */}
        <div className="mt-10">
          <p className="c-kicker mb-3" style={{ opacity: 0.6 }}>WHAT YOU CAN POST</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((c) => (
              <div
                key={c.label}
                className="p-4"
                style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div
                    className="w-8 h-8 flex items-center justify-center"
                    style={{ background: c.color, border: "2px solid var(--rule-strong-c)" }}
                  >
                    <Icon name={c.icon} size={18} style={{ color: "#000" }} />
                  </div>
                  <span className="c-card-t" style={{ fontSize: 14 }}>{c.label}</span>
                </div>
                <p className="c-meta" style={{ fontSize: 12, opacity: 0.75 }}>{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-10">
          <p className="c-kicker mb-3" style={{ opacity: 0.6 }}>HOW IT WORKS</p>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="p-5 flex gap-4"
                style={{ background: "var(--paper-soft)", border: "2px solid var(--rule-strong-c)" }}
              >
                <span className="c-hero shrink-0" style={{ fontSize: 28, color: "var(--gold-c)" }}>{s.n}</span>
                <div>
                  <h3 className="c-card-t" style={{ fontSize: 16 }}>{s.title}</h3>
                  <p className="c-meta mt-1" style={{ fontSize: 13, opacity: 0.8 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-10 p-6 text-center" style={{ background: "var(--ink-strong)", color: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
          <h2 className="c-hero" style={{ fontSize: 24, color: "var(--gold-c)" }}>
            Ready to help your community?
          </h2>
          <p className="c-serif-it mt-2" style={{ fontSize: 14, opacity: 0.85 }}>
            Free for verified community organizations.
          </p>
          <Link
            href="/provider-signup"
            className="c-btn c-btn-primary press mt-4 inline-block"
          >
            START NOW
          </Link>
        </div>
      </div>
    </div>
  );
}
