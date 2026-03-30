"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Chip from "@/components/ui/Chip";
import { createClient } from "@/lib/supabase/client";
import type { Resource, ResourceCategory } from "@/types/database";

const categories: ResourceCategory[] = [
  "business", "housing", "health", "youth", "jobs", "food", "legal", "senior", "education", "veterans", "utilities",
];

const statuses = ["open", "closed", "upcoming", "limited"] as const;
const districts = [1, 2, 3, 4];

interface ResourceFormProps {
  resource?: Resource;
}

export default function ResourceForm({ resource }: ResourceFormProps) {
  const router = useRouter();
  const isEdit = !!resource;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(resource?.name ?? "");
  const [category, setCategory] = useState<ResourceCategory>(resource?.category ?? "jobs");
  const [organization, setOrganization] = useState(resource?.organization ?? "");
  const [description, setDescription] = useState(resource?.description ?? "");
  const [eligibility, setEligibility] = useState(resource?.eligibility ?? "");
  const [status, setStatus] = useState<Resource["status"]>(resource?.status ?? "open");
  const [deadline, setDeadline] = useState(resource?.deadline ?? "");
  const [isFree, setIsFree] = useState(resource?.is_free ?? true);
  const [address, setAddress] = useState(resource?.address ?? "");
  const [phone, setPhone] = useState(resource?.phone ?? "");
  const [website, setWebsite] = useState(resource?.website ?? "");
  const [district, setDistrict] = useState<number | null>(resource?.district ?? null);
  const [isPublished, setIsPublished] = useState(resource?.is_published ?? false);
  const [matchTagsInput, setMatchTagsInput] = useState((resource?.match_tags ?? []).join(", "));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError("Name and description are required.");
      return;
    }

    setLoading(true);
    setError("");

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const match_tags = matchTagsInput.split(",").map((t) => t.trim()).filter(Boolean);

    const payload = {
      name: name.trim(),
      slug,
      category,
      organization: organization.trim() || null,
      description: description.trim(),
      eligibility: eligibility.trim() || null,
      match_tags,
      status,
      deadline: deadline || null,
      is_free: isFree,
      address: address.trim() || null,
      phone: phone.trim() || null,
      website: website.trim() || null,
      district,
      is_published: isPublished,
    };

    try {
      const supabase = createClient();
      if (isEdit) {
        const { error: err } = await supabase
          .from("resources")
          .update(payload)
          .eq("id", resource.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("resources")
          .insert(payload);
        if (err) throw err;
      }
      router.push("/admin/resources");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save resource.");
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

        <Input label="Resource Name *" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Compton Youth Employment Program" />

        <Input label="Organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. City of Compton" />

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">Category *</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Chip key={cat} label={cat} active={category === cat} onClick={() => setCategory(cat)} />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[80px] resize-none"
            placeholder="What this resource provides..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-1.5">Eligibility</label>
          <textarea
            value={eligibility}
            onChange={(e) => setEligibility(e.target.value)}
            className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 min-h-[60px] resize-none"
            placeholder="Who is eligible..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-txt-secondary mb-2">Status *</label>
          <div className="flex gap-2 flex-wrap">
            {statuses.map((s) => (
              <Chip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-2">District</label>
            <div className="flex gap-2 flex-wrap">
              <Chip label="All" active={district === null} onClick={() => setDistrict(null)} />
              {districts.map((d) => (
                <Chip key={d} label={`D${d}`} active={district === d} onClick={() => setDistrict(d)} />
              ))}
            </div>
          </div>
        </div>

        <Input label="Match Tags (comma-separated)" value={matchTagsInput} onChange={(e) => setMatchTagsInput(e.target.value)} placeholder="parent, job training, youth, housing" />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(310) 555-0100" />
          <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
        </div>

        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Compton Blvd, Compton, CA" />

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} className="accent-emerald w-4 h-4" />
            <span className="text-sm">Free</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="accent-emerald w-4 h-4" />
            <span className="text-sm">Published</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? "Update Resource" : "Create Resource"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </Card>
    </form>
  );
}
