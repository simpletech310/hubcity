"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  bookingId: string;
  totalCents: number;
  depositPaidCents: number;
  balancePaidCents: number;
  bookingStatus: string;
}

const METHODS: { value: "cash" | "card_at_appointment" | "platform" | "other"; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "card_at_appointment", label: "Card on-site" },
  { value: "platform", label: "Via app" },
  { value: "other", label: "Other" },
];

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Business-owner action that records the balance the customer settled at the
 * appointment (cash / card / via the app). On success the booking flips to
 * `completed` and the public detail page updates immediately.
 */
export default function MarkBalancePaid({
  bookingId,
  totalCents,
  depositPaidCents,
  balancePaidCents,
  bookingStatus,
}: Props) {
  const router = useRouter();
  const remainingCents = Math.max(
    0,
    totalCents - depositPaidCents - balancePaidCents,
  );

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((remainingCents / 100).toFixed(2));
  const [method, setMethod] =
    useState<(typeof METHODS)[number]["value"]>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fullySettled = remainingCents === 0;
  const cancelled = bookingStatus === "cancelled";
  if (cancelled) return null;

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const cents = Math.round(Number(amount.replace(/[^0-9.]/g, "")) * 100);
      if (!Number.isFinite(cents) || cents < 0) {
        throw new Error("Enter a valid amount");
      }
      const r = await fetch(`/api/bookings/${bookingId}/mark-balance-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: cents, method, complete: true }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to record payment");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (fullySettled) {
    return (
      <div
        className="rounded-xl p-3 text-sm"
        style={{
          background: "rgba(56, 161, 105, 0.12)",
          border: "1px solid rgba(56, 161, 105, 0.4)",
          color: "var(--green-c, #38a169)",
        }}
      >
        ✓ Balance settled — booking is paid in full.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-gold text-midnight font-bold text-sm py-3 press hover:opacity-90 transition-opacity"
      >
        Check in & Record Balance · {dollars(remainingCents)}
      </button>
    );
  }

  return (
    <div className="rounded-xl glass-card p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Record balance payment</h4>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-txt-secondary hover:text-white"
        >
          Cancel
        </button>
      </div>

      <div className="text-xs text-txt-secondary">
        Total {dollars(totalCents)} · Deposit paid {dollars(depositPaidCents)}
        {balancePaidCents > 0 && ` · Already collected ${dollars(balancePaidCents)}`}
      </div>

      <label className="block">
        <span className="text-xs text-txt-secondary">Amount paid</span>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-txt-secondary">$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg bg-midnight-light/40 border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
            placeholder="0.00"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-xs text-txt-secondary">Method</span>
        <select
          value={method}
          onChange={(e) =>
            setMethod(e.target.value as (typeof METHODS)[number]["value"])
          }
          className="mt-1 w-full rounded-lg bg-midnight-light/40 border border-border-subtle px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
        >
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {err && <p className="text-xs text-coral">{err}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-xl bg-gold text-midnight font-bold text-sm py-2.5 press hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Recording…" : "Confirm Payment & Check In"}
      </button>
    </div>
  );
}
