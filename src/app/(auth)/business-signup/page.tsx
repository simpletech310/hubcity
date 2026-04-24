"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import { useActiveCity } from "@/hooks/useActiveCity";
import type { BusinessCategory } from "@/types/database";

const BUSINESS_CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: "restaurant", label: "Restaurant / Food" },
  { value: "barber", label: "Barber / Hair" },
  { value: "beauty", label: "Beauty / Salon" },
  { value: "retail", label: "Retail / Shopping" },
  { value: "services", label: "Professional Services" },
  { value: "auto", label: "Auto / Mechanic" },
  { value: "health", label: "Health / Wellness" },
  { value: "entertainment", label: "Entertainment" },
  { value: "other", label: "Other" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface HoursEntry {
  open: string;
  close: string;
  closed: boolean;
}

type StepHours = Record<string, HoursEntry>;

export default function BusinessSignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const activeCity = useActiveCity();
  const cityName = activeCity?.name ?? "your city";
  const cityState = activeCity?.state ?? "CA";

  // Load the active city's allowlisted ZIP codes from the DB so onboarding
  // works in any launched city without code changes.
  const [cityZips, setCityZips] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!activeCity?.id) {
      setCityZips([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("cities")
        .select("default_zip_codes")
        .eq("id", activeCity.id)
        .maybeSingle();
      if (!cancelled) {
        setCityZips((data?.default_zip_codes as string[] | null) ?? []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCity?.id, supabase]);

  // Step 1
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("restaurant");
  const [description, setDescription] = useState("");

  // Step 2
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3
  const [hours, setHours] = useState<StepHours>(() => {
    const initial: StepHours = {};
    DAYS.forEach((day) => {
      initial[day.toLowerCase()] = { open: "09:00", close: "17:00", closed: false };
    });
    return initial;
  });

  function validateStep1() {
    if (!name.trim()) return "Business name is required";
    if (!category) return "Please select a category";
    return null;
  }

  function validateStep2() {
    if (!street.trim()) return "Street address is required";
    if (!zip.trim()) return "ZIP code is required";
    if (cityZips.length > 0 && !cityZips.includes(zip.trim())) {
      const sample = cityZips.slice(0, 5).join(", ");
      return `Business must be in ${cityName}, ${cityState}. Valid ZIPs: ${sample}`;
    }
    return null;
  }

  function nextStep() {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep((s) => Math.min(s + 1, 4));
  }

  function prevStep() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function updateHours(day: string, field: keyof HoursEntry, value: string | boolean) {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  }

  function buildHoursPayload(): Record<string, { open: string; close: string }> {
    const payload: Record<string, { open: string; close: string }> = {};
    Object.entries(hours).forEach(([day, h]) => {
      if (!h.closed) {
        payload[day] = { open: h.open, close: h.close };
      }
    });
    return payload;
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);

    const address = `${street.trim()}, ${cityName}, ${cityState} ${zip.trim()}`;

    try {
      const res = await fetch("/api/business/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
          address,
          phone: phone.trim() || null,
          website: website.trim() || null,
          hours: buildHoursPayload(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create business");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const stepTitles = [
    "Business Info",
    "Location & Contact",
    "Business Hours",
    "Review & Submit",
  ];

  return (
    <div className="max-w-[430px] mx-auto min-h-dvh flex flex-col px-6 py-8 culture-surface">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 justify-center">
        <div
          className="w-12 h-12 flex items-center justify-center c-hero"
          style={{
            background: "var(--gold-c)",
            color: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            fontSize: 22,
          }}
        >
          K
        </div>
        <span className="c-hero" style={{ fontSize: 26, color: "var(--ink-strong)" }}>
          Knect
        </span>
      </div>

      <p className="c-kicker text-center" style={{ color: "var(--ink-strong)", opacity: 0.65 }}>§ REGISTER</p>
      <h1 className="c-hero text-center mt-1 mb-1" style={{ fontSize: 30, color: "var(--ink-strong)" }}>
        Register Your Business.
      </h1>
      <p className="c-serif-it text-center mb-6" style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}>
        Join the {cityName} business community.
      </p>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className="w-full h-1.5"
              style={{
                background: s <= step ? "var(--gold-c)" : "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
              }}
            />
            <span
              className="c-kicker"
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                color: "var(--ink-strong)",
                opacity: s <= step ? 1 : 0.4,
              }}
            >
              {stepTitles[s - 1]}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Business Info */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Business Name"
            placeholder={`e.g. ${cityName} Soul Kitchen`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="w-full">
            <label
              className="block c-kicker mb-1.5"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              CATEGORY
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BusinessCategory)}
              className="w-full px-4 py-3 focus:outline-none transition-colors"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 14,
                fontFamily: "var(--font-archivo), Archivo, sans-serif",
              }}
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label
              className="block c-kicker mb-1.5"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              DESCRIPTION
            </label>
            <textarea
              placeholder="Tell the community about your business..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 focus:outline-none resize-none transition-colors"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 14,
                fontFamily: "var(--font-fraunces), serif",
              }}
            />
          </div>
        </div>
      )}

      {/* Step 2: Location & Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Street Address"
            placeholder="123 Main St"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />
          <Input
            label="ZIP Code"
            placeholder={cityZips[0] ?? "ZIP"}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            maxLength={5}
            required
            error={
              zip.length === 5 && cityZips.length > 0 && !cityZips.includes(zip)
                ? `Must be a ${cityName} ZIP code`
                : undefined
            }
          />
          <Input
            label="Phone Number"
            placeholder="(310) 555-0100"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Website (optional)"
            placeholder="https://yourbusiness.com"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      )}

      {/* Step 3: Business Hours */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="c-serif-it mb-2" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.7 }}>
            Set your hours for each day. Toggle off for closed days.
          </p>
          {DAYS.map((day) => {
            const key = day.toLowerCase();
            const h = hours[key];
            return (
              <div
                key={day}
                className="flex items-center gap-3 px-3 py-2.5"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <div className="w-20 shrink-0">
                  <span className="c-card-t" style={{ fontSize: 13 }}>{day.slice(0, 3)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateHours(key, "closed", !h.closed)}
                  className="w-10 h-5 rounded-full transition-colors shrink-0"
                  style={{
                    background: !h.closed ? "var(--gold-c)" : "var(--paper-soft)",
                    border: "2px solid var(--rule-strong-c)",
                  }}
                >
                  <div
                    className={`w-3 h-3 rounded-full transition-transform ${
                      !h.closed ? "translate-x-4" : "translate-x-0"
                    }`}
                    style={{ background: "var(--ink-strong)" }}
                  />
                </button>
                {!h.closed ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHours(key, "open", e.target.value)}
                      className="px-2 py-1 w-[90px] focus:outline-none"
                      style={{
                        background: "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                        fontSize: 11,
                      }}
                    />
                    <span className="c-meta" style={{ fontSize: 11 }}>to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHours(key, "close", e.target.value)}
                      className="px-2 py-1 w-[90px] focus:outline-none"
                      style={{
                        background: "var(--paper)",
                        border: "2px solid var(--rule-strong-c)",
                        color: "var(--ink-strong)",
                        fontSize: 11,
                      }}
                    />
                  </div>
                ) : (
                  <span className="c-serif-it" style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.6 }}>Closed</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div
            className="c-frame p-4 space-y-3"
            style={{ background: "var(--paper-soft)" }}
          >
            <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
              Business Info
            </h3>
            <div className="space-y-1.5 c-body" style={{ fontSize: 13 }}>
              <p>
                <span className="c-meta">Name:</span> {name}
              </p>
              <p>
                <span className="c-meta">Category:</span>{" "}
                {BUSINESS_CATEGORIES.find((c) => c.value === category)?.label}
              </p>
              {description && (
                <p>
                  <span className="c-meta">Description:</span>{" "}
                  {description}
                </p>
              )}
            </div>
          </div>

          <div
            className="c-frame p-4 space-y-3"
            style={{ background: "var(--paper-soft)" }}
          >
            <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
              Location & Contact
            </h3>
            <div className="space-y-1.5 c-body" style={{ fontSize: 13 }}>
              <p>
                <span className="c-meta">Address:</span>{" "}
                {street}, {cityName}, {cityState} {zip}
              </p>
              {phone && (
                <p>
                  <span className="c-meta">Phone:</span> {phone}
                </p>
              )}
              {website && (
                <p>
                  <span className="c-meta">Website:</span> {website}
                </p>
              )}
            </div>
          </div>

          <div
            className="c-frame p-4 space-y-3"
            style={{ background: "var(--paper-soft)" }}
          >
            <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
              Business Hours
            </h3>
            <div className="space-y-1 c-body" style={{ fontSize: 13 }}>
              {DAYS.map((day) => {
                const key = day.toLowerCase();
                const h = hours[key];
                return (
                  <div key={day} className="flex justify-between">
                    <span className="c-meta">{day.slice(0, 3)}</span>
                    <span>
                      {h.closed ? (
                        <span className="c-serif-it" style={{ opacity: 0.6 }}>Closed</span>
                      ) : (
                        `${h.open} - ${h.close}`
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 mt-4 c-kicker"
          style={{
            background: "var(--ink-strong)",
            border: "2px solid var(--rule-strong-c)",
            color: "var(--gold-c)",
            fontSize: 12,
            letterSpacing: "0.12em",
          }}
        >
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="c-btn c-btn-outline flex-1 press"
          >
            BACK
          </button>
        )}
        {step < 4 ? (
          <button
            type="button"
            onClick={nextStep}
            className="c-btn c-btn-primary flex-1 press"
          >
            CONTINUE
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="c-btn c-btn-primary flex-1 press disabled:opacity-50"
          >
            {loading ? "CREATING…" : "CREATE BUSINESS"}
          </button>
        )}
      </div>

      <p className="c-meta text-center mt-6" style={{ fontSize: 11 }}>
        Your business will be reviewed before going live.
        <br />
        You can set up payments and menu items from your dashboard.
      </p>
    </div>
  );
}
