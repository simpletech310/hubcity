"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";

/**
 * Action-bar button that:
 *   - On mobile: invokes navigator.share for the native share sheet
 *   - Always shows a "QR" affordance that pops a modal with a scannable
 *     QR code of the page URL, plus copy-to-clipboard fallback.
 */
export default function ShareQrButton({
  url,
  title,
  text,
  accentColor,
}: {
  url: string;
  title: string;
  text?: string;
  accentColor?: string;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate the QR lazily when the modal opens.
  useEffect(() => {
    if (!shareOpen) return;
    let cancelled = false;
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      // Ink on paper — matches the Culture press-pass treatment.
      color: { dark: "#0A0A0A", light: "#F5EFE0" },
    })
      .then((data) => {
        if (!cancelled) setQrDataUrl(data);
      })
      .catch((err) => {
        console.error("QR generation failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [shareOpen, url]);

  const handleShare = useCallback(async () => {
    // Try native share first (mobile).
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or unsupported — fall through to modal.
      }
    }
    setShareOpen(true);
  }, [title, text, url]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Last-ditch fallback: open prompt.
      window.prompt("Copy this link", url);
    }
  }, [url]);

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="flex flex-col items-center gap-1.5 py-3 press w-full"
        style={{
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <Icon name="share" size={18} style={{ color: accentColor || "var(--gold-c)" }} />
        <span
          className="c-kicker"
          style={{ fontSize: 9, letterSpacing: "0.16em", color: "var(--ink-strong)" }}
        >
          SHARE
        </span>
      </button>

      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share this business" size="sm">
        <div className="space-y-4">
          <div
            className="p-4 flex items-center justify-center"
            style={{
              background: "var(--paper)",
              border: "3px solid var(--rule-strong-c)",
            }}
          >
            {qrDataUrl ? (
              // QR is already a PNG data URL — img tag is fine here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{
                    border: "2px solid var(--gold-c)",
                    borderTopColor: "transparent",
                  }}
                />
              </div>
            )}
          </div>

          <p
            className="c-serif-it text-center"
            style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.75 }}
          >
            Scan with a phone camera to open the page.
          </p>

          <div
            className="flex items-center gap-2 p-2.5"
            style={{
              background: "var(--paper-warm)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <span
              className="truncate flex-1"
              style={{
                fontSize: 11,
                color: "var(--ink-strong)",
                fontFamily: "var(--font-dm-mono), monospace",
                letterSpacing: "0.04em",
              }}
            >
              {url}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="c-btn c-btn-primary c-btn-sm press"
            >
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
