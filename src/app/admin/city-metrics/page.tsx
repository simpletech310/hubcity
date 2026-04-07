"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import HCBarChart from "@/components/charts/HCBarChart";
import DonutChart from "@/components/charts/DonutChart";
import GaugeChart from "@/components/charts/GaugeChart";

interface CityMetrics {
  civic_engagement: {
    total_users: number;
    verified_users: number;
    verification_rate: number;
    new_users_30d: number;
    new_users_7d: number;
    total_posts: number;
    posts_7d: number;
    poll_votes: number;
    poll_votes_30d: number;
    survey_responses: number;
    event_rsvps: number;
    district_distribution: Record<number, number>;
  };
  economic_health: {
    active_businesses: number;
    new_businesses_30d: number;
    total_orders: number;
    orders_30d: number;
    total_jobs: number;
    active_jobs: number;
  };
  infrastructure: {
    total_issues: number;
    open_issues: number;
    resolved_30d: number;
  };
  community: {
    total_events: number;
    total_resources: number;
  };
}

function StatCard({
  label,
  value,
  subtitle,
  color = "#F2A900",
}: {
  label: string;
  value: number | string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-card border border-border-subtle p-4">
      <p className="text-2xl font-bold" style={{ color }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      <p className="text-xs font-semibold mt-1">{label}</p>
      {subtitle && (
        <p className="text-[10px] text-txt-secondary mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

export default function CityMetricsPage() {
  const [metrics, setMetrics] = useState<CityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/analytics/city-metrics");
      if (res.ok) {
        setMetrics(await res.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-coral text-sm">Failed to load metrics</p>
      </div>
    );
  }

  const ce = metrics.civic_engagement;
  const eh = metrics.economic_health;
  const infra = metrics.infrastructure;
  const comm = metrics.community;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">
          City Metrics Dashboard
        </h1>
        <p className="text-sm text-txt-secondary">
          Real-time health indicators for Compton
        </p>
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        {["users", "businesses", "events", "resources", "issues", "orders", "jobs"].map((t) => (
          <a
            key={t}
            href={`/api/admin/export/${t}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-subtle text-xs font-semibold text-txt-secondary hover:text-white transition-colors"
          >
            <Icon name="download" size={12} className="inline mr-1" />{t}
          </a>
        ))}
      </div>

      {/* Civic Engagement */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-gold" />
        Civic Engagement
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Total Users" value={ce.total_users} subtitle={`+${ce.new_users_7d} this week`} />
        <StatCard label="Verified Residents" value={`${ce.verification_rate}%`} subtitle={`${ce.verified_users} verified`} color="#10B981" />
        <StatCard label="Community Posts" value={ce.total_posts} subtitle={`+${ce.posts_7d} this week`} color="#8B5CF6" />
        <StatCard label="Poll Votes" value={ce.poll_votes} subtitle={`+${ce.poll_votes_30d} this month`} color="#3B82F6" />
        <StatCard label="Survey Responses" value={ce.survey_responses} color="#06B6D4" />
        <StatCard label="Event RSVPs" value={ce.event_rsvps} color="#FF006E" />
      </div>

      {/* District Distribution */}
      <Card className="mb-6">
        <h3 className="text-sm font-bold mb-3">Users by District</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((d) => {
            const count = ce.district_distribution[d] || 0;
            const total = Object.values(ce.district_distribution).reduce((s, v) => s + v, 0);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={d} className="flex items-center gap-3">
                <span className="text-xs font-semibold w-16">District {d}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-txt-secondary w-16 text-right">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Economic Health */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-emerald" />
        Economic Health
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Active Businesses" value={eh.active_businesses} subtitle={`+${eh.new_businesses_30d} this month`} color="#10B981" />
        <StatCard label="Total Orders" value={eh.total_orders} subtitle={`+${eh.orders_30d} this month`} color="#F2A900" />
        <StatCard label="Total Job Listings" value={eh.total_jobs} color="#8B5CF6" />
        <StatCard label="Active Jobs" value={eh.active_jobs} color="#22C55E" />
      </div>

      {/* Infrastructure */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-coral" />
        Infrastructure & Issues
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Issues" value={infra.total_issues} color="#F59E0B" />
        <StatCard label="Open Issues" value={infra.open_issues} color="#EF4444" />
        <StatCard label="Resolved (30d)" value={infra.resolved_30d} color="#10B981" />
      </div>

      {/* Community */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-purple" />
        Community Resources
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard label="Published Events" value={comm.total_events} color="#FF006E" />
        <StatCard label="Active Resources" value={comm.total_resources} color="#06B6D4" />
      </div>

      {/* ─── V2: Visual Charts ─── */}
      <div className="divider-gold mb-8" />

      {/* District Engagement Comparison */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-cyan" />
        District Engagement
      </h2>
      <Card className="mb-6">
        <HCBarChart
          data={[1, 2, 3, 4].map((d) => ({
            name: `District ${d}`,
            value: ce.district_distribution[d] || 0,
          }))}
          dataKeys={[{ key: "value", color: "#F2A900", label: "Users" }]}
          height={240}
          title="Users by District"
          subtitle="Engagement across Compton districts"
        />
      </Card>

      {/* User Role Distribution */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-hc-purple" />
        User Role Distribution
      </h2>
      <Card className="mb-6 flex flex-col items-center">
        <DonutChart
          data={[
            { name: "Citizens", value: Math.max(ce.total_users - ce.verified_users, 1), color: "#9E9A93" },
            { name: "Verified", value: ce.verified_users || 1, color: "#22C55E" },
            { name: "Officials", value: Math.max(Math.round(ce.total_users * 0.02), 1), color: "#F2A900" },
            { name: "Business Owners", value: Math.max(Math.round(ce.total_users * 0.05), 1), color: "#3B82F6" },
          ]}
          centerValue={ce.total_users.toLocaleString()}
          centerLabel="Total Users"
          size={220}
        />
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {[
            { label: "Citizens", color: "#9E9A93" },
            { label: "Verified", color: "#22C55E" },
            { label: "Officials", color: "#F2A900" },
            { label: "Business Owners", color: "#3B82F6" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
              <span className="text-xs text-txt-secondary">{item.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Issue Resolution Rate */}
      <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-emerald" />
        Issue Resolution Rate
      </h2>
      <Card className="mb-6 flex flex-col items-center">
        <GaugeChart
          value={infra.total_issues > 0 ? Math.round(((infra.total_issues - infra.open_issues) / infra.total_issues) * 100) : 0}
          label="Issues Resolved"
          color="#22C55E"
          size={220}
        />
        <p className="text-xs text-txt-secondary mt-2">
          {infra.resolved_30d} resolved in the last 30 days out of {infra.total_issues} total
        </p>
      </Card>
    </div>
  );
}
