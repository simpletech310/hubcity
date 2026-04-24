"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import { useActiveCity } from "@/hooks/useActiveCity";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const activeCity = useActiveCity();

  // Only honor same-origin relative redirects to avoid open-redirect.
  const rawRedirect = searchParams.get("redirect");
  const redirectTo =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    });
  }

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <div
      className="max-w-[430px] mx-auto min-h-dvh flex flex-col items-center justify-center px-6 relative culture-surface"
    >
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center press"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
        }}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4L5 10l6 6" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-12 h-12 flex items-center justify-center c-hero"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontSize: 22,
          }}
        >
          K
        </div>
        <span className="c-hero" style={{ fontSize: 26, color: "var(--ink-strong)" }}>
          Knect
        </span>
      </div>

      <p className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>§ SIGN IN</p>
      <h1 className="c-hero mt-1 mb-1" style={{ fontSize: 36, color: "var(--ink-strong)" }}>
        Welcome Back.
      </h1>
      <p className="c-serif-it mb-8" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
        Sign in to your {activeCity?.name ?? "local"} community.
      </p>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div
            className="px-4 py-3 c-kicker"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
              fontSize: 12,
              letterSpacing: "0.12em",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="c-btn c-btn-primary w-full press disabled:opacity-50"
        >
          {loading ? "SIGNING IN…" : "SIGN IN"}
        </button>
      </form>

      <div className="w-full my-6 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--rule-strong-c)" }} />
        <span className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.5, fontSize: 10 }}>OR</span>
        <div className="flex-1 h-px" style={{ background: "var(--rule-strong-c)" }} />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="c-btn c-btn-outline w-full press"
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            fill="#4285F4"
          />
          <path
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            fill="#34A853"
          />
          <path
            d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            fill="#EA4335"
          />
        </svg>
        CONTINUE WITH GOOGLE
      </button>

      <p className="c-serif-it mt-8" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium" style={{ color: "var(--ink-strong)", textDecoration: "underline" }}>
          Sign Up
        </Link>
      </p>
    </div>
  );
}
