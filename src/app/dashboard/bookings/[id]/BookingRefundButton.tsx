"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

type RefundMode = "full" | "partial";

export default function BookingRefundButton({
  bookingId,
  price,
  paymentIntentId,
}: {
  bookingId: string;
  price: number;
  paymentIntentId: string | null;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<RefundMode>("full");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  if (!paymentIntentId) return null;

  async function handleRefund() {
    setLoading(true);
    setResult(null);

    try {
      const body: { amount?: number } = {};
      if (mode === "partial") {
        const cents = Math.round(parseFloat(amount) * 100);
        if (isNaN(cents) || cents <= 0) {
          setResult({ type: "error", message: "Enter a valid refund amount" });
          setLoading(false);
          return;
        }
        if (cents > price) {
          setResult({
            type: "error",
            message: "Amount exceeds booking price",
          });
          setLoading(false);
          return;
        }
        body.amount = cents;
      }

      const res = await fetch(`/api/bookings/${bookingId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error || "Refund failed" });
        return;
      }

      const refundedAmount = data.refund?.amount
        ? `$${(data.refund.amount / 100).toFixed(2)}`
        : `$${(price / 100).toFixed(2)}`;

      setResult({
        type: "success",
        message: `Refund of ${refundedAmount} processed successfully`,
      });
      setShowForm(false);
      router.refresh();
    } catch {
      setResult({ type: "error", message: "Failed to process refund" });
    } finally {
      setLoading(false);
    }
  }

  if (result?.type === "success") {
    return (
      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
        <p className="text-sm text-emerald-400">{result.message}</p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        variant="danger"
        size="sm"
        onClick={() => setShowForm(true)}
      >
        Process Refund
      </Button>
    );
  }

  return (
    <div className="rounded-xl bg-white/[0.03] border border-border-subtle p-4 space-y-3">
      <h4 className="text-sm font-semibold">Process Refund</h4>

      {/* Refund type selection */}
      <div className="flex gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="refundMode"
            checked={mode === "full"}
            onChange={() => setMode("full")}
            className="accent-gold"
          />
          <span className="text-sm">
            Full Refund ({`$${(price / 100).toFixed(2)}`})
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="refundMode"
            checked={mode === "partial"}
            onChange={() => setMode("partial")}
            className="accent-gold"
          />
          <span className="text-sm">Partial Refund</span>
        </label>
      </div>

      {/* Partial amount input */}
      {mode === "partial" && (
        <div>
          <label className="text-xs text-txt-secondary block mb-1">
            Refund Amount ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={(price / 100).toFixed(2)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>
      )}

      {/* Error message */}
      {result?.type === "error" && (
        <p className="text-xs text-coral">{result.message}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          onClick={handleRefund}
          loading={loading}
        >
          Confirm Refund
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowForm(false);
            setResult(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
