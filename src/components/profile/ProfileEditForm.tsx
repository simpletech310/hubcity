"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

interface Profile {
  id: string;
  display_name: string;
  handle: string;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  social_links: Record<string, string> | null;
  profile_tags: string[] | null;
  city_id: string | null;
  role: string;
  district: number | null;
  verification_status: string;
}

interface Props {
  profile: Profile;
}

export default function ProfileEditForm({ profile }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Core fields
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [handle, setHandle] = useState(profile.handle || "");
  const [bio, setBio] = useState(profile.bio || "");

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [uploading, setUploading] = useState(false);

  // Cover
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || "");
  const [coverPreview, setCoverPreview] = useState(profile.cover_url || "");
  const [coverUploading, setCoverUploading] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>(profile.profile_tags ?? []);
  const [tagInput, setTagInput] = useState("");

  // Social links
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || "");
  const [instagramHandle, setInstagramHandle] = useState(
    profile.social_links?.instagram || ""
  );
  const [tiktokHandle, setTiktokHandle] = useState(
    profile.social_links?.tiktok || ""
  );
  const [twitterHandle, setTwitterHandle] = useState(
    profile.social_links?.twitter || ""
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  // ── Avatar ──────────────────────────────────────────────────────────────────

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar_url);
      setAvatarPreview(data.avatar_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
      setAvatarPreview(profile.avatar_url || "");
    } finally {
      setUploading(false);
    }
  };

  // ── Cover ───────────────────────────────────────────────────────────────────

  const handleCoverClick = () => coverInputRef.current?.click();

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setCoverUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar?type=cover", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setCoverUrl(data.cover_url ?? data.url);
      setCoverPreview(data.cover_url ?? data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload cover photo");
      setCoverPreview(profile.cover_url || "");
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Tags ────────────────────────────────────────────────────────────────────

  const addTag = (value: string) => {
    const cleaned = value.trim().toLowerCase().replace(/^#/, "");
    if (!cleaned || tags.includes(cleaned) || tags.length >= 5) return;
    setTags([...tags, cleaned]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          handle: handle.trim(),
          bio: bio.trim() || null,
          cover_url: coverUrl || null,
          website_url: websiteUrl.trim() || null,
          social_links: {
            instagram: instagramHandle.trim(),
            tiktok: tiktokHandle.trim(),
            twitter: twitterHandle.trim(),
          },
          profile_tags: tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setSuccess(true);
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 press c-kicker"
          style={{ color: "var(--ink-strong)", fontSize: 11, letterSpacing: "0.14em" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8l4-4" />
          </svg>
          BACK
        </button>
      </div>

      <div className="px-5">
        <h1 className="c-hero mb-1" style={{ fontSize: 32, color: "var(--ink-strong)" }}>
          Edit Profile
        </h1>
        <p
          className="c-serif-it mb-6"
          style={{ fontSize: 13, color: "var(--ink-strong)", opacity: 0.7 }}
        >
          Update your profile information
        </p>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-6">
          <button onClick={handleAvatarClick} disabled={uploading} className="relative group press">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile photo"
                width={100}
                height={100}
                className="w-[100px] h-[100px] rounded-full object-cover"
                style={{ border: "3px solid var(--rule-strong-c)" }}
              />
            ) : (
              <div
                className="w-[100px] h-[100px] rounded-full flex items-center justify-center c-hero"
                style={{
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "3px solid var(--rule-strong-c)",
                  fontSize: 36,
                  lineHeight: 1,
                }}
              >
                {initials}
              </div>
            )}
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(10,10,10,0.6)" }}
            >
              {uploading ? (
                <div
                  className="w-6 h-6 rounded-full animate-spin"
                  style={{
                    border: "2px solid rgba(245,239,224,0.3)",
                    borderTopColor: "var(--paper)",
                  }}
                />
              ) : (
                <svg width="24" height="24" fill="none" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 16V8m0 0l-3 3m3-3l3 3" />
                  <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
                </svg>
              )}
            </div>
            {profile.verification_status === "verified" && (
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--gold-c)",
                  border: "2px solid var(--rule-strong-c)",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="var(--ink-strong)" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 7l3 3 5-5" />
                </svg>
              </div>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <p
            className="c-kicker mt-3"
            style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.6, letterSpacing: "0.14em" }}
          >
            {uploading ? "UPLOADING…" : "TAP TO CHANGE PHOTO"}
          </p>
          <div className="flex gap-1.5 mt-2">
            <Badge label={profile.role.replace("_", " ")} variant="gold" />
            {profile.district && (
              <Badge label={`District ${profile.district}`} variant="gold" />
            )}
          </div>
        </div>

        {/* Cover photo — 3:1 aspect banner */}
        <div
          className="relative w-full aspect-[3/1] overflow-hidden mb-8"
          style={{
            background: "var(--paper-warm)",
            border: "2px solid var(--rule-strong-c)",
          }}
        >
          {coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="var(--ink-strong)"
                strokeOpacity="0.35"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 15l4-4 3 3 4-5 7 6" />
                <circle cx="8.5" cy="9.5" r="1.5" />
              </svg>
              <p
                className="c-kicker"
                style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.4, letterSpacing: "0.14em" }}
              >
                ADD COVER PHOTO
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleCoverClick}
            disabled={coverUploading}
            className="absolute inset-0 transition flex items-center justify-center group"
          >
            <span
              className="px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity c-kicker"
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                border: "2px solid var(--gold-c)",
                fontSize: 10,
                letterSpacing: "0.14em",
              }}
            >
              {coverUploading ? "UPLOADING…" : coverPreview ? "CHANGE COVER" : "ADD COVER"}
            </span>
          </button>
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleCoverChange}
          className="hidden"
        />

        {/* Form Fields */}
        <div className="space-y-5">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <Input
            label="Handle"
            value={handle}
            onChange={(e) =>
              setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            placeholder="your_handle"
            icon={<span className="text-txt-secondary text-sm">@</span>}
          />

          <div>
            <label
              className="block c-kicker mb-1.5"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              BIO
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              className="w-full px-4 py-3 focus:outline-none min-h-[100px] resize-none transition-colors"
              style={{
                background: "var(--paper-warm)",
                border: "2px solid var(--rule-strong-c)",
                color: "var(--ink-strong)",
                fontSize: 14,
                fontFamily: "var(--font-fraunces), serif",
              }}
              placeholder="Tell people about yourself or your role..."
            />
            <p
              className="text-right mt-1 c-kicker"
              style={{ fontSize: 9, color: "var(--ink-strong)", opacity: 0.5, letterSpacing: "0.1em" }}
            >
              {bio.length}/300
            </p>
          </div>

          {/* Tags */}
          <div>
            <label
              className="block c-kicker mb-1"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              TAGS
            </label>
            <p
              className="c-serif-it mb-2"
              style={{ fontSize: 12, color: "var(--ink-strong)", opacity: 0.6 }}
            >
              Add up to 5 tags that describe your content (e.g. music, food, fashion)
            </p>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 c-kicker"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                      color: "var(--ink-strong)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                    }}
                  >
                    #{tag.toUpperCase()}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 leading-none"
                      style={{ color: "var(--ink-strong)", opacity: 0.7 }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            {tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  ref={tagInputRef}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 px-4 py-2.5 focus:outline-none transition-colors"
                  style={{
                    background: "var(--paper-warm)",
                    border: "2px solid var(--rule-strong-c)",
                    color: "var(--ink-strong)",
                    fontSize: 14,
                    fontFamily: "var(--font-archivo), Archivo, sans-serif",
                  }}
                />
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="c-btn c-btn-outline press"
                >
                  ADD
                </button>
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <label
              className="block c-kicker"
              style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7, letterSpacing: "0.14em" }}
            >
              SOCIAL LINKS
            </label>

            <Input
              label="Website"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
            />

            <Input
              label="Instagram"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
              placeholder="handle (no @)"
              icon={<span className="text-txt-secondary text-sm">@</span>}
            />

            <Input
              label="TikTok"
              value={tiktokHandle}
              onChange={(e) => setTiktokHandle(e.target.value.replace(/^@/, ""))}
              placeholder="handle (no @)"
              icon={<span className="text-txt-secondary text-sm">@</span>}
            />

            <Input
              label="Twitter / X"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ""))}
              placeholder="handle (no @)"
              icon={<span className="text-txt-secondary text-sm">@</span>}
            />
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div
            className="mt-4 px-4 py-3"
            style={{
              background: "var(--ink-strong)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--gold-c)",
              fontSize: 13,
              fontFamily: "var(--font-archivo-narrow), sans-serif",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mt-4 px-4 py-3 c-kicker"
            style={{
              background: "var(--gold-c)",
              border: "2px solid var(--rule-strong-c)",
              color: "var(--ink-strong)",
              fontSize: 12,
              letterSpacing: "0.14em",
            }}
          >
            PROFILE UPDATED SUCCESSFULLY
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 mt-6 mb-8">
          <button
            onClick={handleSave}
            disabled={saving || uploading || coverUploading}
            className="flex-1 c-btn c-btn-primary press disabled:opacity-50"
          >
            {saving ? "SAVING…" : "SAVE CHANGES"}
          </button>
          <button
            onClick={() => router.back()}
            className="c-btn c-btn-outline press"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
