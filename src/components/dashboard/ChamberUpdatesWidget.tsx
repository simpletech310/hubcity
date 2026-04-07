"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface ChamberUpdatePreview {
  id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
}

const categoryColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  event: "cyan",
  resource: "emerald",
  grant: "gold",
  networking: "purple",
  policy: "coral",
  general: "gold",
};

export default function ChamberUpdatesWidget() {
  const [updates, setUpdates] = useState<ChamberUpdatePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/api/chamber/updates");
        if (res.ok) {
          const data = await res.json();
          setUpdates((data.updates || []).slice(0, 3));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  if (loading || updates.length === 0) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-txt-secondary mb-3">
        Chamber Updates
      </h2>
      <div className="space-y-2">
        {updates.map((update) => (
          <Card key={update.id}>
            <div className="flex items-start gap-2">
              {update.is_pinned && <span className="text-xs"><Icon name="pin" size={14} /></span>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate">{update.title}</p>
                  <Badge
                    label={update.category}
                    variant={categoryColors[update.category] || "gold"}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-txt-secondary line-clamp-2">{update.body}</p>
                <p className="text-[10px] text-txt-secondary mt-1">
                  {new Date(update.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
