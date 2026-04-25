"use client";

import { useState } from "react";

const PRESET_AMOUNTS = [1, 3, 5, 10, 25];

interface TipJarProps {
  channelId: string;
  channelName: string;
  stripeAccountId: string | null;
}

export default function TipJar({
  channelId,
  channelName,
  stripeAccountId,
}: TipJarProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(3);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!stripeAccountId) {
    return (
      <p className="text-[12px] text-center py-2" style={{ color: "var(--ink-mute)" }}>
        Creator hasn&apos;t set up tips yet
      </p>
    );
  }

  const effectiveAmount: number | null = (() => {
    if (customAmount !== "") {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) ? null : parsed;
    }
    return selectedAmount;
  })();

  const amountCents =
    effectiveAmount !== null ? Math.round(effectiveAmount * 100) : null;

  async function handleTip() {
    if (!amountCents || amountCents < 100) {
      setError("Minimum tip is $1.00");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/tips/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId,
          channelName,
          amountCents,
          message: message.trim() || undefined,
          stripeAccountId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="border border-gold/15 p-4 space-y-3" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <p className="font-heading font-bold text-sm text-gold">Send a Tip 💛</p>

      {/* Preset amount pills */}
      <div className="flex flex-wrap gap-2">
        {PRESET_AMOUNTS.map((amt) => {
          const isSelected = customAmount === "" && selectedAmount === amt;
          return (
            <button
              key={amt}
              onClick={() => {
                setSelectedAmount(amt);
                setCustomAmount("");
                setError("");
              }}
              className={`px-3 py-1.5 text-[12px] font-semibold border transition-all press ${
                isSelected
                  ? "bg-gold/20 text-gold border-gold/50"
                  : "hover:border-gold/30"
              }`}
              style={!isSelected ? { background: "var(--paper-soft)", color: "var(--ink-mute)", borderColor: "var(--rule-c)" } : undefined}
            >
              ${amt}
            </button>
          );
        })}

        {/* Custom amount input */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] pointer-events-none" style={{ color: "var(--ink-mute)" }}>
            $
          </span>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Other"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
              setError("");
            }}
            className={`w-20 pl-5 pr-2 py-1.5 text-[12px] font-semibold border focus:outline-none transition-all ${
              customAmount !== ""
                ? "border-gold/50 bg-gold/10"
                : "focus:border-gold/30"
            }`}
            style={customAmount === "" ? { background: "var(--paper-soft)", color: "var(--ink-strong)", borderColor: "var(--rule-c)" } : undefined}
          />
        </div>
      </div>

      {/* Message textarea */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 140))}
          placeholder="Leave a message (optional)"
          rows={2}
          className="w-full px-3 py-2 text-[12px] resize-none focus:outline-none focus:border-gold/30 transition-colors"
          style={{ background: "var(--paper-soft)", border: "1px solid var(--rule-c)", color: "var(--ink-strong)" }}
        />
        {message.length > 0 && (
          <p className="text-[10px] text-right mt-0.5" style={{ color: "var(--ink-mute)" }}>
            {message.length}/140
          </p>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-[11px] text-coral">{error}</p>}

      {/* Send button */}
      <button
        onClick={handleTip}
        disabled={loading || !amountCents || amountCents < 100}
        className="w-full py-2.5 text-sm font-bold press transition-all bg-gradient-to-r from-gold to-gold-light text-midnight disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Processing…
          </>
        ) : (
          `Tip ${channelName}${amountCents && amountCents >= 100 ? ` $${(amountCents / 100).toFixed(amountCents % 100 === 0 ? 0 : 2)}` : ""}`
        )}
      </button>
    </div>
  );
}
