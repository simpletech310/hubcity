"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { Coupon } from "@/types/database";
import Icon from "@/components/ui/Icon";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusiness() {
      const res = await fetch("/api/businesses/mine");
      if (res.ok) {
        const data = await res.json();
        if (data.business) {
          setBusinessId(data.business.id);
        }
      }
    }
    fetchBusiness();
  }, []);

  const fetchCoupons = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coupons?business_id=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (businessId) fetchCoupons();
  }, [businessId, fetchCoupons]);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Coupons</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New Coupon
        </Button>
      </div>

      {showCreate && businessId && (
        <CreateCouponForm
          businessId={businessId}
          onCreated={() => {
            setShowCreate(false);
            fetchCoupons();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-2"><Icon name="tag" size={28} /></p>
          <p className="text-sm text-txt-secondary">No coupons yet</p>
          <p className="text-xs text-txt-secondary mt-1">
            Create coupons to attract customers and boost sales
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} onUpdate={fetchCoupons} />
          ))}
        </div>
      )}
    </div>
  );
}

function CouponCard({ coupon, onUpdate }: { coupon: Coupon; onUpdate: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const discountLabel =
    coupon.discount_type === "percent"
      ? `${coupon.discount_value}% off`
      : coupon.discount_type === "fixed_amount"
      ? `$${(coupon.discount_value / 100).toFixed(2)} off`
      : "Free shipping";

  const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
  const usesText = coupon.max_uses
    ? `${coupon.current_uses}/${coupon.max_uses} used`
    : `${coupon.current_uses} used`;

  async function handleDeactivate() {
    setDeleting(true);
    try {
      await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" });
      onUpdate();
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-gold">{coupon.code}</span>
            <Badge
              label={isExpired ? "Expired" : "Active"}
              variant={isExpired ? "coral" : "emerald"}
              size="sm"
            />
          </div>
          <p className="text-sm font-medium">{coupon.title}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-emerald font-semibold">{discountLabel}</span>
            <span className="text-xs text-txt-secondary">{usesText}</span>
            {coupon.min_order_amount > 0 && (
              <span className="text-xs text-txt-secondary">
                Min ${(coupon.min_order_amount / 100).toFixed(2)}
              </span>
            )}
          </div>
          {coupon.valid_until && (
            <p className="text-[10px] text-txt-secondary mt-1">
              Expires {new Date(coupon.valid_until).toLocaleDateString()}
            </p>
          )}
        </div>
        <button
          onClick={handleDeactivate}
          disabled={deleting}
          className="text-xs text-coral hover:text-coral/80 transition-colors px-2 py-1"
        >
          {deleting ? "..." : "Deactivate"}
        </button>
      </div>
    </Card>
  );
}

function CreateCouponForm({
  businessId,
  onCreated,
  onCancel,
}: {
  businessId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed_amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !discountValue) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          code: code.trim(),
          title: title.trim(),
          discount_type: discountType,
          discount_value:
            discountType === "percent"
              ? Number(discountValue)
              : Math.round(Number(discountValue) * 100),
          min_order_amount: minOrder ? Math.round(Number(minOrder) * 100) : 0,
          max_uses: maxUses ? Number(maxUses) : null,
          valid_until: validUntil || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create coupon");
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
        <h3 className="text-sm font-semibold">New Coupon</h3>

        {error && (
          <p className="text-xs text-coral bg-coral/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SAVE20"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm font-mono focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="20% Off Everything"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Type
            </label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed_amount")}
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            >
              <option value="percent">Percentage</option>
              <option value="fixed_amount">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              {discountType === "percent" ? "Percent Off *" : "Amount Off ($) *"}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "percent" ? "20" : "5.00"}
              step={discountType === "percent" ? "1" : "0.01"}
              min="0"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Min Order ($)
            </label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Max Uses
            </label>
            <input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              min="1"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Expires
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2 text-sm focus:border-gold outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" loading={saving} fullWidth>
            Create Coupon
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
