"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function NewMenuItemPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (business) setBusinessId(business.id);
    }
    loadBusiness();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Item name is required");
      return;
    }

    const dollars = parseFloat(priceDisplay);
    if (isNaN(dollars) || dollars <= 0) {
      setError("Please enter a valid price");
      return;
    }

    const priceInCents = Math.round(dollars * 100);

    setLoading(true);

    try {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          name: name.trim(),
          description: description.trim() || null,
          price: priceInCents,
          category: category.trim() || null,
          image_url: imageUrl.trim() || null,
          is_available: isAvailable,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create menu item");
        setLoading(false);
        return;
      }

      router.push("/dashboard/menu");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-5 space-y-5">
      <Link
        href="/dashboard/menu"
        className="inline-flex items-center gap-1.5 text-sm text-txt-secondary hover:text-white transition-colors"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Menu
      </Link>

      <h1 className="font-heading text-xl font-bold">New Menu Item</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Item Name"
          placeholder="e.g. Jerk Chicken Plate"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Description
          </label>
          <textarea
            placeholder="Describe the item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
          />
        </div>

        <Input
          label="Price ($)"
          placeholder="12.99"
          type="number"
          step="0.01"
          min="0"
          value={priceDisplay}
          onChange={(e) => setPriceDisplay(e.target.value)}
          required
        />

        <Input
          label="Category"
          placeholder="e.g. Entrees, Sides, Drinks"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <Input
          label="Image URL (optional)"
          placeholder="https://..."
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-border-subtle">
          <span className="text-sm font-medium">Available</span>
          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-10 h-5 rounded-full transition-colors ${
              isAvailable ? "bg-emerald" : "bg-white/20"
            }`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                isAvailable ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {error && (
          <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Add Menu Item
        </Button>
      </form>
    </div>
  );
}
