"use client";

import { useEffect, useState } from "react";

const PUBLIC_VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Drop-in CTA banner that prompts a user to enable Web Push. Hidden
 * when the browser already granted (subscribed) or denied. Subscribes
 * via PushManager + POSTs the result to /api/push/subscribe.
 *
 * Requires NEXT_PUBLIC_VAPID_PUBLIC_KEY in env. When missing, renders
 * nothing (silent no-op).
 */
export default function PushPermission() {
  const [state, setState] = useState<
    "checking" | "supported" | "subscribed" | "denied" | "unsupported"
  >("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      if (!PUBLIC_VAPID) {
        setState("unsupported");
        return;
      }
      if (typeof window === "undefined") return;
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        setState("unsupported");
        return;
      }
      const perm = Notification.permission;
      if (perm === "denied") {
        setState("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setState(sub ? "subscribed" : "supported");
      } catch {
        setState("supported");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          PUBLIC_VAPID,
        ) as unknown as BufferSource,
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Subscribe failed");
      }
      setState("subscribed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to enable push");
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported" || state === "subscribed") {
    return null;
  }

  return (
    <div
      className="p-4 mb-4"
      style={{
        background: "var(--paper-warm)",
        border: "2px solid var(--rule-strong-c)",
      }}
    >
      <p className="c-kicker" style={{ color: "var(--ink-mute)", fontSize: 11 }}>
        § HEADS UP
      </p>
      <p
        className="c-card-t mt-1"
        style={{ fontSize: 14, color: "var(--ink-strong)" }}
      >
        {state === "denied"
          ? "Notifications are blocked in your browser."
          : "Get notified when something fresh drops."}
      </p>
      <p
        className="c-serif-it mt-1"
        style={{ fontSize: 12, color: "var(--ink-mute)" }}
      >
        {state === "denied"
          ? "Re-enable in your browser settings to receive event reminders, follows, and broadcasts."
          : "We'll send a notification when an event you saved is starting, when someone follows you, and when ops sends a broadcast."}
      </p>
      {state === "supported" && (
        <button
          onClick={enable}
          disabled={busy}
          className="press mt-3 px-4 py-2"
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            background: "var(--ink-strong)",
            color: "var(--gold-c)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {busy ? "ENABLING…" : "ENABLE PUSH"}
        </button>
      )}
      {error && (
        <p
          className="text-xs mt-2"
          style={{ color: "var(--red-c, #E84855)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
