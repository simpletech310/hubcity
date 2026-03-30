"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessCategory } from "@/types/database";

const categories: BusinessCategory[] = [
  "restaurant", "barber", "retail", "services", "auto", "health", "beauty", "entertainment", "other",
];

const districts = [1, 2, 3, 4];

interface BusinessFormProps {
  business?: Business;
}

export default function BusinessForm({ business }: BusinessFormProps) {
  const router = useRouter();
  const isEdit = !!business;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(business?.name ?? "");
  const [category, setCategory] = useState<BusinessCategory>(business?.category ?? "restaurant");
  const [description, setDescription] = useState(business?.description ?? "");
  const [address, setAddress] = useState(business?.address ?? "");
  const [district, setDistrict] = useState<number | null>(business?.district ?? null);
  const [phone, setPhone] = useState(business?.phone ?? "");
  const [website, setWebsite] = useState(business?.website ?? "");
  const [isFeatured, setIsFeatured] = useState(business?.is_featured ?? false);
  const [isPublished, setIsPublished] = useState(business?.is_published ?? false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      setError("Name and address are required.");
      return;
    }

    setLoading(true);
    setError("");

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      name: name.trim(),
      slug,
      category,
      description: description.trim() || null,
      address: address.trim(),
      district,
      phone: phone.trim() || null,
      website: website.trim() || null,
      is_featured: isFeatured,
      is_published: isPublished,
    };

    try {
      const supabase = createClient();
      if (isEdit) {
        const { error: err } = await supabase
          .from("businesses")
          .update(payload)
          .eq("id", business.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("businesses")
          .insert({ ...payload, rating_avg: 0, rating_count: 0, vote_count: 0, hours: {}, image_urls: [], badges: [], menu: [] });
        if (err) throw err;
      }
      router.push("/admin/businesses");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save business.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="space-y-5">
        {error && (
          <div className="bg-coral/10 border border-coral/20 rounded-xl px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        <Input label="Business Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bludso's BBQ" />

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">Category *</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Chip key={cat} label={cat} active={category === cat} onClick={() => setCategory(cat)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[80px] resize-none"
            placeholder="Brief description of the business..."
          />
        </div>

        <Input label="Address *" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Compton Blvd, Compton, CA" />

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">District</label>
          <div className="flex gap-2">
            <Chip label="None" active={district === null} onClick={() => setDistrict(null)} />
            {districts.map((d) => (
              <Chip key={d} label={`District ${d}`} active={district === d} onClick={() => setDistrict(d)} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(310) 555-0100" />
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="accent-gold w-4 h-4" />
            <span className="text-sm">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-emerald w-4 h-4" />
            <span className="text-sm">Published</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? "Update Business" : "Create Business"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
