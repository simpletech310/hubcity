"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isEnabled } from "@/lib/feature-flags";

/**
 * Minimal EN / ES toggle that persists to `profiles.preferred_language`.
 * Full next-intl wire-up (translated strings + `[locale]` segment) lands
 * in a follow-up pass — this surface unblocks the toggle UX so signups
 * can express the preference at onboarding and we can backfill bilingual
 * strings progressively.
 */
export default function LangToggle() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const [busy, setBusy] = useState(false);
  const enabled = isEnabled("spanish_enabled");

  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("profiles")
          .select("preferred_language")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.preferred_language === "es") setLang("es");
      } catch {
        // ignore
      }
    })();
  }, [enabled]);

  if (!enabled) return null;

  async function set(next: "en" | "es") {
    if (busy || lang === next) return;
    setBusy(true);
    setLang(next);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ preferred_language: next })
          .eq("id", user.id);
      }
      // Cookie hint for SSR layouts that want to honor the preference
      // without a Supabase round-trip.
      document.cookie = `culture-lang=${next}; path=/; max-age=31536000`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="inline-flex items-center"
      style={{ border: "2px solid var(--rule-strong-c)" }}
    >
      {(["en", "es"] as const).map((l) => {
        const on = l === lang;
        return (
          <button
            key={l}
            onClick={() => set(l)}
            className="press"
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: on ? "var(--gold-c)" : "var(--paper)",
              color: "var(--ink-strong)",
              borderRight:
                l === "en" ? "2px solid var(--rule-strong-c)" : "none",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
