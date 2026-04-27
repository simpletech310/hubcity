"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import type { AudioReleaseType } from "@/types/database";

const RELEASE_TYPES: AudioReleaseType[] = [
  "single",
  "ep",
  "album",
  "mixtape",
];

/**
 * /dashboard/creator/albums/new — first-class album creation form for
 * creators. Tracks (audio uploads) are still seeded via Mux scripts; this
 * page covers the metadata shell + cover art so a creator can stage a
 * release before ops drops in the master files.
 */
export default function NewAlbumPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseType, setReleaseType] = useState<AudioReleaseType>("single");
  const [coverArtUrl, setCoverArtUrl] = useState("");
  const [genreSlug, setGenreSlug] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          release_type: releaseType,
          cover_art_url: coverArtUrl.trim() || null,
          genre_slug: genreSlug.trim() || null,
          release_date: releaseDate || null,
          is_published: isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.album?.id) {
        setError(data.error ?? "Failed to create album");
        setSaving(false);
        return;
      }
      router.replace(`/dashboard/creator/albums/${data.album.id}/edit`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create album");
      setSaving(false);
    }
  }

  return (
    <div className="px-5 pb-12 pt-6 mx-auto max-w-2xl">
      <div className="mb-5">
        <Link
          href="/dashboard/creator/albums"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          ← MY ALBUMS
        </Link>
        <h1
          className="c-hero mt-2"
          style={{ fontSize: 32, color: "var(--ink-strong)" }}
        >
          New Release
        </h1>
        <p
          className="c-serif-it mt-1"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Stage the metadata + cover art. Audio uploads are added next from
          the edit screen (seeded via Mux for v1).
        </p>
      </div>

      <Card className="p-5 mb-4 space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Westside Roots, Vol. 2"
        />
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--ink-mute)" }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border rounded-xl px-4 py-3 text-sm"
            style={{
              borderColor: "var(--rule-c)",
              background: "var(--paper)",
              color: "var(--ink-strong)",
            }}
            placeholder="What's the release about?"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--ink-mute)" }}
            >
              Release type
            </label>
            <select
              value={releaseType}
              onChange={(e) =>
                setReleaseType(e.target.value as AudioReleaseType)
              }
              className="w-full border rounded-xl px-4 py-3 text-sm"
              style={{
                borderColor: "var(--rule-c)",
                background: "var(--paper)",
                color: "var(--ink-strong)",
              }}
            >
              {RELEASE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Genre slug"
            value={genreSlug}
            onChange={(e) => setGenreSlug(e.target.value)}
            placeholder="hip-hop, r-b-soul, …"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Release date"
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
          <Input
            label="Cover art URL"
            value={coverArtUrl}
            onChange={(e) => setCoverArtUrl(e.target.value)}
            placeholder="https://…/cover.jpg"
          />
        </div>
        <label className="flex items-center justify-between gap-3 py-1.5">
          <span
            className="text-sm"
            style={{ color: "var(--ink-strong)" }}
          >
            Publish immediately (visible on /frequency)
          </span>
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-5 h-5"
          />
        </label>
      </Card>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(232,72,85,0.08)",
            color: "var(--red-c, #E84855)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link
          href="/dashboard/creator/albums"
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          CANCEL
        </Link>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? "CREATING…" : "CREATE & EDIT"}
        </Button>
      </div>
    </div>
  );
}
