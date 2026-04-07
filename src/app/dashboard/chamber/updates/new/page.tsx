"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "event", label: "Event" },
  { value: "resource", label: "Resource" },
  { value: "grant", label: "Grant" },
  { value: "networking", label: "Networking" },
  { value: "policy", label: "Policy" },
];

export default function NewChamberUpdatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [isPinned, setIsPinned] = useState(false);
  const [targetTypes, setTargetTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleType(type: string) {
    setTargetTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError("Title and body required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/chamber/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category,
          is_pinned: isPinned,
          target_business_types: targetTypes.length > 0 ? targetTypes : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create update");
        return;
      }

      router.push("/dashboard/chamber/updates");
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-heading text-xl font-bold">New Chamber Update</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs text-coral bg-coral/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quarterly Business Mixer"
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2.5 text-sm focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Body *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your update..."
              rows={6}
              className="w-full bg-deep border border-border-subtle rounded-lg px-3 py-2.5 text-sm focus:border-gold outline-none resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat.value
                      ? "bg-gold text-midnight"
                      : "bg-surface text-txt-secondary hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-txt-secondary uppercase tracking-wider block mb-1">
              Target Business Types (optional)
            </label>
            <div className="flex gap-2">
              {["food", "retail", "service"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    targetTypes.includes(type)
                      ? "bg-cyan text-midnight"
                      : "bg-surface text-txt-secondary hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-txt-secondary mt-1">
              Leave empty to send to all businesses
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded border-border-subtle accent-gold"
            />
            <span className="text-xs text-txt-secondary">Pin this update</span>
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} fullWidth>
              Publish Update
            </Button>
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
