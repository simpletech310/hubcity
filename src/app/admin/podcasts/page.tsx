"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { Podcast, Channel } from "@/types/database";

type PodcastWithChannel = Podcast & { channel?: Channel };

// ---------------------------------------------------------------------------
// Admin Podcasts Page
// ---------------------------------------------------------------------------

export default function AdminPodcastsPage() {
  const [podcasts, setPodcasts] = useState<PodcastWithChannel[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    channel_id: "",
    audio_url: "",
    thumbnail_url: "",
    duration: "",
    episode_number: "",
    season_number: "1",
    is_published: false,
  });

  useEffect(() => {
    fetchPodcasts();
    fetchChannels();
  }, []);

  async function fetchPodcasts() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("podcasts")
        .select("*, channel:channels(id, name, slug, avatar_url)")
        .order("created_at", { ascending: false });
      setPodcasts((data as PodcastWithChannel[]) ?? []);
    } catch {
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchChannels() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("channels")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setChannels((data as Channel[]) ?? []);
    } catch {
      // Channels will just be empty
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.audio_url || !form.channel_id) return;

    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description || null,
        channel_id: form.channel_id,
        audio_url: form.audio_url,
        thumbnail_url: form.thumbnail_url || null,
        duration: form.duration ? parseInt(form.duration, 10) : null,
        episode_number: form.episode_number
          ? parseInt(form.episode_number, 10)
          : null,
        season_number: parseInt(form.season_number, 10) || 1,
        is_published: form.is_published,
      };

      const res = await fetch("/api/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create podcast");
        return;
      }

      // Reset form and refresh
      setForm({
        title: "",
        description: "",
        channel_id: "",
        audio_url: "",
        thumbnail_url: "",
        duration: "",
        episode_number: "",
        season_number: "1",
        is_published: false,
      });
      setShowForm(false);
      fetchPodcasts();
    } catch {
      alert("Failed to create podcast");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(podcast: PodcastWithChannel) {
    setToggling(podcast.id);
    try {
      const res = await fetch(`/api/podcasts/${podcast.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !podcast.is_published }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update");
        return;
      }

      fetchPodcasts();
    } catch {
      alert("Failed to update podcast");
    } finally {
      setToggling(null);
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Podcasts</h1>
          <p className="text-sm text-txt-secondary">
            {podcasts.length} episode{podcasts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Episode"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <h2 className="font-heading font-bold text-lg mb-2">
              New Episode
            </h2>

            <Input
              label="Title *"
              placeholder="Episode title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                Description
              </label>
              <textarea
                placeholder="Episode description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                Channel *
              </label>
              <select
                value={form.channel_id}
                onChange={(e) =>
                  setForm({ ...form, channel_id: e.target.value })
                }
                required
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors"
              >
                <option value="">Select channel...</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Audio URL *"
              placeholder="https://..."
              type="url"
              value={form.audio_url}
              onChange={(e) =>
                setForm({ ...form, audio_url: e.target.value })
              }
              required
            />

            <Input
              label="Thumbnail URL"
              placeholder="https://..."
              type="url"
              value={form.thumbnail_url}
              onChange={(e) =>
                setForm({ ...form, thumbnail_url: e.target.value })
              }
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Duration (sec)"
                placeholder="300"
                type="number"
                value={form.duration}
                onChange={(e) =>
                  setForm({ ...form, duration: e.target.value })
                }
              />
              <Input
                label="Episode #"
                placeholder="1"
                type="number"
                value={form.episode_number}
                onChange={(e) =>
                  setForm({ ...form, episode_number: e.target.value })
                }
              />
              <Input
                label="Season #"
                placeholder="1"
                type="number"
                value={form.season_number}
                onChange={(e) =>
                  setForm({ ...form, season_number: e.target.value })
                }
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
                className="w-4 h-4 rounded bg-white/5 border border-border-subtle accent-gold"
              />
              <span className="text-sm text-txt-secondary">
                Publish immediately
              </span>
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={saving}>
                Create Episode
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Episode List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : podcasts.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <span className="text-3xl mb-3 block">🎙️</span>
            <p className="text-sm font-bold mb-1">No episodes yet</p>
            <p className="text-xs text-txt-secondary">
              Create your first podcast episode
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold truncate">
                      {podcast.title}
                    </h3>
                    {podcast.episode_number && (
                      <span className="text-[10px] text-txt-secondary font-mono shrink-0">
                        EP{podcast.episode_number}
                        {podcast.season_number > 1
                          ? ` / S${podcast.season_number}`
                          : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      label={podcast.channel?.name ?? "No Channel"}
                      variant="purple"
                    />
                    <span className="text-xs text-txt-secondary">
                      {formatDuration(podcast.duration)}
                    </span>
                    <span className="text-xs text-txt-secondary">
                      {podcast.listen_count} listens
                    </span>
                    {podcast.published_at && (
                      <span className="text-xs text-txt-secondary">
                        {new Date(podcast.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    label={podcast.is_published ? "Published" : "Draft"}
                    variant={podcast.is_published ? "emerald" : "gold"}
                  />
                  <Button
                    variant={podcast.is_published ? "outline" : "primary"}
                    size="sm"
                    loading={toggling === podcast.id}
                    onClick={() => handleTogglePublish(podcast)}
                  >
                    {podcast.is_published ? "Unpublish" : "Publish"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
