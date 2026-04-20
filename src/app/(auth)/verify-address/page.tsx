"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
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
    <div className="max-w-[430px] mx-auto min-h-dvh bg-midnight flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-gold-glow flex items-center justify-center mb-6">
        <span className="text-3xl"><Icon name="pin" size={28} /></span>
      </div>

      <h1 className="font-heading text-2xl font-bold mb-2">
        Verify Your Address
      </h1>
      <p className="text-txt-secondary text-sm text-center mb-8">
        Help us connect you with your district and neighborhood resources
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
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {outcome?.kind === "pending_review" && (
          <div className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-3 text-sm text-gold">
            <p className="font-semibold mb-1">We&rsquo;re reviewing your address</p>
            <p className="text-gold/80">{outcome.message}</p>
          </div>
        )}

        {outcome?.kind === "rejected" && (
          <div className="rounded-lg bg-coral/10 border border-coral/20 px-3 py-3 text-sm">
            <p className="font-semibold text-coral mb-1">{outcome.message}</p>
            {outcome.supported && outcome.supported.length > 0 && (
              <p className="text-coral/80">
                Currently supported cities: {outcome.supported.join(", ")}.
              </p>
            )}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Verify & Continue
        </Button>
      </form>

      <button
        onClick={() => router.push("/")}
        className="text-sm text-txt-secondary mt-6 hover:text-white"
      >
        Skip for now
      </button>
    </div>
  );
}
