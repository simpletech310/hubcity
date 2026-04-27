"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Top-of-/creators search input. Submits to the same /creators page
 * with a `q` query param (server-side filter on display_name + handle).
 *
 * Debounced live updates so typing feels responsive without spamming
 * the server. Hitting Enter also forces an immediate navigation.
 */
export default function CreatorsSearchBar({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  // Debounced push to the URL. 300ms feels snappy without thrashing.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(sp?.toString() ?? "");
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/creators?${qs}` : "/creators", { scroll: false });
      });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams(sp?.toString() ?? "");
        const trimmed = value.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        const qs = params.toString();
        router.push(qs ? `/creators?${qs}` : "/creators", { scroll: false });
      }}
      className="relative"
      role="search"
    >
      <svg
        aria-hidden="true"
        className="absolute"
        style={{
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--ink-strong)",
          opacity: 0.55,
        }}
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        <circle cx="8.5" cy="8.5" r="5" />
        <path d="M12.5 12.5l4 4" />
      </svg>
      <input
        type="search"
        inputMode="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search creators by name or @handle"
        aria-label="Search creators"
        className="w-full"
        style={{
          padding: "10px 38px 10px 36px",
          background: "var(--paper)",
          border: "2px solid var(--rule-strong-c)",
          color: "var(--ink-strong)",
          fontFamily: "var(--font-body), Inter, sans-serif",
          fontSize: 13,
          outline: "none",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute press"
          style={{
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 24,
            height: 24,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--ink-strong)",
            color: "var(--paper)",
            border: "none",
            fontSize: 11,
            fontWeight: 800,
          }}
        >
          ×
        </button>
      )}
      {pending && (
        <span
          aria-hidden="true"
          className="absolute"
          style={{
            right: value ? 38 : 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 9,
            color: "var(--ink-strong)",
            opacity: 0.5,
            letterSpacing: "0.14em",
          }}
        >
          …
        </span>
      )}
    </form>
  );
}
