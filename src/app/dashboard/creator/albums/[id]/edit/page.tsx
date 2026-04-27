"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import type { Album, AudioReleaseType, Track } from "@/types/database";

const RELEASE_TYPES: AudioReleaseType[] = [
  "single",
  "ep",
  "album",
  "mixtape",
];

interface TrackDraft {
  id: string;
  title: string;
  track_number: number;
  is_published: boolean;
  explicit: boolean;
  dirty: boolean;
}

/**
 * Creator-facing album edit form. Edits the album's metadata
 * (title, description, cover, release type, genre, release date,
 * is_published) plus the track listing on the album. Tracks have
 * inline editable fields for title, track_number, is_published,
 * explicit — pressing "Save Track" hits PATCH /api/tracks/[id].
 *
 * Mux upload + new track creation stays seed-script-only for v1.
 */
export default function EditAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseType, setReleaseType] = useState<AudioReleaseType>("album");
  const [coverArtUrl, setCoverArtUrl] = useState("");
  const [genreSlug, setGenreSlug] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const [tracks, setTracks] = useState<TrackDraft[]>([]);
  const [savingTrackId, setSavingTrackId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace(`/login?redirect=/dashboard/creator/albums/${id}/edit`);
        return;
      }
      const { data, error: alErr } = await supabase
        .from("albums")
        .select("*, tracks(*)")
        .eq("id", id)
        .single();
      if (alErr || !data) {
        setError("Album not found.");
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const isAdmin = profile?.role === "admin";
      const isCreator = data.creator_id === user.id;
      if (!isCreator && !isAdmin) {
        setError("You don't have permission to edit this album.");
        setLoading(false);
        return;
      }
      const a = data as Album & { tracks?: Track[] };
      setAlbum(a);
      setTitle(a.title);
      setDescription(a.description ?? "");
      setReleaseType(a.release_type);
      setCoverArtUrl(a.cover_art_url ?? "");
      setGenreSlug(a.genre_slug ?? "");
      setReleaseDate(a.release_date ?? "");
      setIsPublished(a.is_published);
      const sortedTracks = (a.tracks ?? [])
        .slice()
        .sort((x, y) => x.track_number - y.track_number);
      setTracks(
        sortedTracks.map((t) => ({
          id: t.id,
          title: t.title,
          track_number: t.track_number,
          is_published: t.is_published,
          explicit: t.explicit,
          dirty: false,
        })),
      );
      setLoading(false);
    })();
  }, [id, router, supabase]);

  function patchTrack(trackId: string, patch: Partial<TrackDraft>) {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...patch, dirty: true } : t)),
    );
  }

  async function handleSaveAlbum() {
    if (!album) return;
    setSaving(true);
    setError("");
    setSavedAt(null);
    try {
      const res = await fetch(`/api/albums/${album.id}`, {
        method: "PATCH",
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
      if (!res.ok) {
        setError(data.error ?? "Save failed");
      } else {
        setSavedAt(Date.now());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveTrack(trackId: string) {
    const t = tracks.find((x) => x.id === trackId);
    if (!t) return;
    setSavingTrackId(trackId);
    setError("");
    try {
      const res = await fetch(`/api/tracks/${trackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t.title.trim(),
          track_number: t.track_number,
          is_published: t.is_published,
          explicit: t.explicit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
      } else {
        patchTrack(trackId, { dirty: false });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingTrackId(null);
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="c-kicker" style={{ color: "var(--ink-mute)" }}>
          LOADING…
        </p>
      </div>
    );
  }
  if (!album) {
    return (
      <div className="px-5 py-10">
        <p className="c-card-t" style={{ color: "var(--ink-strong)" }}>
          {error}
        </p>
        <Link
          href="/dashboard/creator/albums"
          className="c-kicker mt-3 inline-block"
        >
          ← BACK TO ALBUMS
        </Link>
      </div>
    );
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
          Edit Album
        </h1>
      </div>

      <Card className="p-5 mb-4 space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
            placeholder="Notes on the release…"
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
            Published (visible on /frequency)
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
      {savedAt && (
        <div
          className="mb-4 px-4 py-3 rounded-lg"
          style={{
            background: "rgba(34,197,94,0.08)",
            color: "#0e7434",
            fontSize: 13,
          }}
        >
          Saved.
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-7">
        <Link
          href={`/frequency/album/${album.slug}`}
          className="c-kicker"
          style={{ color: "var(--ink-mute)" }}
        >
          VIEW PUBLIC →
        </Link>
        <Button onClick={handleSaveAlbum} disabled={saving}>
          {saving ? "SAVING…" : "SAVE ALBUM"}
        </Button>
      </div>

      <div className="mb-3">
        <p
          className="c-kicker"
          style={{ color: "var(--ink-mute)", fontSize: 11 }}
        >
          § TRACKS
        </p>
        <p
          className="c-serif-it"
          style={{ fontSize: 13, color: "var(--ink-mute)" }}
        >
          Edit per-track metadata. New tracks + audio uploads stay seeded
          via Mux scripts for now.
        </p>
      </div>

      {tracks.length === 0 ? (
        <Card className="p-4">
          <p
            className="c-serif-it"
            style={{ fontSize: 13, color: "var(--ink-mute)" }}
          >
            No tracks on this album yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {tracks.map((t) => (
            <Card key={t.id} className="p-4 space-y-3">
              <div className="flex gap-3 items-end">
                <div style={{ width: 60 }}>
                  <Input
                    label="#"
                    type="number"
                    value={t.track_number}
                    onChange={(e) =>
                      patchTrack(t.id, {
                        track_number: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    label="Title"
                    value={t.title}
                    onChange={(e) => patchTrack(t.id, { title: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.is_published}
                    onChange={(e) =>
                      patchTrack(t.id, { is_published: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-xs uppercase tracking-wider">
                    Published
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.explicit}
                    onChange={(e) =>
                      patchTrack(t.id, { explicit: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-xs uppercase tracking-wider">
                    Explicit
                  </span>
                </label>
                <Button
                  onClick={() => handleSaveTrack(t.id)}
                  disabled={!t.dirty || savingTrackId === t.id}
                >
                  {savingTrackId === t.id
                    ? "SAVING…"
                    : t.dirty
                      ? "SAVE TRACK"
                      : "SAVED"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
