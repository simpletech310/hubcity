"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ProductWithVariants {
  id: string;
  name: string;
  price: number;
  category: string | null;
  is_available: boolean;
  image_url: string | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    price_override: number | null;
    stock_count: number;
    is_available: boolean;
    attributes: Record<string, string>;
  }[];
}

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const bizRes = await fetch("/api/businesses/mine");
      if (!bizRes.ok) return;
      const { business } = await bizRes.json();
      if (!business) return;

      const res = await fetch(`/api/menu-items?business_id=${business.id}`);
      if (!res.ok) return;
      const data = await res.json();

      // Fetch variants for each product
      const productsWithVariants = await Promise.all(
        (data.items || []).map(async (item: ProductWithVariants) => {
          const vRes = await fetch(`/api/products/${item.id}/variants`);
          const vData = vRes.ok ? await vRes.json() : { variants: [] };
          return { ...item, variants: vData.variants || [] };
        })
      );

      setProducts(productsWithVariants);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter((p) => {
    if (filter === "all") return true;
    const totalStock = p.variants.reduce((sum, v) => sum + v.stock_count, 0);
    if (filter === "out") return totalStock === 0 && p.variants.length > 0;
    if (filter === "low") return totalStock > 0 && totalStock <= 5 && p.variants.length > 0;
    return true;
  });

  const totalItems = products.length;
  const lowStockCount = products.filter(
    (p) => p.variants.length > 0 && p.variants.reduce((s, v) => s + v.stock_count, 0) <= 5 && p.variants.reduce((s, v) => s + v.stock_count, 0) > 0
  ).length;
  const outOfStockCount = products.filter(
    (p) => p.variants.length > 0 && p.variants.reduce((s, v) => s + v.stock_count, 0) === 0
  ).length;

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">Inventory</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-gold">{totalItems}</p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Products</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-gold">{lowStockCount}</p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Low Stock</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-heading font-bold text-coral">{outOfStockCount}</p>
          <p className="text-[10px] text-txt-secondary mt-0.5">Out of Stock</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "low", "out"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-gold text-midnight"
                : "bg-surface text-txt-secondary hover:text-white"
            }`}
          >
            {f === "all" ? "All" : f === "low" ? "Low Stock" : "Out of Stock"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-sm text-txt-secondary">
            {filter === "all" ? "No products yet" : `No ${filter === "low" ? "low stock" : "out of stock"} items`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <InventoryCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryCard({ product }: { product: ProductWithVariants }) {
  const totalStock = product.variants.reduce((s, v) => s + v.stock_count, 0);
  const hasVariants = product.variants.length > 0;

  const stockBadge = !hasVariants
    ? { label: "No variants", variant: "gold" as const }
    : totalStock === 0
    ? { label: "Out of stock", variant: "coral" as const }
    : totalStock <= 5
    ? { label: `${totalStock} left`, variant: "gold" as const }
    : { label: `${totalStock} in stock`, variant: "emerald" as const };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium">{product.name}</p>
            <Badge label={stockBadge.label} variant={stockBadge.variant} size="sm" />
          </div>
          <p className="text-xs text-txt-secondary">
            ${(product.price / 100).toFixed(2)}
            {product.category && ` · ${product.category}`}
          </p>
          {hasVariants && (
            <div className="mt-2 space-y-1">
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs">
                  <span className="text-txt-secondary">
                    {v.name}
                    {v.sku && <span className="ml-1 font-mono text-[10px]">({v.sku})</span>}
                  </span>
                  <span className={v.stock_count === 0 ? "text-coral" : v.stock_count <= 5 ? "text-gold" : "text-emerald"}>
                    {v.stock_count} qty
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
