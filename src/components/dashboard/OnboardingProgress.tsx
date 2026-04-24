"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

export interface OnboardingSteps {
  hasName: boolean;
  hasPhoto: boolean;
  hasMenu: boolean;
  hasStripe: boolean;
  isLive: boolean;
}

interface OnboardingProgressProps {
  businessId: string;
  steps: OnboardingSteps;
}

const STEPS = [
  {
    key: "hasName" as keyof OnboardingSteps,
    label: "Create your listing",
    href: "/dashboard/profile",
    actionLabel: "Add details",
  },
  {
    key: "hasPhoto" as keyof OnboardingSteps,
    label: "Add photos",
    href: "/dashboard/profile",
    actionLabel: "Upload photo",
  },
  {
    key: "hasMenu" as keyof OnboardingSteps,
    label: "Add menu / services",
    href: "/dashboard/menu",
    actionLabel: "Add items",
  },
  {
    key: "hasStripe" as keyof OnboardingSteps,
    label: "Connect Stripe",
    href: "/dashboard/settings",
    actionLabel: "Connect",
  },
  {
    key: "isLive" as keyof OnboardingSteps,
    label: "Go live",
    href: null,
    actionLabel: "Publish",
  },
];

export default function OnboardingProgress({
  businessId,
  steps,
}: OnboardingProgressProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const doneCount = STEPS.filter((s) => steps[s.key]).length;
  const allDone = doneCount === STEPS.length;

  // Hide once fully set up and live
  if (allDone) return null;

  const progressPct = (doneCount / STEPS.length) * 100;

  async function handleGoLive() {
    setPublishError("");
    setPublishing(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("businesses")
        .update({ is_published: true })
        .eq("id", businessId);
      if (error) throw error;
      router.refresh();
    } catch {
      setPublishError("Failed to publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card glow className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading font-semibold text-base text-white">
            Finish your listing
          </h2>
          <p className="text-xs text-txt-secondary mt-0.5">
            {doneCount} / {STEPS.length} steps complete
          </p>
        </div>
        <span className="text-xs font-semibold text-gold bg-gold/10 rounded-lg px-2.5 py-1 shrink-0">
          {Math.round(progressPct)}%
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar value={progressPct} height={6} />

      {/* Step list */}
      <ul className="space-y-2.5">
        {STEPS.map((step) => {
          const done = steps[step.key];
          return (
            <li key={step.key} className="flex items-center gap-3">
              {/* Circle icon */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  done
                    ? "bg-gold/20 text-gold"
                    : "bg-white/5 border border-border-subtle text-txt-secondary"
                }`}
              >
                {done ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/20" />
                )}
              </div>

              {/* Label */}
              <span
                className={`flex-1 text-sm ${
                  done ? "text-txt-secondary line-through" : "text-white"
                }`}
              >
                {step.label}
              </span>

              {/* Action link / button */}
              {!done && (
                <>
                  {step.href ? (
                    <Link
                      href={step.href}
                      className="text-xs font-semibold text-gold hover:text-gold-light transition-colors shrink-0"
                    >
                      {step.actionLabel}
                    </Link>
                  ) : (
                    <button
                      onClick={handleGoLive}
                      disabled={publishing}
                      className="text-xs font-semibold text-gold hover:text-gold-light transition-colors shrink-0 disabled:opacity-50"
                    >
                      {publishing ? "Publishing…" : step.actionLabel}
                    </button>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>

      {publishError && (
        <p className="text-xs text-coral bg-coral/10 rounded-lg px-3 py-2">
          {publishError}
        </p>
      )}
    </Card>
  );
}
