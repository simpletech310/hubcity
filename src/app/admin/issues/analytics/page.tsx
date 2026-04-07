"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import HCBarChart from "@/components/charts/HCBarChart";
import HCLineChart from "@/components/charts/HCLineChart";
import DonutChart from "@/components/charts/DonutChart";
import GaugeChart from "@/components/charts/GaugeChart";

interface Analytics {
  total: number;
  reported_30d: number;
  resolved_30d: number;
  open: number;
  avg_resolution_hours: number;
  sla_compliance_rate: number;
  sla_met: number;
  sla_missed: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_district: Record<string, number>;
  by_department: Record<string, number>;
  by_priority: Record<string, number>;
  weekly_trend: { week: string; reported: number; resolved: number }[];
  top_upvoted: { id: string; title: string; type: string; upvote_count: number; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  reported: "#F2A900",
  acknowledged: "#3B82F6",
  in_progress: "#8B5CF6",
  resolved: "#10B981",
  closed: "#6B7280",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "#6B7280",
  normal: "#3B82F6",
  high: "#F2A900",
  critical: "#FF6B6B",
};

const TYPE_LABELS: Record<string, string> = {
  pothole: "Pothole",
  streetlight: "Streetlight",
  graffiti: "Graffiti",
  trash: "Trash",
  flooding: "Flooding",
  parking: "Parking",
  noise: "Noise",
  sidewalk: "Sidewalk",
  tree: "Tree",
  parks: "Parks",
  water: "Water",
  stray: "Stray Animal",
  safety: "Safety",
  other: "Other",
};

export default function IssueAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/issues/analytics")
      .then((r) => r.json())
      .then((d) => setData(d.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-txt-secondary text-center py-4">
          Failed to load analytics.
        </p>
      </Card>
    );
  }

  // Prepare chart data
  const typeData = Object.entries(data.by_type)
    .map(([name, value]) => ({ name: TYPE_LABELS[name] || name, value }))
    .sort((a, b) => b.value - a.value);

  const statusData = Object.entries(data.by_status).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: STATUS_COLORS[name] || "#6B7280",
  }));

  const districtData = Object.entries(data.by_district)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const departmentData = Object.entries(data.by_department)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const priorityData = Object.entries(data.by_priority).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: PRIORITY_COLORS[name] || "#6B7280",
  }));

  const trendData = data.weekly_trend.map((w) => ({
    name: w.week,
    reported: w.reported,
    resolved: w.resolved,
    value: w.reported,
  }));

  function formatHours(h: number) {
    if (h < 24) return `${h}h`;
    const days = Math.round(h / 24);
    return `${days}d`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Issue Analytics</h1>
          <p className="text-sm text-txt-secondary">
            Trends, SLA compliance, and resolution metrics
          </p>
        </div>
        <Link
          href="/admin/issues"
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-border-subtle text-xs font-semibold text-txt-secondary hover:text-white transition-colors"
        >
          Manage Issues
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Issues", value: data.total, color: "#F2A900" },
          { label: "Open", value: data.open, color: "#FF6B6B" },
          { label: "Reported (30d)", value: data.reported_30d, color: "#3B82F6" },
          { label: "Resolved (30d)", value: data.resolved_30d, color: "#10B981" },
        ].map((s) => (
          <Card key={s.label} variant="glass-elevated" padding={false} className="p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-[11px] text-txt-secondary mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* SLA & Resolution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex flex-col items-center">
            <GaugeChart
              value={data.sla_compliance_rate}
              label="SLA Compliance"
              color={data.sla_compliance_rate >= 80 ? "#10B981" : data.sla_compliance_rate >= 60 ? "#F2A900" : "#FF6B6B"}
              size={160}
            />
            <div className="flex gap-4 mt-3 text-xs text-txt-secondary">
              <span className="text-emerald">{data.sla_met} met</span>
              <span className="text-coral">{data.sla_missed} missed</span>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            Avg Resolution Time
          </h3>
          <p className="text-3xl font-bold text-gold">
            {formatHours(data.avg_resolution_hours)}
          </p>
          <p className="text-xs text-txt-secondary mt-1">
            {data.avg_resolution_hours < 24
              ? "Under 24 hours"
              : `~${Math.round(data.avg_resolution_hours / 24)} days average`}
          </p>
        </Card>

        <Card>
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            Priority Breakdown
          </h3>
          <div className="flex justify-center">
            <DonutChart
              data={priorityData}
              centerValue={String(data.total)}
              centerLabel="Total"
              size={140}
            />
          </div>
        </Card>
      </div>

      {/* Weekly Trend */}
      <Card className="mb-6">
        <HCLineChart
          data={trendData}
          dataKeys={[
            { key: "reported", color: "#F2A900", label: "Reported" },
            { key: "resolved", color: "#10B981", label: "Resolved" },
          ]}
          title="Weekly Trend (12 weeks)"
          subtitle="Issues reported vs resolved"
          height={280}
        />
      </Card>

      {/* Type + Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <HCBarChart
            data={typeData}
            dataKeys={[{ key: "value", color: "#F2A900", label: "Issues" }]}
            layout="vertical"
            title="By Type"
            height={Math.max(200, typeData.length * 32)}
          />
        </Card>

        <Card>
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            By Status
          </h3>
          <div className="flex justify-center mb-4">
            <DonutChart
              data={statusData}
              centerValue={String(data.total)}
              centerLabel="Total"
              size={180}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-txt-secondary capitalize">{s.name}</span>
                <span className="font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* District + Department */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <HCBarChart
            data={districtData}
            dataKeys={[{ key: "value", color: "#3B82F6", label: "Issues" }]}
            title="By District"
            height={200}
          />
        </Card>

        <Card>
          <HCBarChart
            data={departmentData}
            dataKeys={[{ key: "value", color: "#8B5CF6", label: "Issues" }]}
            layout="vertical"
            title="By Department"
            height={Math.max(200, departmentData.length * 36)}
          />
        </Card>
      </div>

      {/* Top Upvoted Open Issues */}
      {data.top_upvoted.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
            Top Community-Flagged (Open)
          </h3>
          <div className="space-y-2">
            {data.top_upvoted.map((issue, i) => (
              <Link
                key={issue.id}
                href={`/city-hall/issues/${issue.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-gold font-bold text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{issue.title}</p>
                  <p className="text-xs text-txt-secondary capitalize">
                    {issue.type} · {issue.status.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-gold text-sm font-bold">
                  <Icon name="heart-pulse" size={14} />
                  {issue.upvote_count}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
