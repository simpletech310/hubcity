"use client";

import { useState, useEffect, useCallback } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import type { FoodSpecial } from "@/types/database";

export default function SpecialsManagementPage() {
  const [specials, setSpecials] = useState<FoodSpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [specialPrice, setSpecialPrice] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Load specials
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!business) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("food_specials")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false });

      setSpecials((data as FoodSpecial[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const createSpecial = useCallback(async () => {
    if (!title || !originalPrice || !specialPrice || !validUntil) return;
    setCreating(true);

    try {
      const res = await fetch("/api/food/specials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          original_price: Math.round(parseFloat(originalPrice) * 100),
          special_price: Math.round(parseFloat(specialPrice) * 100),
          valid_from: validFrom
            ? new Date(validFrom).toISOString()
            : new Date().toISOString(),
          valid_until: new Date(validUntil).toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const data = await res.json();
      setSpecials((prev) => [data.special, ...prev]);

      // Reset form
      setTitle("");
      setDescription("");
      setOriginalPrice("");
      setSpecialPrice("");
      setValidFrom("");
      setValidUntil("");
      setShowForm(false);
    } catch {
      alert("Failed to create special. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [title, description, originalPrice, specialPrice, validFrom, validUntil]);

  const toggleActive = useCallback(async (id: string, currentlyActive: boolean) => {
    const res = await fetch(`/api/food/specials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !currentlyActive }),
    });

    if (res.ok) {
      setSpecials((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, is_active: !currentlyActive } : s
        )
      );
    }
  }, []);

  const deleteSpecial = useCallback(async (id: string) => {
    if (!confirm("Delete this special?")) return;

    const res = await fetch(`/api/food/specials/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSpecials((prev) => prev.filter((s) => s.id !== id));
    }
  }, []);

  const now = new Date();
  const activeSpecials = specials.filter(
    (s) => s.is_active && new Date(s.valid_until) > now
  );
  const expiredSpecials = specials.filter(
    (s) => !s.is_active || new Date(s.valid_until) <= now
  );

  return (
    <div className="animate-fade-in px-5 pt-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-bold mb-1">Specials</h1>
          <p className="text-sm text-txt-secondary">
            Manage your food specials & deals
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="mb-6">
          <h2 className="font-heading font-bold text-sm mb-3">
            Create New Special
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Special title (e.g., Taco Tuesday)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors resize-none"
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  Original Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="12.99"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  Special Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="8.99"
                  value={specialPrice}
                  onChange={(e) => setSpecialPrice(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  Valid From
                </label>
                <input
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-txt-secondary mb-1 block">
                  Valid Until *
                </label>
                <input
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-white/[0.04] border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-gold/30 transition-colors"
                />
              </div>
            </div>
            <Button
              onClick={createSpecial}
              loading={creating}
              fullWidth
              disabled={!title || !originalPrice || !specialPrice || !validUntil}
            >
              Create Special
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20" />
          ))}
        </div>
      ) : (
        <>
          {/* Active Specials */}
          {activeSpecials.length > 0 && (
            <div className="mb-6">
              <h2 className="font-heading font-bold text-sm mb-3">
                Active ({activeSpecials.length})
              </h2>
              <div className="space-y-2">
                {activeSpecials.map((special) => (
                  <Card key={special.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-bold text-[13px]">
                            {special.title}
                          </h3>
                          <Badge label="Active" variant="emerald" />
                        </div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-xs text-txt-secondary line-through">
                            ${(special.original_price / 100).toFixed(2)}
                          </span>
                          <span className="font-heading font-bold text-gold">
                            ${(special.special_price / 100).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-[10px] text-txt-secondary">
                          Until{" "}
                          {new Date(special.valid_until).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() =>
                            toggleActive(special.id, special.is_active)
                          }
                          className="text-[10px] text-gold press"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => deleteSpecial(special.id)}
                          className="text-[10px] text-coral press"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Expired/Inactive Specials */}
          {expiredSpecials.length > 0 && (
            <div className="mb-6">
              <h2 className="font-heading font-bold text-sm mb-3 text-txt-secondary">
                Expired / Inactive ({expiredSpecials.length})
              </h2>
              <div className="space-y-2 opacity-60">
                {expiredSpecials.map((special) => (
                  <Card key={special.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-bold text-[13px]">
                            {special.title}
                          </h3>
                          <Badge
                            label={special.is_active ? "Expired" : "Paused"}
                            variant="coral"
                          />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs text-txt-secondary line-through">
                            ${(special.original_price / 100).toFixed(2)}
                          </span>
                          <span className="font-heading font-bold text-txt-secondary">
                            ${(special.special_price / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!special.is_active && (
                          <button
                            onClick={() =>
                              toggleActive(special.id, special.is_active)
                            }
                            className="text-[10px] text-gold press"
                          >
                            Reactivate
                          </button>
                        )}
                        <button
                          onClick={() => deleteSpecial(special.id)}
                          className="text-[10px] text-coral press"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {specials.length === 0 && !showForm && (
            <div className="text-center py-16">
              <span className="text-5xl block mb-3">🏷️</span>
              <p className="text-sm font-medium mb-1">No specials yet</p>
              <p className="text-xs text-txt-secondary mb-4">
                Create your first food special to attract customers
              </p>
              <Button size="sm" onClick={() => setShowForm(true)}>
                Create Special
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
