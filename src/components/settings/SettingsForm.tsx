"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Card from "@/components/ui/Card";

interface NotificationPrefs {
  events: boolean;
  resources: boolean;
  district: boolean;
  system: boolean;
}

interface Props {
  initialPrefs: NotificationPrefs;
  role?: string | null;
}

const prefItems: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: "events", label: "Events", description: "New events in your area" },
  { key: "resources", label: "Resources", description: "Grants & programs matching your profile" },
  { key: "district", label: "District Updates", description: "News from your district rep" },
  { key: "system", label: "System", description: "App updates & announcements" },
];

export default function SettingsForm({ initialPrefs, role }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [saving, setSaving] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  async function becomeProvider() {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/auth/become-provider", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setUpgradeError(data.error || "Failed to upgrade");
        return;
      }
      router.push("/dashboard/resources/new");
      router.refresh();
    } catch {
      setUpgradeError("Something went wrong");
    } finally {
      setUpgrading(false);
    }
  }

  const isProvider = role === "resource_provider";
  const canUpgrade = role === "citizen" || role == null;

  const toggle = useCallback(
    async (key: keyof NotificationPrefs) => {
      const prev = prefs[key];
      const updated = { ...prefs, [key]: !prev };

      // Optimistic update
      setPrefs(updated);
      setSaving(key);

      try {
        const res = await fetch("/api/profile/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notification_prefs: updated }),
        });

        if (!res.ok) throw new Error("Failed to save");
      } catch {
        // Revert on failure
        setPrefs((p) => ({ ...p, [key]: prev }));
      } finally {
        setSaving(null);
      }
    },
    [prefs]
  );

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gold text-sm font-semibold px-5 pt-4 mb-3 press"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Back
      </button>

      <div className="px-5">
        <h1 className="font-heading text-2xl font-bold mb-1" style={{ color: "var(--ink-strong)" }}>Settings</h1>
        <p className="text-sm mb-5" style={{ color: "var(--ink-mute)" }}>
          Manage your notification preferences
        </p>

        <h2 className="font-heading font-semibold text-base mb-3" style={{ color: "var(--ink-strong)" }}>
          Notifications
        </h2>
        <div className="space-y-2 mb-6">
          {prefItems.map((item) => (
            <Card key={item.key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--ink-mute)" }}>{item.description}</p>
                </div>
                <button
                  onClick={() => toggle(item.key)}
                  disabled={saving === item.key}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    prefs[item.key] ? "bg-gold" : "bg-white/10"
                  } ${saving === item.key ? "opacity-50" : ""}`}
                  aria-label={`Toggle ${item.label}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      prefs[item.key] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="font-heading font-semibold text-base mb-3" style={{ color: "var(--ink-strong)" }}>
          For Organizations
        </h2>
        <Card className="mb-6">
          {isProvider ? (
            <div>
              <p className="text-sm font-medium">You&rsquo;re a resource provider</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-mute)" }}>
                Manage your posts and applicants from the dashboard.
              </p>
              <Link
                href="/dashboard/resources"
                className="inline-block mt-3 text-sm font-semibold text-gold press"
              >
                Open dashboard →
              </Link>
            </div>
          ) : canUpgrade ? (
            <div>
              <p className="text-sm font-medium">Become a resource provider</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-mute)" }}>
                Post housing, jobs, food, youth programs and more — and review applicants.
              </p>
              {upgradeError && (
                <p className="text-xs mt-2" style={{ color: "var(--coral, #c0392b)" }}>
                  {upgradeError}
                </p>
              )}
              <button
                type="button"
                onClick={becomeProvider}
                disabled={upgrading}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold press disabled:opacity-50"
              >
                {upgrading ? "Upgrading…" : "Upgrade my account →"}
              </button>
              <p className="text-[11px] mt-2" style={{ color: "var(--ink-mute)" }}>
                Or{" "}
                <Link href="/resources/provider" className="underline">
                  learn more
                </Link>{" "}
                first.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">Resource posting</p>
              <p className="text-xs mt-1" style={{ color: "var(--ink-mute)" }}>
                Your account already has resource-management access via your role.
              </p>
              <Link
                href="/dashboard/resources"
                className="inline-block mt-3 text-sm font-semibold text-gold press"
              >
                Open dashboard →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
