"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import type { RelatedToLiveData, RelatedItem } from "@/lib/live/relatedToLive";

const KIND_ICON: Record<RelatedItem["kind"], IconName> = {
  event: "calendar",
  resource: "book",
  business: "store",
  promo: "tag",
  exhibit: "palette",
};

interface RelatedToLiveProps {
  /** Server-rendered rail for the video that was on-air at page load */
  initialData: RelatedToLiveData | null;
  /**
   * The video that's currently on-air, reported by LiveSimulatedPlayer.
   * When it changes we refetch the rail so it stays tied to what's playing.
   * `null` means an ad slot / no active content — we keep the last
   * rendered rail in place so it doesn't flash empty during commercials.
   */
  videoId: string | null;
}

export default function RelatedToLive({ initialData, videoId }: RelatedToLiveProps) {
  const [data, setData] = useState<RelatedToLiveData | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  // Remember which id the current `data` was fetched for, so we don't
  // re-fire for the same id (e.g. on re-render / remount).
  const loadedForRef = useRef<string | null>(initialData?.videoId ?? null);

  useEffect(() => {
    if (!videoId) return; // ad slot → keep last rail
    if (loadedForRef.current === videoId) return;

    const controller = new AbortController();
    setIsLoading(true);

    fetch(`/api/live/related?video_id=${encodeURIComponent(videoId)}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((body: { data: RelatedToLiveData | null }) => {
        loadedForRef.current = videoId;
        setData(body.data);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        // Keep the previous rail rather than flashing empty on a transient
        // network error — the next schedule change will retry.
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, [videoId]);

  if (!data || data.items.length === 0) return null;

  return (
    <section className="relative mb-8 -mt-2">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-1.5 h-4 shrink-0 transition-colors"
            style={{ background: data.accent }}
          />
          <div className="min-w-0">
            <p
              className="c-kicker truncate transition-colors"
              style={{ fontSize: 10, color: data.accent }}
            >
              BECAUSE YOU&apos;RE WATCHING
            </p>
            <h3 className="c-card-t truncate" style={{ fontSize: 15 }}>
              {data.headline}
            </h3>
          </div>
        </div>
        <span
          className="c-meta shrink-0 tabular-nums"
          style={{ color: "var(--ink-strong)", opacity: 0.5 }}
        >
          {isLoading ? "…" : data.items.length}
        </span>
      </div>

      {/* Horizontal rail */}
      <div
        className={`overflow-x-auto scrollbar-hide transition-opacity duration-200 ${
          isLoading ? "opacity-60" : "opacity-100"
        }`}
      >
        <div className="flex gap-2.5 px-5 pb-1">
          {data.items.map((item) => {
            const icon = KIND_ICON[item.kind];
            return (
              <Link
                key={item.id}
                href={item.href}
                className="shrink-0 w-[200px] press group transition-colors overflow-hidden relative"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--rule-strong-c)",
                  color: "var(--ink-strong)",
                }}
              >
                {/* Accent strip — gold foil bar */}
                <div
                  style={{ height: 3, background: data.accent }}
                />

                {/* Image or gradient placeholder — image canvas stays dark */}
                <div
                  className="relative aspect-[4/3] w-full overflow-hidden"
                  style={{ background: "var(--ink-strong)" }}
                >
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${data.accent}33, transparent 70%)`,
                      }}
                    >
                      <Icon name={icon} size={28} style={{ color: "var(--paper)", opacity: 0.4 }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Top-left chip */}
                  {item.chip && (
                    <span
                      className="absolute top-2 left-2 px-2 py-0.5 c-kicker"
                      style={{
                        fontSize: 9,
                        background: "var(--ink-strong)",
                        color: "var(--gold-c)",
                        border: "1.5px solid var(--paper)",
                      }}
                    >
                      {item.chip.label}
                    </span>
                  )}

                  {/* AD pill (top-right) */}
                  {item.isAd && (
                    <span
                      className="absolute top-2 right-2 px-1.5 py-0.5 c-kicker"
                      style={{
                        fontSize: 8,
                        background: "var(--paper)",
                        color: "var(--ink-strong)",
                        border: "1.5px solid var(--rule-strong-c)",
                      }}
                    >
                      AD
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="p-2.5">
                  <p className="c-card-t line-clamp-1" style={{ fontSize: 12 }}>
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="c-meta line-clamp-1 mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
