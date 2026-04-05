"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isRetail = businessCategory === "retail";

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

  async function uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    const res = await fetch("/api/upload/product-image", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    return data.urls;
  }

  async function handleMainImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const urls = await uploadFiles([file]);
      setImageUrl(urls[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setGalleryUploading(true);
    setError("");
    try {
      const urls = await uploadFiles(Array.from(files));
      setGalleryUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload gallery images");
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryImage(idx: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== idx));
  }

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

        {/* ── Main Product Image ── */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            {isRetail ? "Product Image" : "Item Image"}
          </label>
          {imageUrl ? (
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-card mb-2">
              <Image src={imageUrl} alt="Product" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
              >
                <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => mainImageRef.current?.click()}
              disabled={uploading}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center gap-2 hover:border-gold/30 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-txt-secondary">
                    <path d="M12 16V8m0 0l-3 3m3-3l3 3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs text-txt-secondary">
                    Upload product photo
                  </span>
                </>
              )}
            </button>
          )}
          <input
            ref={mainImageRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleMainImageUpload}
            className="hidden"
          />
          {/* Fallback URL input */}
          <Input
            label=""
            placeholder="Or paste image URL..."
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        {/* ── Gallery Images ── */}
        <div className="w-full">
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">
            Gallery Images (optional)
          </label>
          {galleryUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-2 pb-1">
              {galleryUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-card">
                  <Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <svg width="8" height="8" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d="M1 1l6 6M7 1l-6 6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={galleryUploading}
            className="w-full rounded-xl border border-dashed border-border-subtle py-3 flex items-center justify-center gap-2 hover:border-gold/30 transition-colors disabled:opacity-50 text-sm text-txt-secondary"
          >
            {galleryUploading ? (
              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M8 2v12M2 8h12" />
                </svg>
                Add gallery photos
              </>
            )}
          </button>
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleGalleryUpload}
            className="hidden"
          />
        </div>

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
