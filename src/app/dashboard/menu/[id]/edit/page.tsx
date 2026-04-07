"use client";

import { useState, useEffect, useMemo, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { MenuItem, ProductVariant } from "@/types/database";

interface EditMenuItemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditMenuItemPage({ params }: EditMenuItemPageProps) {
  const { id } = use(params);
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
  const [businessCategory, setBusinessCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Variants state
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [variantName, setVariantName] = useState("");
  const [variantPriceDisplay, setVariantPriceDisplay] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantAttributes, setVariantAttributes] = useState<{ key: string; value: string }[]>([]);
  const [addingVariant, setAddingVariant] = useState(false);
  const [variantError, setVariantError] = useState("");

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const mainImageRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isRetail = businessCategory === "retail";

  // Fetch existing item and business info
  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get business category
        const { data: business } = await supabase
          .from("businesses")
          .select("id, category")
          .eq("owner_id", user.id)
          .single();

        if (business) {
          setBusinessCategory(business.category);
        }

        // Fetch menu item
        const res = await fetch(`/api/menu-items/${id}`);
        if (!res.ok) {
          setError("Failed to load item");
          setFetching(false);
          return;
        }
        const data = await res.json();
        const item: MenuItem = data.menu_item;

        setName(item.name);
        setDescription(item.description || "");
        setPriceDisplay((item.price / 100).toFixed(2));
        setCategory(item.category || "");
        setImageUrl(item.image_url || "");
        setGalleryUrls(item.gallery_urls || []);
        setVideoUrl(item.video_url || "");
        setSku(item.sku || "");
        setStockCount(item.stock_count != null ? String(item.stock_count) : "");
        setIsDigital(item.is_digital);
        setIsAvailable(item.is_available);

        // Fetch variants
        const varRes = await fetch(`/api/products/${id}/variants`);
        if (varRes.ok) {
          const varData = await varRes.json();
          setVariants(varData.variants || []);
        }
      } catch {
        setError("Something went wrong loading item data");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [id, supabase]);

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
      const res = await fetch(`/api/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        setError(data.error || "Failed to update item");
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

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/menu-items/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete item");
        setDeleting(false);
        setDeleteConfirm(false);
        return;
      }

      router.push("/dashboard/menu");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  // ── Variant Helpers ──

  async function handleAddVariant() {
    setVariantError("");
    if (!variantName.trim()) {
      setVariantError("Variant name is required");
      return;
    }

    setAddingVariant(true);

    const priceOverride = variantPriceDisplay
      ? Math.round(parseFloat(variantPriceDisplay) * 100)
      : null;

    const attrs: Record<string, string> = {};
    for (const { key, value } of variantAttributes) {
      if (key.trim() && value.trim()) {
        attrs[key.trim()] = value.trim();
      }
    }

    try {
      const res = await fetch(`/api/products/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variantName.trim(),
          sku: variantSku.trim() || null,
          price_override: priceOverride,
          stock_count: variantStock ? parseInt(variantStock) : 0,
          attributes: attrs,
          sort_order: variants.length,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setVariantError(data.error || "Failed to add variant");
        setAddingVariant(false);
        return;
      }

      const data = await res.json();
      setVariants((prev) => [...prev, data.variant]);
      resetVariantForm();
    } catch {
      setVariantError("Something went wrong");
    } finally {
      setAddingVariant(false);
    }
  }

  function resetVariantForm() {
    setVariantName("");
    setVariantPriceDisplay("");
    setVariantSku("");
    setVariantStock("");
    setVariantAttributes([]);
    setShowAddVariant(false);
    setVariantError("");
  }

  async function toggleVariantAvailability(variant: ProductVariant) {
    const newValue = !variant.is_available;
    // Optimistic update
    setVariants((prev) =>
      prev.map((v) => (v.id === variant.id ? { ...v, is_available: newValue } : v))
    );

    try {
      const res = await fetch(`/api/products/${id}/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: newValue }),
      });

      if (!res.ok) {
        // Revert
        setVariants((prev) =>
          prev.map((v) => (v.id === variant.id ? { ...v, is_available: !newValue } : v))
        );
      }
    } catch {
      setVariants((prev) =>
        prev.map((v) => (v.id === variant.id ? { ...v, is_available: !newValue } : v))
      );
    }
  }

  async function deleteVariant(variantId: string) {
    setVariants((prev) => prev.filter((v) => v.id !== variantId));

    try {
      const res = await fetch(`/api/products/${id}/variants/${variantId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        // Refetch on failure
        const varRes = await fetch(`/api/products/${id}/variants`);
        if (varRes.ok) {
          const data = await varRes.json();
          setVariants(data.variants || []);
        }
      }
    } catch {
      // Refetch on failure
      const varRes = await fetch(`/api/products/${id}/variants`);
      if (varRes.ok) {
        const data = await varRes.json();
        setVariants(data.variants || []);
      }
    }
  }

  function addAttributeRow() {
    setVariantAttributes((prev) => [...prev, { key: "", value: "" }]);
  }

  function updateAttribute(idx: number, field: "key" | "value", val: string) {
    setVariantAttributes((prev) =>
      prev.map((attr, i) => (i === idx ? { ...attr, [field]: val } : attr))
    );
  }

  function removeAttribute(idx: number) {
    setVariantAttributes((prev) => prev.filter((_, i) => i !== idx));
  }

  if (fetching) {
    return (
      <div className="px-4 py-5 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
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
        {isRetail ? "Edit Product" : "Edit Menu Item"}
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
          {isRetail ? "Save Product" : "Save Menu Item"}
        </Button>
      </form>

      {/* ── Variants & Options ── */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold">Variants & Options</h2>

        {variants.length === 0 && !showAddVariant && (
          <Card>
            <p className="text-sm text-txt-secondary text-center py-2">
              No variants yet. Add sizes, colors, or other options.
            </p>
          </Card>
        )}

        {variants.map((variant) => (
          <Card key={variant.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{variant.name}</p>
                  {!variant.is_available && (
                    <Badge label="Unavailable" variant="coral" size="sm" />
                  )}
                </div>
                {variant.price_override != null && (
                  <p className="text-xs text-gold mt-0.5">
                    ${(variant.price_override / 100).toFixed(2)}
                  </p>
                )}
                {variant.sku && (
                  <p className="text-[10px] text-txt-secondary mt-0.5">
                    SKU: {variant.sku}
                  </p>
                )}
                <p className="text-[10px] text-txt-secondary mt-0.5">
                  Stock: {variant.stock_count}
                </p>
                {Object.keys(variant.attributes).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-[10px] bg-white/5 border border-border-subtle rounded-md px-1.5 py-0.5"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVariantAvailability(variant)}
                  className={`w-9 h-[18px] rounded-full transition-colors ${
                    variant.is_available ? "bg-emerald" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 bg-white rounded-full transition-transform mx-0.5 ${
                      variant.is_available ? "translate-x-[18px]" : "translate-x-0"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => deleteVariant(variant.id)}
                  className="w-7 h-7 rounded-lg bg-coral/10 flex items-center justify-center hover:bg-coral/20 transition-colors"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-coral">
                    <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 5v6a1 1 0 001 1h4a1 1 0 001-1V5" />
                  </svg>
                </button>
              </div>
            </div>
          </Card>
        ))}

        {showAddVariant ? (
          <Card variant="glass-elevated">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">New Variant</h3>

              <Input
                label="Variant Name"
                placeholder="e.g. Large, Red, XL"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                required
              />

              <Input
                label="Price Override ($, optional)"
                placeholder="Leave blank to use item price"
                type="number"
                step="0.01"
                min="0"
                value={variantPriceDisplay}
                onChange={(e) => setVariantPriceDisplay(e.target.value)}
              />

              <Input
                label="SKU (optional)"
                placeholder="e.g. TEE-RED-XL"
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value)}
              />

              <Input
                label="Stock Count"
                placeholder="0"
                type="number"
                min="0"
                value={variantStock}
                onChange={(e) => setVariantStock(e.target.value)}
              />

              {/* Attributes key-value pairs */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-txt-secondary">
                  Attributes (optional)
                </label>
                {variantAttributes.map((attr, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder="Key (e.g. Size)"
                      value={attr.key}
                      onChange={(e) => updateAttribute(idx, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Value (e.g. XL)"
                      value={attr.value}
                      onChange={(e) => updateAttribute(idx, "value", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(idx)}
                      className="shrink-0 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary">
                        <path d="M1 1l8 8M9 1l-8 8" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAttributeRow}
                  className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 1v10M1 6h10" />
                  </svg>
                  Add attribute
                </button>
              </div>

              {variantError && (
                <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
                  {variantError}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={resetVariantForm}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  loading={addingVariant}
                  onClick={handleAddVariant}
                >
                  Add Variant
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            type="button"
            variant="outline"
            fullWidth
            size="sm"
            onClick={() => setShowAddVariant(true)}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            Add Variant
          </Button>
        )}
      </div>

      {/* ── Danger Zone ── */}
      <div className="pt-4 border-t border-border-subtle space-y-3">
        {deleteConfirm ? (
          <Card variant="glass-elevated">
            <p className="text-sm font-medium text-coral mb-3">
              Are you sure? This will permanently delete this{" "}
              {isRetail ? "product" : "menu item"} and all its variants.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Delete Forever
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            type="button"
            variant="danger"
            fullWidth
            onClick={() => setDeleteConfirm(true)}
          >
            {isRetail ? "Delete Product" : "Delete Menu Item"}
          </Button>
        )}
      </div>
    </div>
  );
}
