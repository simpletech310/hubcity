"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import type { FoodChallenge, FoodChallengeType, ChallengeCompletion } from "@/types/database";

const CHALLENGE_TYPES: { value: FoodChallengeType; label: string }[] = [
  { value: "eating", label: "Eating Challenge" },
  { value: "collection", label: "Collection / Passport" },
  { value: "photo", label: "Photo Challenge" },
];

const inputClass =
  "w-full bg-white/[0.04] border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-txt-secondary/60 outline-none focus:border-gold/30 transition-colors";
const labelClass = "text-[10px] text-txt-secondary mb-1 block uppercase tracking-wider";

interface BusinessSummary {
  id: string;
  name: string;
  category: string;
  is_mobile_vendor: boolean;
}

export default function ChallengesManagementPage() {
  const [business, setBusiness] = useState<BusinessSummary | null>(null);
  const [challenges, setChallenges] = useState<FoodChallenge[]>([]);
  const [completionsByChallenge, setCompletionsByChallenge] = useState<
    Record<string, ChallengeCompletion[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [challengeType, setChallengeType] = useState<FoodChallengeType>("eating");
  const [rules, setRules] = useState("");
  const [prize, setPrize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setChallengeType("eating");
    setRules("");
    setPrize("");
    setStartDate("");
    setEndDate("");
    setEditingId(null);
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name, category, is_mobile_vendor")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!biz) {
        setLoading(false);
        return;
      }
      setBusiness(biz as BusinessSummary);

      const { data: rows } = await supabase
        .from("food_challenges")
        .select("*")
        .eq("business_id", biz.id)
        .order("created_at", { ascending: false });

      const list = (rows ?? []) as FoodChallenge[];
      setChallenges(list);

      if (list.length > 0) {
        const ids = list.map((c) => c.id);
        const { data: comps } = await supabase
          .from("challenge_completions")
          .select("*, user:profiles(id, display_name, handle, avatar_url)")
          .in("challenge_id", ids)
          .order("completed_at", { ascending: false });
        const map: Record<string, ChallengeCompletion[]> = {};
        for (const c of (comps ?? []) as ChallengeCompletion[]) {
          map[c.challenge_id] = map[c.challenge_id] || [];
          map[c.challenge_id].push(c);
        }
        setCompletionsByChallenge(map);
      }

      setLoading(false);
    }
    load();
  }, []);

  const populateFormFor = (c: FoodChallenge) => {
    setEditingId(c.id);
    setName(c.name);
    setDescription(c.description ?? "");
    setImageUrl(c.image_url ?? "");
    setChallengeType(c.challenge_type);
    setRules(c.rules ?? "");
    setPrize(c.prize_description ?? "");
    setStartDate(c.start_date);
    setEndDate(c.end_date);
    setShowForm(true);
  };

  const submit = useCallback(async () => {
    if (!name.trim() || !startDate || !endDate) return;
    setCreating(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl.trim() || null,
        challenge_type: challengeType,
        rules: rules.trim() || null,
        prize_description: prize.trim() || null,
        start_date: startDate,
        end_date: endDate,
      };
      const url = editingId
        ? `/api/food/challenges/${editingId}`
        : "/api/food/challenges";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      if (editingId) {
        setChallenges((prev) =>
          prev.map((c) => (c.id === editingId ? (data.challenge as FoodChallenge) : c))
        );
      } else {
        setChallenges((prev) => [data.challenge as FoodChallenge, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setCreating(false);
    }
  }, [
    name,
    description,
    imageUrl,
    challengeType,
    rules,
    prize,
    startDate,
    endDate,
    editingId,
  ]);

  const deactivate = useCallback(async (id: string) => {
    if (!confirm("Deactivate this challenge? Completions will be preserved.")) return;
    const res = await fetch(`/api/food/challenges/${id}`, { method: "DELETE" });
    if (res.ok) {
      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
      );
    }
  }, []);

  if (loading) {
    return (
      <div className="px-5 pt-6 text-sm text-txt-secondary">Loading…</div>
    );
  }

  if (!business) {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-heading text-xl font-bold mb-2">Challenges</h1>
        <Card>
          <p className="text-sm">
            You need to register a business first to post Food Challenges.
          </p>
          <Link
            href="/business-signup"
            className="text-gold text-sm font-semibold mt-3 inline-block"
          >
            Register your business →
          </Link>
        </Card>
      </div>
    );
  }

  const isFoodVendor =
    business.category === "restaurant" || business.is_mobile_vendor === true;

  if (!isFoodVendor) {
    return (
      <div className="px-5 pt-6">
        <h1 className="font-heading text-xl font-bold mb-2">Challenges</h1>
        <Card>
          <p className="text-sm">
            Food Challenges are only available to restaurants and mobile food
            vendors.
          </p>
          <p className="text-xs text-txt-secondary mt-2">
            Your business category: <span className="font-semibold">{business.category}</span>
          </p>
        </Card>
      </div>
    );
  }

  const active = challenges.filter((c) => c.is_active);
  const inactive = challenges.filter((c) => !c.is_active);

  return (
    <div className="animate-fade-in px-5 pt-4 pb-20">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-xl font-bold mb-1">Food Challenges</h1>
          <p className="text-sm text-txt-secondary">
            Post fun challenges for {business.name}
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            if (showForm) {
              resetForm();
            }
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cancel" : "+ New"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="font-heading font-bold text-sm mb-3">
            {editingId ? "Edit Challenge" : "Create New Challenge"}
          </h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                placeholder="e.g. Burrito Buster"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select
                value={challengeType}
                onChange={(e) => setChallengeType(e.target.value as FoodChallengeType)}
                className={inputClass}
              >
                {CHALLENGE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>What you eat / Description</label>
              <textarea
                placeholder="Eat the 4lb wet burrito in 30 minutes. Comes with rice and beans."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>Rules (optional)</label>
              <textarea
                placeholder="No bathroom breaks. No regurgitation. Hands only."
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className={labelClass}>Prize (optional)</label>
              <input
                type="text"
                placeholder="Free t-shirt + your photo on the wall"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Photo URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelClass}>Start</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>End</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <Button fullWidth loading={creating} onClick={submit}>
              {editingId ? "Save Changes" : "Create Challenge"}
            </Button>
          </div>
        </Card>
      )}

      {challenges.length === 0 && !showForm ? (
        <Card className="text-center py-10">
          <p className="text-sm text-txt-secondary">
            No challenges yet. Tap <span className="text-gold font-semibold">+ New</span> to post one.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-txt-secondary mb-2">
                Active
              </h3>
              <div className="space-y-3">
                {active.map((c) => (
                  <ChallengeRow
                    key={c.id}
                    challenge={c}
                    completions={completionsByChallenge[c.id] ?? []}
                    onEdit={() => populateFormFor(c)}
                    onDeactivate={() => deactivate(c.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {inactive.length > 0 && (
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-txt-secondary mb-2">
                Inactive
              </h3>
              <div className="space-y-3">
                {inactive.map((c) => (
                  <ChallengeRow
                    key={c.id}
                    challenge={c}
                    completions={completionsByChallenge[c.id] ?? []}
                    onEdit={() => populateFormFor(c)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ChallengeRow({
  challenge: c,
  completions,
  onEdit,
  onDeactivate,
}: {
  challenge: FoodChallenge;
  completions: ChallengeCompletion[];
  onEdit: () => void;
  onDeactivate?: () => void;
}) {
  const previews = completions.filter((x) => x.photo_url).slice(0, 3);
  return (
    <Card>
      <div className="flex items-start gap-3">
        {c.image_url && (
          <div className="w-16 h-16 shrink-0 overflow-hidden border border-border-subtle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-sm truncate">{c.name}</h3>
          <p className="text-[11px] text-txt-secondary mt-0.5">
            {c.challenge_type} · {new Date(c.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(c.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          <p className="text-xs mt-1.5">
            <span className="text-gold font-bold tabular-nums">{c.participant_count}</span>{" "}
            <span className="text-txt-secondary">completions</span>
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="flex gap-2 mt-3">
          {previews.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={p.id}
              src={p.photo_url!}
              alt=""
              className="w-12 h-12 object-cover border border-border-subtle"
            />
          ))}
          {completions.length > 3 && (
            <div className="w-12 h-12 flex items-center justify-center text-[11px] text-txt-secondary border border-border-subtle">
              +{completions.length - 3}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onEdit}
          className="text-xs text-gold font-semibold px-2 py-1 hover:bg-gold/10 rounded"
        >
          Edit
        </button>
        <Link
          href={`/food/challenges/${c.slug}`}
          className="text-xs text-txt-secondary font-semibold px-2 py-1 hover:text-white inline-flex items-center gap-1"
        >
          View public
          <Icon name="external" size={11} />
        </Link>
        {onDeactivate && (
          <button
            onClick={onDeactivate}
            className="text-xs text-coral font-semibold px-2 py-1 ml-auto hover:bg-coral/10 rounded"
          >
            Deactivate
          </button>
        )}
      </div>
    </Card>
  );
}
