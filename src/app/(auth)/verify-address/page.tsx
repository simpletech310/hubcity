"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";

type VerifyOutcome =
  | { kind: "verified" }
  | { kind: "pending_review"; message: string }
  | { kind: "rejected"; message: string; supported?: string[] };

export default function VerifyAddressPage() {
  const [address, setAddress] = useState("");
  const [address2, setAddress2] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
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
        router.push("/");
        router.refresh();
        return;
      }

      // Rejected / error path
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
    <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col items-center justify-center px-6 culture-surface">
      <div
        className="w-16 h-16 flex items-center justify-center mb-6"
        style={{
          background: "var(--gold-c)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        <Icon name="pin" size={28} />
      </div>

      <p className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>§ VERIFY</p>
      <h1 className="c-hero mt-1 mb-1" style={{ fontSize: 34, color: "var(--ink-strong)" }}>
        Verify Your Address.
      </h1>
      <p className="c-serif-it text-center mb-8" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
        Help us connect you with your local scene and community resources.
      </p>

      <form onSubmit={handleVerify} className="w-full space-y-4">
        <Input
          label="Street Address"
          placeholder="123 Main St"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <Input
          label="Apt / Suite (optional)"
          placeholder="Apt 2B"
          value={address2}
          onChange={(e) => setAddress2(e.target.value)}
        />
        <Input
          label="ZIP Code"
          placeholder="90220"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          maxLength={5}
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

        {outcome?.kind === "pending_review" && (
          <div
            className="px-4 py-3"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
            }}
          >
            <p className="c-kicker mb-1" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
              REVIEWING YOUR ADDRESS
            </p>
            <p className="c-body" style={{ fontSize: 13 }}>{outcome.message}</p>
          </div>
        )}

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
              <p style={{ fontSize: 12, opacity: 0.8 }}>
                Currently supported cities: {outcome.supported.join(", ")}.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="c-btn c-btn-primary w-full press disabled:opacity-50"
        >
          {loading ? "VERIFYING…" : "VERIFY & CONTINUE"}
        </button>
      </form>

      <button
        onClick={() => router.push("/")}
        className="c-kicker mt-6 press"
        style={{ color: "var(--ink-strong)", opacity: 0.6, fontSize: 11, letterSpacing: "0.14em" }}
      >
        SKIP FOR NOW
      </button>
    </div>
  );
}
