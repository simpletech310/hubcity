"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { getCitiesFromDB, type CityOption } from "@/lib/cities-client";

const CATEGORIES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "beauty", label: "Beauty" },
  { value: "fitness", label: "Fitness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

export default function OnboardingQuickStartPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load active cities on mount
  useEffect(() => {
    getCitiesFromDB().then((all) => {
      const active = all.filter(
        (c) => c.launch_status === "active" || c.launch_status === "live" as string,
      );
      setCities(active);
      if (active.length > 0 && !cityId) setCityId(active[0].id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a listing.");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("businesses").insert({
        name: name.trim(),
        category,
        city_id: cityId || null,
        owner_id: user.id,
        is_published: false,
      });

      if (insertError) throw insertError;

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-midnight flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center font-heading font-extrabold text-lg text-midnight">
            H
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">
            Hub<span className="text-gold">City</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl">
          <h1 className="font-heading text-xl font-bold text-white mb-1">
            Get listed in 60 seconds
          </h1>
          <p className="text-xs text-txt-secondary mb-6">
            You can add photos, hours, and payments later — get your name on the
            map first.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Business name */}
            <Input
              label="Business name"
              placeholder="e.g. Compton Soul Kitchen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            {/* Category */}
            <div className="w-full">
              <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-midnight">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            {cities.length > 0 && (
              <div className="w-full">
                <label className="block text-sm font-medium text-txt-secondary mb-1.5">
                  City
                </label>
                <select
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors"
                >
                  {cities.map((city) => (
                    <option key={city.id || city.slug} value={city.id} className="bg-midnight">
                      {city.name}, {city.state}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
              className="mt-2"
            >
              Get Listed
            </Button>
          </form>
        </div>

        <p className="text-xs text-txt-secondary text-center mt-4">
          No payment info required to get started.
        </p>
      </div>
    </div>
  );
}
