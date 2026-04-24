"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type VerifyOutcome =
  | { kind: "verified" }
  | { kind: "pending_review"; message: string }
  | { kind: "rejected"; message: string; supported?: string[] };

const BENEFITS = [
  {
    icon: "🏅",
    title: "Local badge",
    desc: "Show up first in your city's feed",
  },
  {
    icon: "🎟️",
    title: "Member perks",
    desc: "Exclusive discounts from local independents",
  },
  {
    icon: "🗳️",
    title: "City polls",
    desc: "Vote on what matters in your scene",
  },
];

export default function ClaimYourCityPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-midnight" />}>
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
    <div className="max-w-[430px] mx-auto min-h-dvh bg-midnight flex flex-col px-6 pt-safe-top pb-8">
      {/* Back arrow */}
      <div className="pt-4 pb-2">
        <Link
          href={nextPath === "/" ? "/" : nextPath}
          className="inline-flex items-center gap-1.5 text-txt-secondary hover:text-white transition-colors text-sm"
          aria-label="Go back"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center text-center pt-6 pb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 text-3xl">
          📍
        </div>
        <h1 className="font-display text-[2rem] leading-[1.1] font-normal text-white mb-3">
          Claim your city.
        </h1>
        <p className="text-txt-secondary text-sm leading-relaxed max-w-[280px]">
          Get your local badge, priority in city feeds, and unlock exclusive member perks.
        </p>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-white/4 border border-white/8"
          >
            <span className="text-2xl leading-none">{b.icon}</span>
            <p className="text-[11px] font-semibold text-white leading-tight">{b.title}</p>
            <p className="text-[10px] text-txt-secondary leading-tight">{b.desc}</p>
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
          <p className="text-sm text-coral bg-coral/10 rounded-xl px-3 py-2.5">
            {error}
          </p>
        )}

        {/* Pending review feedback */}
        {outcome?.kind === "pending_review" && (
          <div className="rounded-xl bg-gold/8 border border-gold/20 px-4 py-3 text-sm text-gold">
            <p className="font-semibold mb-1">We&rsquo;re reviewing your address</p>
            <p className="text-gold/70 text-xs leading-relaxed">{outcome.message}</p>
          </div>
        )}

        {/* Rejected feedback */}
        {outcome?.kind === "rejected" && (
          <div className="rounded-xl bg-coral/8 border border-coral/20 px-4 py-3 text-sm">
            <p className="font-semibold text-coral mb-1">{outcome.message}</p>
            {outcome.supported && outcome.supported.length > 0 && (
              <p className="text-coral/70 text-xs">
                Currently supported cities: {outcome.supported.join(", ")}.
              </p>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="pt-2 space-y-3">
          <Button type="submit" fullWidth size="lg" loading={loading}>
            Claim {cityLabel}
          </Button>
          <p className="text-center text-[11px] text-txt-secondary/60 leading-relaxed">
            Used only to verify your city. Never sold or shared.
          </p>
        </div>
      </form>

      {/* Skip */}
      <div className="pt-4 text-center">
        <Link
          href="/"
          className="text-sm text-txt-secondary hover:text-white transition-colors"
        >
          Skip for now
        </Link>
      </div>
    </div>
  );
}
