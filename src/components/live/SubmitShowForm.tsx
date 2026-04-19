"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  channels: { slug: string; name: string }[];
}

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
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-6 text-center">
        <h3 className="font-heading font-bold text-lg mb-2">Pitch submitted!</h3>
        <p className="text-sm text-txt-secondary">We&apos;ll review it and be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold mb-1.5">Show title *</label>
        <input
          name="show_title"
          required
          maxLength={100}
          placeholder="e.g. Street Scholars"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-1.5">Tagline</label>
        <input
          name="tagline"
          maxLength={120}
          placeholder="One short sentence"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-1.5">Which channel fits best?</label>
        <select
          name="channel_slug"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
          defaultValue=""
        >
          <option value="">-- Any / unsure --</option>
          {channels.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-1.5">Format</label>
        <select
          name="format"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
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
        <label className="block text-[12px] font-semibold mb-1.5">Synopsis *</label>
        <textarea
          name="synopsis"
          required
          rows={5}
          maxLength={2000}
          placeholder="What's the show about? Who is it for? What makes it different?"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50 resize-none"
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold mb-1.5">Pilot / sample video URL</label>
        <input
          name="pilot_video_url"
          type="url"
          placeholder="https://..."
          className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          name="instagram"
          placeholder="@instagram"
          className="px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
        />
        <input
          name="youtube"
          placeholder="youtube.com/@..."
          className="px-4 py-3 rounded-xl bg-white/[0.06] border border-border-subtle text-sm focus:outline-none focus:border-gold/50"
        />
      </div>

      {error && (
        <p className="text-sm text-compton-red">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3.5 rounded-xl bg-gold text-midnight font-heading text-[14px] font-bold press shadow-lg shadow-gold/20 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Pitch"}
      </button>
    </form>
  );
}
