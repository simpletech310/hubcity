"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { LoyaltyReward } from "@/types/database";

interface LoyaltyStats {
  total_points_earned: number;
  total_points_redeemed: number;
  unique_loyalty_customers: number;
  active_rewards: number;
}

export default function LoyaltyDashboardPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, rewardsRes] = await Promise.all([
        fetch("/api/dashboard/loyalty/stats"),
        fetch("/api/dashboard/loyalty/rewards"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Loyalty Program</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New Reward
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-heading font-bold text-gold">
              {stats.total_points_earned.toLocaleString()}
            </p>
            <p className="text-[10px] text-txt-secondary mt-0.5">Points Earned</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-heading font-bold text-emerald">
              {stats.total_points_redeemed.toLocaleString()}
            </p>
            <p className="text-[10px] text-txt-secondary mt-0.5">Points Redeemed</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-heading font-bold text-cyan">
              {stats.unique_loyalty_customers}
            </p>
            <p className="text-[10px] text-txt-secondary mt-0.5">Loyalty Members</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-heading font-bold text-hc-purple">
              {stats.active_rewards}
            </p>
            <p className="text-[10px] text-txt-secondary mt-0.5">Active Rewards</p>
          </Card>
        </div>
      )}

      {/* How It Works */}
      <Card>
        <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-2">
          How It Works
        </h3>
        <div className="space-y-2 text-xs text-txt-secondary">
          <p>Customers earn <span className="text-gold font-semibold">10 points per $1</span> spent at your business.</p>
          <p>Points can be redeemed for rewards you create below.</p>
          <p>Daily earn cap: <span className="text-gold font-semibold">500 points</span> per customer.</p>
          <p>Default: <span className="text-gold font-semibold">300 points = $2</span> discount.</p>
        </div>
      </Card>

      {/* Create Reward Form */}
      {showCreate && (
        <CreateRewardForm
          onCreated={() => {
            setShowCreate(false);
            fetchData();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Rewards List */}
      <div>
        <h2 className="text-sm font-semibold text-txt-secondary mb-3">
          Your Rewards
        </h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-3xl mb-2">🎁</p>
            <p className="text-sm text-txt-secondary">No rewards created yet</p>
            <p className="text-xs text-txt-secondary mt-1">
              Create rewards to incentivize repeat customers
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} onUpdate={fetchData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RewardCard({ reward, onUpdate }: { reward: LoyaltyReward; onUpdate: () => void }) {
  const [toggling, setToggling] = useState(false);

  const rewardLabel =
    reward.reward_type === "discount_fixed"
      ? `$${(reward.reward_value / 100).toFixed(2)} off`
      : reward.reward_type === "discount_percent"
      ? `${reward.reward_value}% off`
      : reward.reward_type === "free_item"
      ? "Free item"
      : "Custom reward";

  async function toggleActive() {
    setToggling(true);
    try {
      await fetch(`/api/dashboard/loyalty/rewards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reward, is_active: !reward.is_active }),
      });
      onUpdate();
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">{reward.name}</p>
            <Badge
              label={reward.is_active ? "Active" : "Inactive"}
              variant={reward.is_active ? "emerald" : "coral"}
              size="sm"
            />
          </div>
          {reward.description && (
            <p className="text-xs text-txt-secondary mb-1">{reward.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-gold font-semibold">{reward.points_required} pts</span>
            <span className="text-emerald">{rewardLabel}</span>
            {reward.max_redemptions_per_user > 0 && (
              <span className="text-txt-secondary">
                Max {reward.max_redemptions_per_user}/person
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleActive}
          disabled={toggling}
          className="text-xs text-txt-secondary hover:text-white transition-colors px-2 py-1"
        >
          {toggling ? "..." : reward.is_active ? "Disable" : "Enable"}
        </button>
      </div>
    </Card>
  );
}

function CreateRewardForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsRequired, setPointsRequired] = useState("300");
  const [rewardType, setRewardType] = useState<"discount_fixed" | "discount_percent" | "free_item" | "custom">("discount_fixed");
  const [rewardValue, setRewardValue] = useState("2.00");
  const [maxPerUser, setMaxPerUser] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pointsRequired) {
      setError("Name and points required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/loyalty/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          points_required: Number(pointsRequired),
          reward_type: rewardType,
          reward_value:
            rewardType === "discount_fixed"
              ? Math.round(Number(rewardValue) * 100)
              : Number(rewardValue),
          max_redemptions_per_user: Number(maxPerUser) || 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create reward");
        return;
      }

      onCreated();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="text-sm font-semibold">New Loyalty Reward</h3>

        {error && (
          <p className="text-xs text-coral bg-coral/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div>
          <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
            Reward Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="$2 Off Next Meal"
            className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Get $2 off your next family meal"
            className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Points Required *
            </label>
            <input
              type="number"
              value={pointsRequired}
              onChange={(e) => setPointsRequired(e.target.value)}
              min="1"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Reward Type
            </label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value as typeof rewardType)}
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="discount_fixed">$ Off</option>
              <option value="discount_percent">% Off</option>
              <option value="free_item">Free Item</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              {rewardType === "discount_fixed" ? "Amount ($)" : rewardType === "discount_percent" ? "Percent (%)" : "Value"}
            </label>
            <input
              type="number"
              value={rewardValue}
              onChange={(e) => setRewardValue(e.target.value)}
              step={rewardType === "discount_fixed" ? "0.01" : "1"}
              min="0"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Max Per Person
            </label>
            <input
              type="number"
              value={maxPerUser}
              onChange={(e) => setMaxPerUser(e.target.value)}
              placeholder="0 = unlimited"
              min="0"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={saving} fullWidth>
            Create Reward
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
