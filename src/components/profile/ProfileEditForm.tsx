"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

interface Profile {
  id: string;
  display_name: string;
  handle: string;
  bio: string | null;
  avatar_url: string | null;
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

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [handle, setHandle] = useState(profile.handle || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

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
          className="flex items-center gap-1.5 text-gold text-sm font-semibold press"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8l4-4" />
          </svg>
          Back
        </button>
      </div>

      <div className="px-5">
        <h1 className="font-heading text-2xl font-bold mb-1">Edit Profile</h1>
        <p className="text-sm text-txt-secondary mb-6">
          Update your profile information
        </p>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={handleAvatarClick}
            disabled={uploading}
            className="relative group press"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile photo"
                width={100}
                height={100}
                className="w-[100px] h-[100px] rounded-full object-cover ring-4 ring-midnight shadow-lg shadow-gold/20"
              />
            ) : (
              <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-midnight font-heading font-bold text-3xl ring-4 ring-midnight shadow-lg shadow-gold/20">
                {initials}
              </div>
            )}

            {/* Upload overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 16V8m0 0l-3 3m3-3l3 3" />
                  <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" />
                </svg>
              )}
            </div>

            {profile.verification_status === "verified" && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald flex items-center justify-center ring-2 ring-midnight">
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
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

          <p className="text-xs text-txt-secondary mt-3">
            {uploading ? "Uploading..." : "Tap to change photo"}
          </p>
          <div className="flex gap-1.5 mt-2">
            <Badge label={profile.role.replace("_", " ")} variant="purple" />
            {profile.district && (
              <Badge label={`District ${profile.district}`} variant="cyan" />
            )}
          </div>
        </div>

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
              setHandle(
                e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, "")
              )
            }
            placeholder="your_handle"
            icon={
              <span className="text-txt-secondary text-sm">@</span>
            }
          />

          <div>
            <label className="block text-sm font-medium text-txt-secondary mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              className="w-full bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 min-h-[100px] resize-none transition-colors"
              placeholder="Tell people about yourself or your role..."
            />
            <p className="text-right text-[10px] text-txt-secondary mt-1">
              {bio.length}/300
            </p>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <Card className="mt-4 border-coral/20 bg-coral/5">
            <p className="text-sm text-coral">{error}</p>
          </Card>
        )}
        {success && (
          <Card className="mt-4 border-emerald/20 bg-emerald/5">
            <p className="text-sm text-emerald">Profile updated successfully!</p>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-3 mt-6 mb-8">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex-1 bg-gold text-midnight font-bold text-sm py-3.5 rounded-xl press hover:bg-gold-light transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3.5 rounded-xl bg-white/5 text-txt-secondary font-medium text-sm press hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
