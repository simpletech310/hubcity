"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import type { FeaturedKind } from "@/lib/featured-media";

type Tab = FeaturedKind;

const TABS: { value: Tab; label: string }[] = [
  { value: "reel", label: "Reels" },
  { value: "video", label: "Channel Videos" },
  { value: "post", label: "Posts" },
  { value: "track", label: "Tracks" },
  { value: "exhibit", label: "Gallery" },
];

interface PinRow {
  id: string;
  thumb: string | null;
  title: string;
  meta?: string | null;
  kind: FeaturedKind;
}

interface Pinned {
  kind: FeaturedKind | null;
  id: string | null;
  caption: string | null;
}

export default function FeaturedDashboardPage() {
  const [tab, setTab] = useState<Tab>("reel");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PinRow[]>([]);
  const [pinned, setPinned] = useState<Pinned>({ kind: null, id: null, caption: null });
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Load current pinned slot from profiles
  useEffect(() => {
    async function loadPinned() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("featured_kind, featured_id, featured_caption")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setPinned({
          kind: (data.featured_kind ?? null) as FeaturedKind | null,
          id: (data.featured_id ?? null) as string | null,
          caption: (data.featured_caption ?? null) as string | null,
        });
      }
    }
    loadPinned();
  }, [supabase]);

  // Load eligible rows for the active tab
  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRows([]);
        return;
      }
      const out: PinRow[] = [];
      switch (tab) {
        case "reel": {
          const { data } = await supabase
            .from("reels")
            .select("id, caption, poster_url, created_at, is_published")
            .eq("author_id", user.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(50);
          for (const r of (data ?? []) as Array<{
            id: string;
            caption: string | null;
            poster_url: string | null;
          }>) {
            out.push({
              id: r.id,
              thumb: r.poster_url,
              title: r.caption || "Untitled reel",
              kind: "reel",
            });
          }
          break;
        }
        case "video": {
          const { data: chans } = await supabase
            .from("channels")
            .select("id")
            .eq("owner_id", user.id);
          const channelIds = (chans ?? []).map((c) => c.id as string);
          if (channelIds.length === 0) break;
          const { data } = await supabase
            .from("channel_videos")
            .select("id, title, thumbnail_url, mux_playback_id, channel_id, is_published, status")
            .in("channel_id", channelIds)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(50);
          for (const v of (data ?? []) as Array<{
            id: string;
            title: string;
            thumbnail_url: string | null;
            mux_playback_id: string | null;
          }>) {
            const thumb =
              v.thumbnail_url ??
              (v.mux_playback_id
                ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=240&height=135&time=5`
                : null);
            out.push({ id: v.id, thumb, title: v.title, kind: "video" });
          }
          break;
        }
        case "post": {
          const { data } = await supabase
            .from("posts")
            .select("id, body, image_url, created_at, is_published")
            .eq("author_id", user.id)
            .eq("is_published", true)
            .not("image_url", "is", null)
            .order("created_at", { ascending: false })
            .limit(50);
          for (const p of (data ?? []) as Array<{
            id: string;
            body: string | null;
            image_url: string | null;
          }>) {
            out.push({
              id: p.id,
              thumb: p.image_url,
              title: (p.body ?? "").slice(0, 60) || "Untitled post",
              kind: "post",
            });
          }
          break;
        }
        case "track": {
          const { data } = await supabase
            .from("tracks")
            .select("id, title, mux_playback_id, is_published, album:albums(title, cover_art_url)")
            .eq("creator_id", user.id)
            .eq("is_published", true)
            .order("created_at", { ascending: false })
            .limit(50);
          for (const t of (data ?? []) as Array<{
            id: string;
            title: string;
            album:
              | { title: string | null; cover_art_url: string | null }
              | { title: string | null; cover_art_url: string | null }[]
              | null;
          }>) {
            const album = Array.isArray(t.album) ? t.album[0] : t.album;
            out.push({
              id: t.id,
              thumb: album?.cover_art_url ?? null,
              title: t.title,
              meta: album?.title ?? null,
              kind: "track",
            });
          }
          break;
        }
        case "exhibit": {
          const { data } = await supabase
            .from("profile_gallery_images")
            .select("id, image_url, caption, display_order")
            .eq("owner_id", user.id)
            .order("display_order", { ascending: true })
            .limit(50);
          for (const g of (data ?? []) as Array<{
            id: string;
            image_url: string;
            caption: string | null;
          }>) {
            out.push({
              id: g.id,
              thumb: g.image_url,
              title: g.caption || "Gallery image",
              kind: "exhibit",
            });
          }
          break;
        }
      }
      setRows(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [supabase, tab]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  async function pin(row: PinRow) {
    setPinningId(row.id);
    setError(null);
    try {
      const res = await fetch("/api/profile/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: row.kind, id: row.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to pin");
        return;
      }
      setPinned({ kind: row.kind, id: row.id, caption: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pin");
    } finally {
      setPinningId(null);
    }
  }

  async function clearPin() {
    setPinningId("__clear");
    setError(null);
    try {
      const res = await fetch("/api/profile/featured", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to clear");
        return;
      }
      setPinned({ kind: null, id: null, caption: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setPinningId(null);
    }
  }

  return (
    <div className="px-4 py-5 pb-20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-bold mb-1">Featured Media</h1>
          <p className="text-sm text-txt-secondary">
            Pin one piece of your work to spotlight on Discover and your profile.
          </p>
        </div>
        <Link href="/dashboard/creator" className="text-xs text-gold font-semibold press">
          ← Creator
        </Link>
      </div>

      {/* Now Featuring */}
      <Card className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary mb-2">
          Now Featuring
        </p>
        {pinned.kind && pinned.id ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: "var(--gold-c)", color: "#000" }}
              >
                {pinned.kind}
              </span>
              <span className="text-xs text-txt-secondary truncate">
                {pinned.id}
              </span>
            </div>
            <button
              type="button"
              onClick={clearPin}
              disabled={pinningId === "__clear"}
              className="text-xs text-coral font-semibold press disabled:opacity-50"
            >
              {pinningId === "__clear" ? "Clearing…" : "Clear"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-txt-secondary">
            Nothing pinned. Pick something below.
          </p>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className="shrink-0 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide press"
              style={{
                background: active ? "var(--gold-c)" : "var(--card)",
                color: active ? "#000" : "var(--ink-strong, #fff)",
                border: `2px solid ${active ? "var(--gold-c)" : "var(--rule-strong-c, rgba(255,255,255,0.18))"}`,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <Card className="mb-3 bg-coral/10 border-coral/20">
          <p className="text-sm text-coral">{error}</p>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-txt-secondary">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-txt-secondary">
            No {tab}s yet. Upload some via the dashboard, then come back here to pin one.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => {
            const isPinned = pinned.kind === row.kind && pinned.id === row.id;
            return (
              <Card key={row.id} className="flex items-center gap-3">
                <div
                  className="w-14 h-14 shrink-0 overflow-hidden"
                  style={{ background: "var(--ink-strong)", border: "2px solid var(--rule-strong-c)" }}
                >
                  {row.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.thumb} alt={row.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: "var(--gold-c)" }}>
                      <Icon name="frame" size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{row.title}</p>
                  {row.meta && (
                    <p className="text-[11px] text-txt-secondary truncate mt-0.5">{row.meta}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {isPinned ? (
                    <span
                      className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: "var(--gold-c)", color: "#000" }}
                    >
                      Pinned
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => pin(row)}
                      loading={pinningId === row.id}
                    >
                      Pin
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
