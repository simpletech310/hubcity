"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/verify-address");
    router.refresh();
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col items-center justify-center px-6 culture-surface">
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

      <p className="c-kicker" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>§ JOIN</p>
      <h1 className="c-hero mt-1 mb-1" style={{ fontSize: 36, color: "var(--ink-strong)" }}>
        Join Culture.
      </h1>
      <p className="c-serif-it mb-8" style={{ fontSize: 14, color: "var(--ink-strong)", opacity: 0.7 }}>
        Connect with your Compton community.
      </p>

      <form onSubmit={handleSignup} className="w-full space-y-4">
        <Input
          label="Full Name"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
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
          placeholder="Create a password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
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
          {loading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
        </button>
      </form>

      <p className="c-serif-it mt-8" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--ink-strong)", textDecoration: "underline" }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}
