"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────

type CampaignType = "boost" | "featured";
type CampaignStatus = "draft" | "active" | "paused" | "ended";

interface Campaign {
  id: string;
  business_id: string;
  owner_id: string;
  type: CampaignType;
  status: CampaignStatus;
  title: string;
  budget_cents: number;
  spent_cents: number;
  start_date: string | null;
  end_date: string | null;
  target_city_id: string | null;
  impression_count: number;
  click_count: number;
  created_at: string;
}

interface City {
  id: string;
  name: string;
  state: string;
}

// ── Helpers ──────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusBadgeVariant(
  status: CampaignStatus
): "emerald" | "gold" | "coral" | "blue" {
  switch (status) {
    case "active":
      return "emerald";
    case "paused":
      return "gold";
    case "ended":
      return "coral";
    default:
      return "blue";
  }
}

function statusLabel(status: CampaignStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// ── Page ─────────────────────────────────────────────────

export default function AdsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<CampaignType>("boost");
  const [formTitle, setFormTitle] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formCity, setFormCity] = useState("");

  // ── Load data ──────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Resolve business
      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!biz) {
        setLoading(false);
        return;
      }
      setBusinessId(biz.id);

      // Fetch campaigns
      const { data: rows } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      setCampaigns((rows as Campaign[]) ?? []);

      // Fetch cities
      const { data: cityRows } = await supabase
        .from("cities")
        .select("id, name, state")
        .order("name");

      setCities((cityRows as City[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  // ── Toast helper ───────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Create campaign ────────────────────────────────────

  const handleCreate = useCallback(async () => {
    if (!formTitle || !formBudget || !businessId) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ad_campaigns")
        .insert({
          business_id: businessId,
          owner_id: user.id,
          type: formType,
          status: "draft",
          title: formTitle,
          budget_cents: Math.round(parseFloat(formBudget) * 100),
          start_date: formStart || null,
          end_date: formEnd || null,
          target_city_id: formCity || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCampaigns((prev) => [data as Campaign, ...prev]);

      // Reset form
      setFormTitle("");
      setFormBudget("");
      setFormStart("");
      setFormEnd("");
      setFormCity("");
      setFormType("boost");
      setShowCreate(false);
      showToast("Campaign created — it'll go live on your start date");
    } catch {
      showToast("Failed to create campaign. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [formTitle, formBudget, formStart, formEnd, formCity, formType, businessId, showToast]);

  // ── Update status ──────────────────────────────────────

  const updateStatus = useCallback(
    async (id: string, newStatus: CampaignStatus) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("ad_campaigns")
        .update({ status: newStatus })
        .eq("id", id);

      if (!error) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
        );
      }
    },
    []
  );

  // ── Delete ─────────────────────────────────────────────

  const deleteCampaign = useCallback(async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("ad_campaigns")
      .delete()
      .eq("id", id);

    if (!error) {
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  // ── Derived stats ──────────────────────────────────────

  const totalImpressions = campaigns.reduce(
    (sum, c) => sum + c.impression_count,
    0
  );
  const totalClicks = campaigns.reduce((sum, c) => sum + c.click_count, 0);
  const activeCount = campaigns.filter((c) => c.status === "active").length;

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="animate-fade-in px-5 pt-4 pb-24">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-surface-2 border border-border-subtle rounded-2xl px-4 py-3 text-sm text-white shadow-xl max-w-xs text-center">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-bold mb-1">Ads</h1>
          <p className="text-sm text-txt-secondary">Boost your reach</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Cancel" : "Create Campaign"}
        </Button>
      </div>

      {/* Stats row */}
      {campaigns.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatCard label="Impressions" value={totalImpressions.toLocaleString()} />
          <StatCard label="Clicks" value={totalClicks.toLocaleString()} />
          <StatCard label="Active" value={String(activeCount)} />
        </div>
      )}

      {/* Create Campaign panel */}
      {showCreate && (
        <Card className="mb-6">
          <h2 className="font-heading font-bold text-sm mb-4">New Campaign</h2>
          <div className="space-y-3">
            {/* Type toggle */}
            <div>
              <label className="text-[10px] text-txt-secondary mb-1.5 block">
                Campaign Type
              </label>
              <div className="flex gap-2">
                <TypePill
                  label="Boost Post"
                  active={formType === "boost"}
                  onClick={() => setFormType("boost")}
                />
                <TypePill
                  label="Featured Placement"
                  active={formType === "featured"}
                  onClick={() => setFormType("featured")}
                />
              </div>
            </div>

            {/* Campaign name */}
            <div>
              <label className="text-[10px] text-txt-secondary mb-1 block">
                Campaign Name
              </label>
              <input
                type="text"
                placeholder="e.g., Spring Sale Boost"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="text-[10px] text-txt-secondary mb-1 block">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-txt-secondary">
                  $
                </span>
                <input
                  type="number"
                  min={5}
                  step={1}
                  placeholder="25"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
            </div>

            {/* Target city */}
            <div>
              <label className="text-[10px] text-txt-secondary mb-1 block">
                Target City
              </label>
              <select
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
                className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/30 transition-colors appearance-none"
              >
                <option value="">All cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}, {city.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                onClick={handleCreate}
                loading={submitting}
                disabled={!formTitle || !formBudget}
                fullWidth
              >
                Launch Campaign
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCreate(false)}
                fullWidth
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      ) : campaigns.length === 0 && !showCreate ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="space-y-2">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onUpdateStatus={updateStatus}
              onDelete={deleteCampaign}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.04] border border-border-subtle rounded-2xl px-3 py-3 text-center">
      <p className="font-heading font-bold text-lg text-white leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-txt-secondary mt-0.5">{label}</p>
    </div>
  );
}

function TypePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 px-3 text-xs font-semibold border transition-all press
        ${
          active
            ? "bg-gold/15 border-gold/40 text-gold"
            : "bg-white/[0.04] border-border-subtle text-txt-secondary"
        }`}
    >
      {label}
    </button>
  );
}

function CampaignCard({
  campaign,
  onUpdateStatus,
  onDelete,
}: {
  campaign: Campaign;
  onUpdateStatus: (id: string, status: CampaignStatus) => void;
  onDelete: (id: string) => void;
}) {
  const ctr =
    campaign.impression_count > 0
      ? ((campaign.click_count / campaign.impression_count) * 100).toFixed(1) +
        "% CTR"
      : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Badge
              label={campaign.type === "boost" ? "Boost" : "Featured"}
              variant={campaign.type === "boost" ? "gold" : "cyan"}
            />
            <Badge
              label={statusLabel(campaign.status)}
              variant={statusBadgeVariant(campaign.status)}
            />
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-[13px] mb-1 truncate">
            {campaign.title}
          </h3>

          {/* Budget */}
          <p className="text-[11px] text-txt-secondary mb-1">
            {formatMoney(campaign.budget_cents)} budget ·{" "}
            {formatMoney(campaign.spent_cents)} spent
          </p>

          {/* Date range */}
          {(campaign.start_date || campaign.end_date) && (
            <p className="text-[11px] text-txt-secondary mb-1">
              {formatDate(campaign.start_date)} – {formatDate(campaign.end_date)}
            </p>
          )}

          {/* Stats */}
          <p className="text-[10px] text-txt-secondary/70">
            {campaign.impression_count.toLocaleString()} impressions ·{" "}
            {campaign.click_count.toLocaleString()} clicks
            {ctr && <span className="ml-1 text-gold/80">{ctr}</span>}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {campaign.status === "active" && (
            <button
              onClick={() => onUpdateStatus(campaign.id, "paused")}
              className="text-[10px] text-gold press"
            >
              Pause
            </button>
          )}
          {(campaign.status === "draft" || campaign.status === "paused") && (
            <button
              onClick={() => onUpdateStatus(campaign.id, "active")}
              className="text-[10px] text-emerald press"
            >
              Activate
            </button>
          )}
          {campaign.status === "draft" && (
            <button
              onClick={() => onDelete(campaign.id)}
              className="text-[10px] text-coral press"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
        <svg
          width="22"
          height="22"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-gold"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium mb-1">No campaigns yet</p>
      <p className="text-xs text-txt-secondary mb-4 max-w-xs mx-auto">
        Boost a post or get featured to reach more of the community
      </p>
      <Button size="sm" onClick={onCreate}>
        Create Campaign
      </Button>
    </div>
  );
}
