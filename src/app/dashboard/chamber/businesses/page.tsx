"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";

interface ChamberBusiness {
  id: string;
  name: string;
  slug: string | null;
  business_type: string | null;
  business_sub_type: string | null;
  chamber_status: string;
  chamber_notes: string | null;
  category: string | null;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
  owner: { display_name: string; email: string } | null;
}

const statusColors: Record<string, "emerald" | "gold" | "coral"> = {
  active: "emerald",
  paused: "gold",
  removed: "coral",
};

export default function ChamberBusinessesPage() {
  const [businesses, setBusinesses] = useState<ChamberBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/chamber/businesses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    const timeout = setTimeout(fetchBusinesses, 300);
    return () => clearTimeout(timeout);
  }, [fetchBusinesses]);

  async function updateStatus(bizId: string, chamber_status: string) {
    try {
      await fetch(`/api/chamber/businesses/${bizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chamber_status }),
      });
      fetchBusinesses();
    } catch {
      // silent
    }
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Manage Businesses</h1>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search businesses..."
        className="w-full bg-deep border border-border-subtle rounded-xl px-4 py-2.5 text-sm focus:border-gold outline-none"
      />

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs focus:border-gold outline-none"
        >
          <option value="">All Types</option>
          <option value="food">Food</option>
          <option value="retail">Retail</option>
          <option value="service">Service</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs focus:border-gold outline-none"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-txt-secondary">{businesses.length} businesses</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-txt-secondary">No businesses found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {businesses.map((biz) => {
            const ownerRaw = biz.owner as unknown;
            const owner = (Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw) as { display_name: string; email: string } | null;
            return (
              <Card key={biz.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold truncate">{biz.name}</p>
                      <Badge
                        label={biz.chamber_status}
                        variant={statusColors[biz.chamber_status] || "gold"}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-txt-secondary">
                      {biz.business_type && (
                        <span className="capitalize">{biz.business_type}</span>
                      )}
                      {biz.business_sub_type && (
                        <span className="capitalize">{biz.business_sub_type.replace("_", " ")}</span>
                      )}
                      {biz.rating_avg && (
                        <span>{Number(biz.rating_avg).toFixed(1)} <Icon name="star" size={16} /></span>
                      )}
                    </div>
                    {owner && (
                      <p className="text-[10px] text-txt-secondary mt-1">
                        Owner: {owner.display_name}
                      </p>
                    )}
                    {biz.chamber_notes && (
                      <p className="text-[10px] text-coral mt-1 italic">{biz.chamber_notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    {biz.chamber_status === "active" && (
                      <button
                        onClick={() => updateStatus(biz.id, "paused")}
                        className="text-[10px] text-gold hover:text-gold/80 px-2 py-1 bg-gold/10 rounded-lg"
                      >
                        Pause
                      </button>
                    )}
                    {biz.chamber_status === "paused" && (
                      <>
                        <button
                          onClick={() => updateStatus(biz.id, "active")}
                          className="text-[10px] text-emerald hover:text-emerald/80 px-2 py-1 bg-emerald/10 rounded-lg"
                        >
                          Reactivate
                        </button>
                        <button
                          onClick={() => updateStatus(biz.id, "removed")}
                          className="text-[10px] text-coral hover:text-coral/80 px-2 py-1 bg-coral/10 rounded-lg"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    {biz.chamber_status === "removed" && (
                      <button
                        onClick={() => updateStatus(biz.id, "active")}
                        className="text-[10px] text-emerald hover:text-emerald/80 px-2 py-1 bg-emerald/10 rounded-lg"
                      >
                        Restore
                      </button>
                    )}
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
