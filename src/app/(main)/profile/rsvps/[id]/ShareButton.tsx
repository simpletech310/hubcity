"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";

export default function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const fullUrl = `${window.location.origin}${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ url: fullUrl });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <button
      onClick={handleShare}
      className="c-btn c-btn-outline flex-1"
    >
      <Icon name="share" size={14} />
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
