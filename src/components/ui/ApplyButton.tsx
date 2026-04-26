"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

interface ApplyButtonProps {
  resourceId: string;
  resourceName: string;
  resourceSlug?: string | null;
  acceptsApplications?: boolean;
  status: string;
  website: string | null;
  phone: string | null;
}

export default function ApplyButton({
  resourceId,
  resourceName,
  resourceSlug,
  acceptsApplications,
  status,
  website,
  phone,
}: ApplyButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleApply = () => {
    if (acceptsApplications) {
      router.push(`/resources/${resourceSlug || resourceId}/apply`);
      return;
    }
    if (website) {
      window.open(
        website.startsWith("http") ? website : `https://${website}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
    setShowModal(true);
  };

  const isOpen = status === "open" || status === "limited";
  const label = isOpen ? "Apply Now" : status === "upcoming" ? "Get Notified" : "Learn More";

  return (
    <>
      <Button fullWidth onClick={handleApply}>
        {label}
      </Button>

      {/* Apply info modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl animate-slide-up" style={{ borderTop: "2px solid var(--rule-strong-c)" }}>
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="px-5 pb-6">
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mx-auto mb-3">
                  <Icon name="document" size={28} className="text-gold" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-1" style={{ color: "var(--ink-strong)" }}>
                  Apply for {resourceName}
                </h3>
                <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
                  Here&apos;s how to apply for this resource
                </p>
              </div>

              <div className="space-y-3 mb-5">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-3 bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3.5 press hover:border-gold/20 transition-colors"
                  >
                    <Icon name="phone" size={20} className="text-white" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Call to Apply</p>
                      <p className="text-xs text-gold">{phone}</p>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-txt-secondary"
                      strokeLinecap="round"
                    >
                      <path d="M6 4l4 4-4 4" />
                    </svg>
                  </a>
                )}

                <div className="flex items-center gap-3 bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3.5">
                  <Icon name="building" size={20} className="text-white" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Visit In Person</p>
                    <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                      Visit the organization&apos;s office during business hours
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gold/[0.06] border border-gold/15 rounded-xl px-4 py-3.5">
                  <Icon name="lightbulb" size={20} className="text-gold" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gold">
                      Need Help Applying?
                    </p>
                    <p className="text-xs" style={{ color: "var(--ink-mute)" }}>
                      Ask Culture AI for step-by-step guidance
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 text-sm font-medium press transition-colors"
                style={{ color: "var(--ink-mute)" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
