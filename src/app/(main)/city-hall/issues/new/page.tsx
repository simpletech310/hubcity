"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { createClient } from "@/lib/supabase/client";
import { generateIssueTitle, ISSUE_DEPARTMENT_MAP } from "@/lib/hashtags";

const ISSUE_TYPES = [
  { key: "pothole", iconName: "alert" as IconName, label: "Pothole" },
  { key: "streetlight", iconName: "lightbulb" as IconName, label: "Streetlight" },
  { key: "graffiti", iconName: "palette" as IconName, label: "Graffiti" },
  { key: "trash", iconName: "trash" as IconName, label: "Trash" },
  { key: "flooding", iconName: "rain" as IconName, label: "Flooding" },
  { key: "parking", iconName: "parking" as IconName, label: "Parking" },
  { key: "noise", iconName: "megaphone" as IconName, label: "Noise" },
  { key: "sidewalk", iconName: "person" as IconName, label: "Sidewalk" },
  { key: "tree", iconName: "tree" as IconName, label: "Tree" },
  { key: "parks", iconName: "tree" as IconName, label: "Parks" },
  { key: "water", iconName: "rain" as IconName, label: "Water" },
  { key: "stray", iconName: "heart-pulse" as IconName, label: "Stray Animal" },
  { key: "safety", iconName: "shield" as IconName, label: "Safety" },
  { key: "other", iconName: "document" as IconName, label: "Other" },
] as const;

type IssueTypeKey = (typeof ISSUE_TYPES)[number]["key"];

interface CreatedIssue {
  id: string;
  title: string;
  type: string;
  status: string;
}

export default function ReportIssuePage() {
  const [selectedType, setSelectedType] = useState<IssueTypeKey | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [district, setDistrict] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<CreatedIssue | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTypeSelect(type: IssueTypeKey) {
    setSelectedType(type);
    const autoTitle = generateIssueTitle(type, locationText || null);
    setTitle(autoTitle);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in to upload photos");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload photo. Please try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationText(
          `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`
        );
        setLocating(false);
        // Update title with location if type is selected
        if (selectedType) {
          const loc = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
          setTitle(generateIssueTitle(selectedType, loc));
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Could not get your location. Please enter it manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit() {
    if (!selectedType) {
      setError("Please select an issue type.");
      return;
    }
    if (!title.trim() && !description.trim()) {
      setError("Please provide a title or description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedType,
          title: title.trim() || generateIssueTitle(selectedType, locationText || null),
          description: description.trim() || null,
          location_text: locationText.trim() || null,
          latitude,
          longitude,
          district,
          image_url: imageUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit issue");
      }

      const { issue } = await res.json();
      setCreatedIssue(issue);
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (createdIssue) {
    return (
      <div className="animate-fade-in pb-24">
        <div className="px-5 pt-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">&#x2705;</span>
            </div>
            <h1 className="font-heading text-2xl font-bold mb-2">
              Issue Reported
            </h1>
            <p className="text-sm text-txt-secondary mb-1">
              Thank you for helping improve Compton.
            </p>
            <p className="text-sm text-txt-secondary mb-6">
              Your report has been submitted and assigned to{" "}
              <span className="text-gold font-semibold">
                {ISSUE_DEPARTMENT_MAP[createdIssue.type]?.department || "City Hall"}
              </span>.
            </p>

            <Card className="text-left mb-6">
              <div className="flex items-center gap-3">
                <Icon name={ISSUE_TYPES.find((t) => t.key === createdIssue.type)?.iconName || "document"} size={24} className="text-gold" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{createdIssue.title}</p>
                  <p className="text-xs text-txt-secondary">
                    Status: <span className="text-gold">Reported</span>
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Link href={`/city-hall/issues/${createdIssue.id}`}>
                <Button fullWidth variant="primary">
                  View Your Issue
                </Button>
              </Link>
              <Link href="/city-hall/issues">
                <Button fullWidth variant="secondary">
                  Back to Issue Tracker
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-8">
          <Link
            href="/city-hall/issues"
            className="inline-flex items-center gap-1.5 text-gold text-sm font-semibold mb-4 press"
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            Issue Tracker
          </Link>
          <h1 className="font-heading text-2xl font-bold mb-1">
            Report an Issue
          </h1>
          <p className="text-sm text-txt-secondary">
            Help us fix problems in your neighborhood.
          </p>
        </div>
      </div>

      <div className="px-5 space-y-5 mt-4">
        {/* Error Banner */}
        {error && (
          <div className="rounded-xl bg-coral/10 border border-coral/30 p-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* Step 1: Issue Type */}
        <div>
          <label className="block text-sm font-bold mb-3">
            What type of issue? <span className="text-coral">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ISSUE_TYPES.map((type) => (
              <button
                key={type.key}
                onClick={() => handleTypeSelect(type.key)}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl border transition-all press
                  ${
                    selectedType === type.key
                      ? "bg-gold/10 border-gold/50 ring-1 ring-gold/30"
                      : "bg-card border-border-subtle hover:border-border-subtle/80"
                  }
                `}
              >
                <Icon name={type.iconName} size={22} />
                <span className="text-[10px] text-txt-secondary leading-tight text-center">
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Title */}
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="issue-title">
            Title
          </label>
          <input
            id="issue-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={selectedType ? "Auto-generated, but you can edit" : "Select a type first"}
            className="w-full bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
          />
        </div>

        {/* Step 3: Description */}
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="issue-desc">
            Description
          </label>
          <textarea
            id="issue-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="w-full bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all resize-none"
          />
        </div>

        {/* Step 4: Photo */}
        <div>
          <label className="block text-sm font-bold mb-2">Photo</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border-subtle">
              <Image
                src={imagePreview}
                alt="Issue photo preview"
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
              {uploading && (
                <div className="absolute inset-0 bg-midnight/70 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-midnight/80 flex items-center justify-center text-white press"
              >
                &#x2715;
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-card border border-dashed border-border-subtle rounded-xl py-8 text-sm text-txt-secondary hover:border-gold/30 transition-all press"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
              Add a Photo
            </button>
          )}
        </div>

        {/* Step 5: Location */}
        <div>
          <label className="block text-sm font-bold mb-2" htmlFor="issue-location">
            Location
          </label>
          <div className="flex gap-2">
            <input
              id="issue-location"
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Compton Blvd near Central Ave"
              className="flex-1 bg-card border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary/50 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all"
            />
            <button
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="shrink-0 px-3 bg-card border border-border-subtle rounded-xl text-gold text-xs font-semibold hover:bg-gold/5 transition-all press disabled:opacity-50"
            >
              {locating ? (
                <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-1">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                  GPS
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Step 6: District */}
        <div>
          <label className="block text-sm font-bold mb-2">District</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((d) => (
              <button
                key={d}
                onClick={() => setDistrict(district === d ? null : d)}
                className={`
                  flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all press
                  ${
                    district === d
                      ? "bg-gold/10 border-gold/50 text-gold ring-1 ring-gold/30"
                      : "bg-card border-border-subtle text-txt-secondary hover:border-border-subtle/80"
                  }
                `}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-txt-secondary mt-1.5">
            Not sure? Leave blank and we&apos;ll figure it out.
          </p>
        </div>

        {/* Department Preview */}
        {selectedType && ISSUE_DEPARTMENT_MAP[selectedType] && (
          <div className="rounded-xl bg-gold/5 border border-gold/20 p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              <span className="text-sm">\uD83C\uDFDB\uFE0F</span>
            </div>
            <div>
              <p className="text-xs text-txt-secondary">Will be routed to</p>
              <p className="text-sm font-semibold text-gold">
                {ISSUE_DEPARTMENT_MAP[selectedType].department}
              </p>
            </div>
          </div>
        )}

        {/* Submit */}
        <Button
          fullWidth
          size="lg"
          loading={submitting}
          disabled={!selectedType || uploading}
          onClick={handleSubmit}
        >
          Submit Report
        </Button>

        <p className="text-[10px] text-txt-secondary text-center pb-4">
          Reports are public and help the city prioritize improvements.
        </p>
      </div>
    </div>
  );
}
