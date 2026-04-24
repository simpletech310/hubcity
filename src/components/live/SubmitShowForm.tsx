"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  channels: { slug: string; name: string }[];
}

const inputStyle: React.CSSProperties = {
  background: "var(--paper-warm)",
  border: "2px solid var(--rule-strong-c)",
  color: "var(--ink-strong)",
  fontSize: 14,
  fontFamily: "var(--font-archivo), Archivo, sans-serif",
};

const labelClass = "block c-kicker mb-1.5";
const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "var(--ink-strong)",
  opacity: 0.7,
  letterSpacing: "0.14em",
};

export default function SubmitShowForm({ channels }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      show_title: formData.get("show_title"),
      tagline: formData.get("tagline"),
      channel_slug: formData.get("channel_slug"),
      format: formData.get("format"),
      synopsis: formData.get("synopsis"),
      pilot_video_url: formData.get("pilot_video_url"),
      social_links: {
        instagram: formData.get("instagram") || undefined,
        youtube: formData.get("youtube") || undefined,
      },
    };

    try {
      const res = await fetch("/api/shows/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(true);
      setTimeout(() => router.push("/live"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="p-6 text-center"
        style={{
          background: "var(--gold-c)",
          border: "3px solid var(--rule-strong-c)",
        }}
      >
        <h3
          className="c-hero mb-2"
          style={{ fontSize: 22, color: "var(--ink-strong)", lineHeight: 1 }}
        >
          PITCH SUBMITTED
        </h3>
        <p
          className="c-serif-it"
          style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.8 }}
        >
          We&apos;ll review it and be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelClass} style={labelStyle}>SHOW TITLE *</label>
        <input
          name="show_title"
          required
          maxLength={100}
          placeholder="e.g. Street Scholars"
          className="w-full px-4 py-3 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>TAGLINE</label>
        <input
          name="tagline"
          maxLength={120}
          placeholder="One short sentence"
          className="w-full px-4 py-3 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>WHICH CHANNEL FITS BEST?</label>
        <select
          name="channel_slug"
          className="w-full px-4 py-3 focus:outline-none"
          style={inputStyle}
          defaultValue=""
        >
          <option value="">-- Any / unsure --</option>
          {channels.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>FORMAT</label>
        <select
          name="format"
          className="w-full px-4 py-3 focus:outline-none"
          style={inputStyle}
          defaultValue=""
        >
          <option value="">-- Pick one --</option>
          <option value="episodic">Episodic series (23 min)</option>
          <option value="longform">Long form (51 min)</option>
          <option value="short">Short form (12 min)</option>
          <option value="docuseries">Docuseries</option>
          <option value="talk">Talk / interview</option>
          <option value="devotional">Devotional</option>
        </select>
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>SYNOPSIS *</label>
        <textarea
          name="synopsis"
          required
          rows={5}
          maxLength={2000}
          placeholder="What's the show about? Who is it for? What makes it different?"
          className="w-full px-4 py-3 focus:outline-none resize-none"
          style={{ ...inputStyle, fontFamily: "var(--font-fraunces), serif" }}
        />
      </div>

      <div>
        <label className={labelClass} style={labelStyle}>PILOT / SAMPLE VIDEO URL</label>
        <input
          name="pilot_video_url"
          type="url"
          placeholder="https://..."
          className="w-full px-4 py-3 focus:outline-none"
          style={inputStyle}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="instagram"
          placeholder="@instagram"
          className="px-4 py-3 focus:outline-none"
          style={inputStyle}
        />
        <input
          name="youtube"
          placeholder="youtube.com/@..."
          className="px-4 py-3 focus:outline-none"
          style={inputStyle}
        />
      </div>

      {error && (
        <div
          className="px-4 py-3"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--gold-c)",
            fontSize: 13,
            fontFamily: "var(--font-archivo-narrow), sans-serif",
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full c-btn c-btn-primary press disabled:opacity-50"
      >
        {submitting ? "SUBMITTING…" : "SUBMIT PITCH"}
      </button>
    </form>
  );
}
