"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

interface SearchData {
  recent: Array<{ query: string; results_count: number; created_at: string }>;
  top_terms: Array<{ term: string; count: number }>;
  stats: { total: number; this_week: number };
}

export default function SearchAnalytics() {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/analytics/search");
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-txt-secondary text-center py-4">
          Failed to load search data
        </p>
      </Card>
    );
  }

  const maxCount = data.top_terms.length > 0 ? data.top_terms[0].count : 1;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border-subtle p-4">
          <p className="text-2xl font-bold text-gold">
            {data.stats.total.toLocaleString()}
          </p>
          <p className="text-xs font-semibold mt-1">Total Searches</p>
        </div>
        <div className="rounded-xl bg-card border border-border-subtle p-4">
          <p className="text-2xl font-bold text-cyan">
            {data.stats.this_week.toLocaleString()}
          </p>
          <p className="text-xs font-semibold mt-1">This Week</p>
        </div>
      </div>

      {/* Top Search Terms */}
      {data.top_terms.length > 0 && (
        <Card>
          <h3 className="text-sm font-bold mb-3">Top Search Terms (30 days)</h3>
          <div className="space-y-2">
            {data.top_terms.map((t, i) => (
              <div key={t.term} className="flex items-center gap-3">
                <span className="text-[10px] text-txt-secondary w-5 text-right">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium">{t.term}</span>
                    <span className="text-[10px] text-txt-secondary">
                      {t.count}x
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{ width: `${(t.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Searches */}
      {data.recent.length > 0 && (
        <Card>
          <h3 className="text-sm font-bold mb-3">Recent Searches</h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {data.recent.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/[0.03]"
              >
                <span className="text-xs font-medium">&quot;{s.query}&quot;</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-txt-secondary">
                    {s.results_count} results
                  </span>
                  <span className="text-[10px] text-txt-secondary">
                    {timeAgo(s.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {data.top_terms.length === 0 && data.recent.length === 0 && (
        <Card>
          <p className="text-sm text-txt-secondary text-center py-4">
            No search data yet. Searches will appear here as users use the AI search.
          </p>
        </Card>
      )}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
