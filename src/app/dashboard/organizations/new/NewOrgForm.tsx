"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const ORG_TYPES = [
  { value: "cultural", label: "Cultural institution (museum, gallery, archive)" },
  { value: "resource_provider", label: "Resource provider (housing, health, grants, programs)" },
  { value: "chamber", label: "Chamber of commerce" },
  { value: "school", label: "School / education" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "government", label: "Government agency" },
  { value: "other", label: "Other" },
];

type Props = {
  cities: { id: string; name: string }[];
};

export default function NewOrgForm({ cities }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "cultural",
    city_id: cities[0]?.id ?? "",
    description: "",
    website: "",
    email: "",
    phone: "",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Name is required");
    if (!form.city_id) return setError("Select a city");

    startTransition(async () => {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Could not register");
        return;
      }
      const { org } = await res.json();
      router.push(`/dashboard/organizations/${org.slug}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Organization name">
        <input
          className="field-input"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </Field>
      <Field label="Type">
        <select
          className="field-input"
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
        >
          {ORG_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Primary city">
        <select
          className="field-input"
          value={form.city_id}
          onChange={(e) => set("city_id", e.target.value)}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="About">
        <textarea
          className="field-input min-h-[80px]"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="One or two sentences about your organization."
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Website">
          <input
            className="field-input"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
            placeholder="https://…"
          />
        </Field>
        <Field label="Contact email">
          <input
            className="field-input"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
      </div>
      <Field label="Contact phone">
        <input
          className="field-input"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </Field>

      {error && <p className="text-sm text-coral-300">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-5 py-3 rounded-lg bg-gold text-midnight font-semibold text-sm disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit for review"}
      </button>

      <style jsx>{`
        :global(.field-input) {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: white;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
        }
        :global(.field-input:focus) {
          border-color: rgba(212, 175, 55, 0.5);
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
