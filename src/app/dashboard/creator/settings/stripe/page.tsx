"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface AccountStatus {
  connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}

/**
 * /dashboard/creator/settings/stripe — Stripe Connect Express onboarding
 * surface for creators. The API endpoints already exist:
 *   - POST /api/stripe/creator/connect   → returns a fresh AccountLink URL
 *   - GET  /api/stripe/creator/account-status → returns connect/charges/payouts flags
 *
 * This page just wraps them with a clear status panel + connect/resume CTA.
 * Linked from the earnings page Connect Stripe card.
 */
export default function CreatorStripeSettingsPage() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stripe/creator/account-status", {
          cache: "no-store",
        });
        const data = (await res.json()) as AccountStatus | { error: string };
        if (cancelled) return;
        if (!res.ok) {
          setError("error" in data ? data.error : "Status check failed");
        } else if ("connected" in data) {
          setStatus(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Status check failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/creator/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Failed to start Stripe onboarding");
        setStarting(false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start onboarding");
      setStarting(false);
    }
  }

  const fullyReady =
    !!status?.connected &&
    !!status?.charges_enabled &&
    !!status?.payouts_enabled;

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <Link
          href="/dashboard/creator/earnings"
          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40"
        >
          ← EARNINGS
        </Link>
        <h1 className="font-heading font-bold text-lg text-white mt-2">
          Stripe Payouts
        </h1>
        <p className="text-xs text-white/40 mt-0.5">
          Connect your bank account to receive creator earnings
        </p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 bg-coral/15 text-coral text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <div className="h-12 skeleton rounded" />
        </Card>
      ) : (
        <>
          {/* Status panel */}
          <Card>
            <div className="space-y-3">
              <StatusRow
                label="Account connected"
                value={!!status?.connected}
              />
              <StatusRow
                label="Onboarding complete"
                value={!!status?.onboarding_complete}
              />
              <StatusRow
                label="Charges enabled"
                value={!!status?.charges_enabled}
              />
              <StatusRow
                label="Payouts enabled"
                value={!!status?.payouts_enabled}
              />
            </div>
          </Card>

          {fullyReady ? (
            <Card glow>
              <div className="flex items-center gap-3">
                <Badge label="Ready" variant="emerald" />
                <p className="text-sm text-white">
                  Payouts are enabled. Earnings appear in your dashboard
                  automatically.
                </p>
              </div>
            </Card>
          ) : (
            <button
              onClick={handleConnect}
              disabled={starting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-gold to-gold-light text-midnight text-sm font-semibold disabled:opacity-50"
            >
              {starting
                ? "Redirecting…"
                : status?.connected
                  ? "Resume onboarding"
                  : "Connect with Stripe"}
            </button>
          )}

          <Card>
            <div className="space-y-2 text-xs text-white/60 leading-relaxed">
              <p>
                We use Stripe Connect (Express accounts) to handle payouts.
                You&apos;ll be redirected to Stripe to verify identity, business
                details, and bank info.
              </p>
              <p>
                Hub City does not store your bank account or tax info — it
                lives with Stripe.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/80">{label}</span>
      <Badge
        label={value ? "Yes" : "Pending"}
        variant={value ? "emerald" : "gold"}
        size="sm"
      />
    </div>
  );
}
