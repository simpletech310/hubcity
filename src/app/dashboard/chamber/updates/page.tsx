"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { ChamberUpdate } from "@/types/database";

const categoryColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  event: "cyan",
  resource: "emerald",
  grant: "gold",
  networking: "purple",
  policy: "coral",
  general: "gold",
};

export default function ChamberUpdatesPage() {
  const [updates, setUpdates] = useState<ChamberUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/api/chamber/updates");
        if (res.ok) {
          const data = await res.json();
          setUpdates(data.updates || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Chamber Updates</h1>
        <Link href="/dashboard/chamber/updates/new">
          <Button size="sm">+ New Update</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-2">📢</p>
          <p className="text-sm text-txt-secondary">No updates yet</p>
          <p className="text-xs text-txt-secondary mt-1">
            Post updates to keep businesses informed
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map((update) => {
            const authorRaw = update.author as unknown;
            const author = (Array.isArray(authorRaw) ? authorRaw[0] : authorRaw) as { display_name: string; avatar_url: string | null } | null;
            return (
              <Card key={update.id}>
                <div className="flex items-start gap-3">
                  {update.is_pinned && (
                    <span className="text-gold text-xs mt-0.5">📌</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{update.title}</p>
                      <Badge
                        label={update.category}
                        variant={categoryColors[update.category] || "gold"}
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-txt-secondary line-clamp-2">{update.body}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-txt-secondary">
                      <span>{author?.display_name || "Chamber"}</span>
                      <span>&middot;</span>
                      <span>{new Date(update.created_at).toLocaleDateString()}</span>
                      {update.target_business_types && (
                        <>
                          <span>&middot;</span>
                          <span>For: {update.target_business_types.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
