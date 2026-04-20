"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageGallery from "@/components/uploads/ImageGallery";

export default function NewMenuItemPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [sku, setSku] = useState("");
  const [stockCount, setStockCount] = useState("");
  const [isDigital, setIsDigital] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const isRetail = businessCategory === "retail";

  const allImages = imageUrl ? [imageUrl, ...galleryUrls] : galleryUrls;
  function handleImagesChange(next: string[]) {
    if (next.length === 0) {
      setImageUrl("");
      setGalleryUrls([]);
    } else {
      setImageUrl(next[0]);
      setGalleryUrls(next.slice(1));
    }
  }

  useEffect(() => {
    async function loadBusiness() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from("businesses")
        .select("id, category")
        .eq("owner_id", user.id)
        .single();

      if (business) {
        setBusinessId(business.id);
        setBusinessCategory(business.category);
      }
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
          gallery_urls: galleryUrls.length > 0 ? galleryUrls : [],
          video_url: videoUrl.trim() || null,
          sku: sku.trim() || null,
          stock_count: stockCount ? parseInt(stockCount) : null,
          is_digital: isDigital,
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
        Back to {isRetail ? "Products" : "Menu"}
      </Link>

      <h1 className="font-heading text-xl font-bold">
        {isRetail ? "New Product" : "New Menu Item"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={isRetail ? "Product Name" : "Item Name"}
          placeholder={isRetail ? "e.g. Compton Hustle Tee" : "e.g. Jerk Chicken Plate"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Description
          </label>
          <textarea
            placeholder={isRetail ? "Describe the product..." : "Describe the item..."}
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
          placeholder={isRetail ? "e.g. Clothing, Accessories, Digital" : "e.g. Entrees, Sides, Drinks"}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* ── Image Gallery (cover + extras) ── */}
        <ImageGallery
          urls={allImages}
          onChange={handleImagesChange}
          uploadEndpoint="/api/uploads/menu-item-image"
          label={isRetail ? "Product Photos" : "Item Photos"}
          helperText="The first image is the cover. Drag to reorder."
          maxImages={8}
        />

        {/* ── Video URL ── */}
        <Input
          label="Video URL (optional)"
          placeholder="https://youtube.com/... or https://vimeo.com/..."
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        {/* ── Retail-specific fields ── */}
        {isRetail && (
          <>
            <Input
              label="SKU (optional)"
              placeholder="e.g. WNMR-TEE-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />

            <Input
              label="Stock Count (optional)"
              placeholder="e.g. 50"
              type="number"
              min="0"
              value={stockCount}
              onChange={(e) => setStockCount(e.target.value)}
            />

            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-border-subtle">
              <div>
                <span className="text-sm font-medium">Digital Product</span>
                <p className="text-[10px] text-txt-secondary mt-0.5">No shipping required</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDigital(!isDigital)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  isDigital ? "bg-blue-500" : "bg-white/20"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                    isDigital ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </>
        )}

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
          {isRetail ? "Add Product" : "Add Menu Item"}
        </Button>
      </form>
    </div>
  );
}
