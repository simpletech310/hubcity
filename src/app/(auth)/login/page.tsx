"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh bg-midnight flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center font-heading font-extrabold text-xl text-midnight">
          HC
        </div>
        <span className="font-heading font-bold text-2xl tracking-tight">
          K<span className="text-gold">nect</span>
        </span>
      </div>

      <h1 className="font-heading text-2xl font-bold mb-2">Welcome Back</h1>
      <p className="text-txt-secondary text-sm mb-8">
        Sign in to your Compton community
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
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Sign In
        </Button>
      </form>

      <div className="w-full my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-txt-secondary">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={handleGoogleLogin}
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
        Continue with Google
      </Button>

      <p className="text-sm text-txt-secondary mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-gold font-medium">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
