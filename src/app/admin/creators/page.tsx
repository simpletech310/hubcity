"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Chip from "@/components/ui/Chip";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import CreatorBadge from "@/components/creators/CreatorBadge";
import { createClient } from "@/lib/supabase/client";

type ApplicationStatus = "pending" | "approved" | "rejected";
type CreatorTier = "starter" | "rising" | "partner" | "premium";

interface CreatorApplication {
  id: string;
  user_id: string;
  channel_name: string;
  content_type: "video" | "podcast" | "both";
  description: string;
  portfolio_url: string | null;
  social_links: {
    instagram: string | null;
    youtube: string | null;
    tiktok: string | null;
  } | null;
  status: ApplicationStatus;
  creator_tier: CreatorTier | null;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  applicant: {
    id: string;
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
  } | null;
}

const STATUS_FILTERS: { label: string; value: ApplicationStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function AdminCreatorsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Auth guard — only admins / city officials can access this page
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/admin/creators");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
        router.push("/");
        return;
      }
      setAuthorized(true);
    });
  }, [router]);

  // Reset admin notes when switching between expanded applications
  useEffect(() => {
    setAdminNotes("");
  }, [expandedId]);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, activeMonth: 0 });

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/creators?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch creator applications:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/creators/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "approved" : "rejected",
          admin_notes: adminNotes || null,
        }),
      });
      if (res.ok) {
        setExpandedId(null);
        setAdminNotes("");
        fetchApplications();
      }
    } catch (err) {
      console.error(`Failed to ${action} application:`, err);
    } finally {
      setActionLoading(null);
    }
  }

  const contentTypeBadge = (type: string) => {
    switch (type) {
      case "video":
        return <Badge label="Video" variant="blue" icon={<Icon name="video" size={10} />} />;
      case "podcast":
        return <Badge label="Podcast" variant="purple" icon={<Icon name="podcast" size={10} />} />;
      case "both":
        return <Badge label="Video & Podcast" variant="gold" icon={<Icon name="film" size={10} />} />;
      default:
        return <Badge label={type} variant="blue" />;
    }
  };

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Creator Management</h1>
        <p className="text-sm text-txt-secondary">
          Manage creator applications and the Compton Creator Program
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {([
          { label: "Total Creators", value: stats.total, color: "#F2A900", iconName: "film" as IconName },
          { label: "Pending Apps", value: stats.pending, color: "#FF6B6B", iconName: "document" as IconName },
          { label: "Active This Month", value: stats.activeMonth, color: "#22C55E", iconName: "trending" as IconName },
        ]).map((stat) => (
          <Card key={stat.label} variant="glass" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: stat.color }} />
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}12` }}
              >
                <Icon name={stat.iconName} size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="font-heading font-bold text-xl" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <p className="text-[9px] text-txt-secondary font-semibold uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={filter === f.value}
            onClick={() => setFilter(f.value)}
          />
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-3 bg-white/5 rounded w-1/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app.id}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                {app.applicant?.avatar_url ? (
                  <img
                    src={app.applicant.avatar_url}
                    alt={app.applicant.display_name}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-midnight font-heading font-bold text-sm shrink-0">
                    {(app.applicant?.display_name || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-heading font-bold text-sm">
                      {app.applicant?.display_name || "Unknown User"}
                    </p>
                    <span className="text-[10px] text-txt-secondary">
                      {app.applicant?.handle || ""}
                    </span>
                    {app.status === "approved" && app.creator_tier && (
                      <CreatorBadge tier={app.creator_tier} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold text-gold">{app.channel_name}</span>
                    {contentTypeBadge(app.content_type)}
                  </div>

                  <p className="text-[11px] text-txt-secondary line-clamp-2 mb-2">
                    {app.description}
                  </p>

                  {app.portfolio_url && (
                    <a
                      href={app.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-hc-blue hover:underline inline-block mb-2"
                    >
                      {app.portfolio_url}
                    </a>
                  )}

                  {/* Social links */}
                  {app.social_links && (
                    <div className="flex items-center gap-3 mb-2">
                      {app.social_links.instagram && (
                        <span className="text-[10px] text-txt-secondary flex items-center gap-0.5"><Icon name="camera" size={10} /> {app.social_links.instagram}</span>
                      )}
                      {app.social_links.youtube && (
                        <span className="text-[10px] text-txt-secondary flex items-center gap-0.5"><Icon name="video" size={10} /> {app.social_links.youtube}</span>
                      )}
                      {app.social_links.tiktok && (
                        <span className="text-[10px] text-txt-secondary flex items-center gap-0.5"><Icon name="music" size={10} /> {app.social_links.tiktok}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-txt-secondary">
                    <span>Applied {timeAgo(app.created_at)}</span>
                    {app.reviewed_at && (
                      <>
                        <span className="text-white/20">|</span>
                        <span>
                          {app.status === "approved" ? "Approved" : "Rejected"}{" "}
                          {timeAgo(app.reviewed_at)}
                        </span>
                      </>
                    )}
                  </div>

                  {app.admin_notes && (
                    <div className="mt-2 rounded-lg bg-white/[0.03] border border-border-subtle px-3 py-2">
                      <p className="text-[10px] text-txt-secondary">
                        <span className="font-semibold text-white">Admin notes:</span> {app.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Inline action form */}
                  {app.status === "pending" && expandedId === app.id && (
                    <div className="mt-3 pt-3 border-t border-border-subtle">
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Admin notes (optional)"
                        rows={2}
                        className="w-full bg-white/[0.06] border border-border-subtle rounded-xl px-3 py-2 text-xs text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/40 transition-colors resize-none mb-2"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAction(app.id, "approve")}
                          loading={actionLoading === app.id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleAction(app.id, "reject")}
                          loading={actionLoading === app.id}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExpandedId(null);
                            setAdminNotes("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons (pending only) */}
                {app.status === "pending" && expandedId !== app.id && (
                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExpandedId(app.id);
                        setAdminNotes("");
                      }}
                    >
                      Review
                    </Button>
                  </div>
                )}

                {/* Status badge for non-pending */}
                {app.status !== "pending" && (
                  <div className="shrink-0">
                    <Badge
                      label={app.status}
                      variant={app.status === "approved" ? "emerald" : "coral"}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}

          {applications.length === 0 && (
            <div className="text-center py-12">
              <p className="mb-3"><Icon name="film" size={36} className="text-txt-secondary" /></p>
              <p className="text-sm text-txt-secondary">
                {filter === "pending"
                  ? "No pending applications"
                  : `No ${filter} applications`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
