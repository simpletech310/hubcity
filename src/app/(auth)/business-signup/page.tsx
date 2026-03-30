"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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

const COMPTON_ZIPS = ["90220", "90221", "90222", "90223", "90224", "90059", "90061", "90262"];

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
    if (!COMPTON_ZIPS.includes(zip.trim())) {
      return "Business must be in Compton, CA. Valid ZIPs: 90220-90224";
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

    const address = `${street.trim()}, Compton, CA ${zip.trim()}`;

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
    <div className="max-w-[430px] mx-auto min-h-dvh bg-midnight flex flex-col px-6 py-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 justify-center">
        <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-light rounded-xl flex items-center justify-center font-heading font-extrabold text-xl text-midnight">
          HC
        </div>
        <span className="font-heading font-bold text-2xl tracking-tight">
          Hub<span className="text-gold">City</span>
        </span>
      </div>

      <h1 className="font-heading text-2xl font-bold text-center mb-1">
        Register Your Business
      </h1>
      <p className="text-txt-secondary text-sm text-center mb-6">
        Join the Compton business community
      </p>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`w-full h-1.5 rounded-full transition-colors ${
                s <= step
                  ? "bg-gradient-to-r from-gold to-gold-light"
                  : "bg-white/10"
              }`}
            />
            <span
              className={`text-[10px] font-medium ${
                s <= step ? "text-gold" : "text-txt-secondary"
              }`}
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
            placeholder="e.g. Compton Soul Kitchen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BusinessCategory)}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-midnight">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              Description
            </label>
            <textarea
              placeholder="Tell the community about your business..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 2: Location & Contact */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Street Address"
            placeholder="123 S Compton Ave"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            required
          />
          <Input
            label="ZIP Code"
            placeholder="90220"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            maxLength={5}
            required
            error={
              zip.length === 5 && !COMPTON_ZIPS.includes(zip)
                ? "Must be a Compton ZIP code"
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
          <p className="text-xs text-txt-secondary mb-2">
            Set your hours for each day. Toggle off for closed days.
          </p>
          {DAYS.map((day) => {
            const key = day.toLowerCase();
            const h = hours[key];
            return (
              <div
                key={day}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-border-subtle"
              >
                <div className="w-20 shrink-0">
                  <span className="text-sm font-medium">{day.slice(0, 3)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateHours(key, "closed", !h.closed)}
                  className={`w-10 h-5 rounded-full transition-colors shrink-0 ${
                    !h.closed ? "bg-gold" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${
                      !h.closed ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                {!h.closed ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="time"
                      value={h.open}
                      onChange={(e) => updateHours(key, "open", e.target.value)}
                      className="bg-transparent border border-border-subtle rounded-lg px-2 py-1 text-xs text-white w-[90px] focus:outline-none focus:border-gold/40"
                    />
                    <span className="text-xs text-txt-secondary">to</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={(e) => updateHours(key, "close", e.target.value)}
                      className="bg-transparent border border-border-subtle rounded-lg px-2 py-1 text-xs text-white w-[90px] focus:outline-none focus:border-gold/40"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-txt-secondary italic">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl border border-border-subtle p-4 space-y-3">
            <h3 className="font-heading font-semibold text-gold text-sm">
              Business Info
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-txt-secondary">Name:</span> {name}
              </p>
              <p>
                <span className="text-txt-secondary">Category:</span>{" "}
                {BUSINESS_CATEGORIES.find((c) => c.value === category)?.label}
              </p>
              {description && (
                <p>
                  <span className="text-txt-secondary">Description:</span>{" "}
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-border-subtle p-4 space-y-3">
            <h3 className="font-heading font-semibold text-gold text-sm">
              Location & Contact
            </h3>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-txt-secondary">Address:</span>{" "}
                {street}, Compton, CA {zip}
              </p>
              {phone && (
                <p>
                  <span className="text-txt-secondary">Phone:</span> {phone}
                </p>
              )}
              {website && (
                <p>
                  <span className="text-txt-secondary">Website:</span> {website}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-border-subtle p-4 space-y-3">
            <h3 className="font-heading font-semibold text-gold text-sm">
              Business Hours
            </h3>
            <div className="space-y-1 text-sm">
              {DAYS.map((day) => {
                const key = day.toLowerCase();
                const h = hours[key];
                return (
                  <div key={day} className="flex justify-between">
                    <span className="text-txt-secondary">{day.slice(0, 3)}</span>
                    <span>
                      {h.closed ? (
                        <span className="text-txt-secondary italic">Closed</span>
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
        <p className="text-sm text-coral bg-coral/10 rounded-lg px-3 py-2 mt-4">
          {error}
        </p>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 mt-6">
        {step > 1 && (
          <Button variant="secondary" onClick={prevStep} className="flex-1">
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button onClick={nextStep} className="flex-1">
            Continue
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Create Business
          </Button>
        )}
      </div>

      <p className="text-xs text-txt-secondary text-center mt-6">
        Your business will be reviewed before going live.
        <br />
        You can set up payments and menu items from your dashboard.
      </p>
    </div>
  );
}
