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
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
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
        className="flex flex-col items-center gap-1.5 rounded-xl bg-card border border-border-subtle py-3 press hover:border-gold/20 transition-colors w-full"
      >
        <Icon name="share" size={18} style={{ color: accentColor || "#F2A900" }} />
        <span className="text-[9px] font-semibold text-txt-secondary uppercase tracking-wider">
          Share
        </span>
      </button>

      <Modal isOpen={shareOpen} onClose={() => setShareOpen(false)} title="Share this business" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-4 flex items-center justify-center">
            {qrDataUrl ? (
              // QR is already a PNG data URL — img tag is fine here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="QR code" className="w-56 h-56" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <p className="text-xs text-txt-secondary text-center">
            Scan with a phone camera to open the page.
          </p>

          <div className="flex items-center gap-2 bg-white/5 border border-border-subtle rounded-xl p-2.5">
            <span className="text-xs text-white truncate flex-1 font-mono">{url}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-gold to-gold-light text-midnight text-xs font-semibold press"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
