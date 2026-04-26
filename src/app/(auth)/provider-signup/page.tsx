"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import { SITE_NAME } from "@/lib/branding";
import type { ResourceCategory } from "@/types/database";

const RESOURCE_CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "housing", label: "Housing (rentals, programs)" },
  { value: "health", label: "Health & Wellness" },
  { value: "jobs", label: "Jobs & Workforce" },
  { value: "food", label: "Food Programs" },
  { value: "youth", label: "Youth Programs" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal Resources" },
  { value: "senior", label: "Senior Services" },
  { value: "veterans", label: "Veterans" },
  { value: "utilities", label: "Utilities & Bill Help" },
  { value: "business", label: "Business Support" },
];

export default function ProviderSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  // Step 1 — auth (only used if not signed in)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — org info
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState<ResourceCategory>("housing");
  const [mission, setMission] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      if (data.user) {
        setAuthed(true);
        setStep(2);
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleAuthStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) return setError("Your name is required");
    if (!email.trim()) return setError("Email is required");
    if (password.length < 6) return setError("Password must be at least 6 characters");

    setLoading(true);
    const { error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    setAuthed(true);
    setStep(2);
  }

  async function handleProviderSubmit() {
    setError("");
    if (!orgName.trim()) return setError("Organization name is required");
    if (!primaryCategory) return setError("Please select a primary category");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/become-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_name: orgName.trim(),
          phone: phone.trim() || null,
          website: website.trim() || null,
          mission: mission.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create provider account");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/resources/new?category=${primaryCategory}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!authReady) {
    return (
      <div className="max-w-[430px] mx-auto min-h-dvh flex items-center justify-center px-6 culture-surface">
        <p className="c-serif-it" style={{ color: "var(--ink-strong)", opacity: 0.6 }}>
          Loading…
        </p>
      </div>
    );
  }

  const totalSteps = authed ? 1 : 2;
  const stepTitles = authed ? ["Organization"] : ["Account", "Organization"];
  const indicatorStep = authed ? 1 : step;

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col px-6 py-8 culture-surface">
      <div className="flex items-center gap-3 mb-6 justify-center">
        <div
          className="w-12 h-12 flex items-center justify-center c-hero"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontSize: 22,
          }}
        >
          {SITE_NAME.slice(0, 1).toUpperCase()}
        </div>
        <span className="c-hero" style={{ fontSize: 26, color: "var(--ink-strong)" }}>
          {SITE_NAME}
        </span>
      </div>

      <p className="c-kicker text-center" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>
        § BECOME A RESOURCE PROVIDER
      </p>
      <h1 className="c-hero text-center mt-1 mb-1" style={{ fontSize: 30, color: "var(--ink-strong)" }}>
        Post Resources For Your Community.
      </h1>
      <p className="c-serif-it text-center mb-6" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}>
        Housing, jobs, food, youth, education, legal, and more.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full h-1.5"
              style={{
                background: s <= indicatorStep ? "var(--gold-c)" : "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
              }}
            />
            <span
              className="c-kicker"
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "var(--ink-strong)",
                opacity: s <= indicatorStep ? 1 : 0.4,
              }}
            >
              {stepTitles[s - 1]}
            </span>
          </div>
        ))}
      </div>

      {!authed && step === 1 && (
        <form onSubmit={handleAuthStep} className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Jane Smith"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@organization.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div
              className="px-4 py-3 c-kicker"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--gold-c)",
                fontSize: 12,
                letterSpacing: "0.12em",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="c-btn c-btn-primary w-full press disabled:opacity-50"
          >
            {loading ? "CREATING…" : "CONTINUE"}
          </button>

          <p className="c-meta text-center" style={{ fontSize: 11 }}>
            Already have an account?{" "}
            <Link href="/login?next=/provider-signup" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Organization Name"
            placeholder="e.g. Compton Community Outreach"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          <div className="w-full">
            <label
              className="block c-kicker mb-1.5"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              PRIMARY CATEGORY
            </label>
            <select
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value as ResourceCategory)}
              className="w-full px-4 py-3 focus:outline-none transition-colors"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 14,
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
              }}
            >
              {RESOURCE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="c-meta mt-1" style={{ fontSize: 11, opacity: 0.7 }}>
              You can post resources in any category later — this is just your main focus.
            </p>
          </div>

          <Input
            label="Contact Phone"
            type="tel"
            placeholder="(310) 555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Website (optional)"
            type="url"
            placeholder="https://yourorg.org"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />

          <div className="w-full">
            <label
              className="block c-kicker mb-1.5"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              MISSION (OPTIONAL)
            </label>
            <textarea
              placeholder="What does your organization do for the community?"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 focus:outline-none resize-none transition-colors"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 14,
                fontFamily: "var(--font-fraunces), serif",
              }}
            />
          </div>

          {error && (
            <div
              className="px-4 py-3 c-kicker"
              style={{
                background: "var(--ink-strong)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--gold-c)",
                fontSize: 12,
                letterSpacing: "0.12em",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleProviderSubmit}
            disabled={loading}
            className="c-btn c-btn-primary w-full press disabled:opacity-50"
          >
            {loading ? "CREATING…" : "CREATE PROVIDER ACCOUNT"}
          </button>

          <p className="c-meta text-center" style={{ fontSize: 11 }}>
            You&rsquo;ll be taken to your dashboard to post your first resource.
          </p>
        </div>
      )}
    </div>
  );
}
