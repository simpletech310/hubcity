"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";

type VerifyOutcome =
  | { kind: "verified" }
  | { kind: "pending_review"; message: string }
  | { kind: "rejected"; message: string; supported?: string[] };

const BENEFITS = [
  {
    icon: "★",
    title: "Local badge",
    desc: "Show up first in your city's feed",
  },
  {
    icon: "◆",
    title: "Member perks",
    desc: "Exclusive discounts from local independents",
  },
  {
    icon: "§",
    title: "City polls",
    desc: "Vote on what matters in your scene",
  },
];

export default function ClaimYourCityPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh culture-surface" />}>
      <ClaimYourCityInner />
    </Suspense>
  );
}

function ClaimYourCityInner() {
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  // Derive the city name for the CTA button
  const cityLabel = city.trim() || "Your City";

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOutcome(null);
    setLoading(true);

    if (!/^\d{5}$/.test(zip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/verification/verify-address", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address_line1: address,
          address_line2: address2 || undefined,
          zip,
        }),
      });
      const data = await res.json();

      if (res.status === 202 && data.status === "pending_review") {
        setOutcome({ kind: "pending_review", message: data.message });
        setLoading(false);
        return;
      }

      if (res.ok && data.status === "verified") {
        setOutcome({ kind: "verified" });
        router.push(nextPath);
        router.refresh();
        return;
      }

      // Rejected / unsupported city path
      setOutcome({
        kind: "rejected",
        message: data.error ?? "We couldn't verify that address.",
        supported: Array.isArray(data.supported) ? data.supported : undefined,
      });
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col px-6 pt-safe-top pb-8 culture-surface">
      {/* Back arrow */}
      <div className="pt-4 pb-2">
        <Link
          href={nextPath === "/" ? "/" : nextPath}
          className="inline-flex items-center gap-1.5 c-kicker press"
          style={{ color: "var(--ink-strong)", fontSize: 11, letterSpacing: "0.14em" }}
          aria-label="Go back"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center pt-6 pb-8">
        <div
          className="w-16 h-16 flex items-center justify-center mb-5 c-hero"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontSize: 30,
          }}
        >
          §
        </div>
        <p className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>§ CLAIM</p>
        <h1 className="c-hero mt-1 mb-3" style={{ fontSize: 36, lineHeight: 1.05, color: "var(--ink-strong)" }}>
          Claim your city.
        </h1>
        <p className="c-serif-it max-w-[280px]" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
          Get your local badge, priority in city feeds, and unlock exclusive member perks.
        </p>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex flex-col items-center text-center gap-2 p-3 c-frame"
            style={{ background: "var(--paper-soft)" }}
          >
            <span className="c-hero" style={{ fontSize: 22, color: "var(--ink-strong)", lineHeight: 1 }}>{b.icon}</span>
            <p className="c-card-t" style={{ fontSize: 11 }}>{b.title}</p>
            <p className="c-meta" style={{ fontSize: 10, lineHeight: 1.3 }}>{b.desc}</p>
          </div>
        ))}
      </div>

      {/* Address form */}
      <form onSubmit={handleClaim} className="w-full space-y-3 flex-1">
        <Input
          label="Street Address"
          placeholder="123 Main St"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          autoComplete="street-address"
          required
        />
        <Input
          label="Apt / Suite (optional)"
          placeholder="Apt 2B"
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
          autoComplete="address-line2"
        />

        {/* City / State / ZIP row */}
        <div className="grid grid-cols-[1fr_68px_80px] gap-2">
          <Input
            label="City"
            placeholder="Compton"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
          />
          <Input
            label="State"
            placeholder="CA"
            value={stateVal}
            onChange={(e) => setStateVal(e.target.value.toUpperCase().slice(0, 2))}
            maxLength={2}
            autoComplete="address-level1"
          />
          <Input
            label="ZIP"
            placeholder="90220"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            maxLength={5}
            inputMode="numeric"
            required
          />
        </div>

        {/* Inline error */}
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

        {/* Pending review feedback */}
        {outcome?.kind === "pending_review" && (
          <div
            className="px-4 py-3"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <p className="c-kicker mb-1" style={{ fontSize: 11, letterSpacing: "0.12em" }}>REVIEWING YOUR ADDRESS</p>
            <p className="c-body" style={{ fontSize: 12 }}>{outcome.message}</p>
          </div>
        )}

        {/* Rejected feedback */}
        {outcome?.kind === "rejected" && (
          <div
            className="px-4 py-3"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
            }}
          >
            <p className="c-kicker mb-1" style={{ fontSize: 11, letterSpacing: "0.12em" }}>{outcome.message}</p>
            {outcome.supported && outcome.supported.length > 0 && (
              <p style={{ fontSize: 11, opacity: 0.8 }}>
                Currently supported cities: {outcome.supported.join(", ")}.
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="c-btn c-btn-primary w-full press disabled:opacity-50"
          >
            {loading ? "CLAIMING…" : `CLAIM ${cityLabel.toUpperCase()}`}
          </button>
          <p className="text-center c-meta" style={{ fontSize: 11, opacity: 0.6 }}>
            Used only to verify your city. Never sold or shared.
          </p>
        </div>
      </form>

      {/* Skip */}
      <div className="pt-4 text-center">
        <Link
          href="/"
          className="c-kicker press"
          style={{ color: "var(--ink-strong)", opacity: 0.6, fontSize: 11, letterSpacing: "0.14em" }}
        >
          SKIP FOR NOW
        </Link>
      </div>
    </div>
  );
}
