"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const INTEREST_TAGS = [
  "music",
  "sports",
  "food",
  "art",
  "events",
  "school",
  "youth",
  "faith",
  "fitness",
  "business",
  "civic",
  "culture",
];

interface SuggestedCreator {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
}

/**
 * /onboarding — 3-step first-run for new signups.
 * 1. Pick interests (drives feed personalization later).
 * 2. Follow 5 suggested creators.
 * 3. Set preferred language (the UX toggle is wired here for now;
 *    full i18n wiring rolls out in a follow-up pass).
 *
 * Persists to profiles.{interests, preferred_language, onboarded_at}
 * via /api/profile/onboarding-complete + /api/follows (existing).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [interests, setInterests] = useState<string[]>([]);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [suggested, setSuggested] = useState<SuggestedCreator[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirect=/onboarding");
        return;
      }
      // 5 verified or high-follower creators — best-effort "people to follow"
      const { data } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url, follower_count")
        .not("handle", "is", null)
        .eq("is_creator", true)
        .neq("id", user.id)
        .order("follower_count", { ascending: false })
        .limit(5);
      setSuggested(
        (data ?? []).map((p) => ({
          id: p.id,
          handle: p.handle as string,
          display_name: p.display_name as string,
          avatar_url: (p.avatar_url as string | null) ?? null,
        })),
      );
    })();
  }, [router, supabase]);

  function toggleInterest(tag: string) {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function toggleFollow(id: string) {
    const next = new Set(following);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFollowing(next);
    try {
      await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: id }),
      });
    } catch {
      // ignore — toggle remains optimistic
    }
  }

  async function finish() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/profile/onboarding-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          preferred_language: language,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to finish onboarding");
        setSubmitting(false);
        return;
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to finish onboarding");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--paper)" }}
    >
      <header
        className="px-5 pt-6 pb-3"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          § WELCOME · STEP {step} OF 3
        </p>
        <h1
          className="c-hero mt-1"
          style={{ fontSize: 36, color: "var(--ink-strong)" }}
        >
          {step === 1
            ? "What pulls you in?"
            : step === 2
              ? "Pick a few people to follow."
              : "How should we talk to you?"}
        </h1>
      </header>

      <div className="flex-1 px-5 py-6">
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {INTEREST_TAGS.map((tag) => {
              const on = interests.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className="press"
                  style={{
                    padding: "10px 16px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    background: on ? "var(--gold-c)" : "var(--paper)",
                    color: "var(--ink-strong)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 &&
          (suggested.length === 0 ? (
            <p
              className="c-serif-it"
              style={{ fontSize: 13, color: "var(--ink-mute)" }}
            >
              No creators to suggest yet. You can find folks to follow from
              the Creators page later.
            </p>
          ) : (
            <div className="space-y-2">
              {suggested.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden shrink-0"
                    style={{
                      background: "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.avatar_url}
                        alt={p.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="c-card-t line-clamp-1"
                      style={{ fontSize: 14, color: "var(--ink-strong)" }}
                    >
                      {p.display_name}
                    </p>
                    <p
                      className="c-meta"
                      style={{ color: "var(--ink-mute)" }}
                    >
                      @{p.handle}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFollow(p.id)}
                    className="press px-3 py-1.5"
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      background: following.has(p.id)
                        ? "var(--ink-strong)"
                        : "var(--gold-c)",
                      color: following.has(p.id)
                        ? "var(--gold-c)"
                        : "var(--ink-strong)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {following.has(p.id) ? "FOLLOWING" : "FOLLOW"}
                  </button>
                </div>
              ))}
            </div>
          ))}

        {step === 3 && (
          <div className="flex gap-3">
            {(["en", "es"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="press flex-1 p-5 text-left"
                style={{
                  background:
                    language === lang ? "var(--gold-c)" : "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                }}
              >
                <p
                  className="c-kicker"
                  style={{ color: "var(--ink-mute)", fontSize: 11 }}
                >
                  {lang === "en" ? "ENGLISH" : "ESPAÑOL"}
                </p>
                <p className="c-card-t mt-1" style={{ fontSize: 18 }}>
                  {lang === "en" ? "English." : "Español."}
                </p>
                <p
                  className="c-serif-it mt-1"
                  style={{ fontSize: 12, color: "var(--ink-mute)" }}
                >
                  {lang === "en"
                    ? "Default — full coverage today."
                    : "Rolling out across the app — preview level."}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          className="mx-5 mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <footer
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{ borderTop: "3px solid var(--rule-strong-c)" }}
      >
        {step > 1 ? (
          <button
            onClick={() => setStep((step - 1) as 1 | 2 | 3)}
            className="c-kicker"
            style={{ color: "var(--ink-mute)" }}
          >
            ← BACK
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button
            onClick={() => setStep((step + 1) as 1 | 2 | 3)}
            className="press px-4 py-2"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            CONTINUE →
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={submitting}
            className="press px-4 py-2"
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "var(--ink-strong)",
              color: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            {submitting ? "SAVING…" : "FINISH →"}
          </button>
        )}
      </footer>
    </div>
  );
}
