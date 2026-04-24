"use client";

import { useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";

interface GroupEditData {
  name: string;
  description: string | null;
  image_url: string | null;
  avatar_url: string | null;
  is_public: boolean;
}

interface GroupEditModalProps {
  groupId: string;
  group: GroupEditData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Record<string, unknown>) => void;
}

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--paper-warm)",
  border: "2px solid var(--rule-strong-c)",
  color: "var(--ink-strong)",
  fontFamily: "var(--font-body), Inter, sans-serif",
  fontSize: 14,
};

export default function GroupEditModal({ groupId, group, isOpen, onClose, onSave }: GroupEditModalProps) {
  const [editName, setEditName] = useState(group.name);
  const [editDesc, setEditDesc] = useState(group.description || "");
  const [editPublic, setEditPublic] = useState(group.is_public);
  const [coverPreview, setCoverPreview] = useState<string | null>(group.image_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(group.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const uploadImage = async (file: File, type: "cover" | "avatar"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("groupId", groupId);
    formData.append("type", type);
    const res = await fetch("/api/upload/group-image", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    let imageUrl = group.image_url;
    let avatarUrl = group.avatar_url;

    if (coverFile) {
      const url = await uploadImage(coverFile, "cover");
      if (url) imageUrl = url;
    }
    if (avatarFile) {
      const url = await uploadImage(avatarFile, "avatar");
      if (url) avatarUrl = url;
    }

    const res = await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDesc.trim() || null,
        is_public: editPublic,
        image_url: imageUrl,
        avatar_url: avatarUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      onSave(data.group);
      onClose();
    }
    setSaving(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, editName, editDesc, editPublic, coverFile, avatarFile, group.image_url, group.avatar_url]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        style={{ background: "color-mix(in srgb, var(--ink-strong) 55%, transparent)" }}
      />
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50"
        style={{
          background: "var(--paper)",
          borderTop: "3px solid var(--rule-strong-c)",
          borderLeft: "2px solid var(--rule-strong-c)",
          borderRight: "2px solid var(--rule-strong-c)",
        }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: "2px solid var(--rule-strong-c)" }}
        >
          <h3 className="c-card-t" style={{ fontSize: 13, color: "var(--ink-strong)" }}>
            EDIT GROUP
          </h3>
          <button
            onClick={onClose}
            className="p-1 press"
            style={{ color: "var(--ink-strong)" }}
            aria-label="Close"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cover Image */}
          <div>
            <label className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)" }}>
              COVER IMAGE
            </label>
            <div
              onClick={() => document.getElementById("edit-cover-input")?.click()}
              className="mt-1.5 relative w-full h-32 overflow-hidden cursor-pointer group"
              style={{
                background: "var(--paper-warm)",
                border: "2px dashed var(--rule-strong-c)",
              }}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    style={{ background: "color-mix(in srgb, var(--ink-strong) 45%, transparent)" }}
                  >
                    <span className="c-kicker" style={{ fontSize: 10, color: "var(--paper)" }}>
                      CHANGE COVER
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5">
                  <Icon name="photo" size={20} style={{ color: "var(--ink-strong)", opacity: 0.55 }} />
                  <span className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7 }}>
                    TAP TO UPLOAD COVER
                  </span>
                </div>
              )}
            </div>
            <input id="edit-cover-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setCoverFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)" }}>
              GROUP AVATAR
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                onClick={() => document.getElementById("edit-avatar-input")?.click()}
                className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group"
                style={{
                  background: "var(--paper-warm)",
                  border: "2px dashed var(--rule-strong-c)",
                }}
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--ink-strong) 45%, transparent)" }}
                    >
                      <Icon name="photo" size={14} style={{ color: "var(--paper)" }} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Icon name="photo" size={18} style={{ color: "var(--ink-strong)", opacity: 0.55 }} />
                  </div>
                )}
              </div>
              <span className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)", opacity: 0.7 }}>
                TAP TO UPLOAD AVATAR
              </span>
            </div>
            <input id="edit-avatar-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          {/* Name */}
          <div>
            <label className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)" }}>
              NAME
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 focus:outline-none"
              style={INPUT_STYLE}
            />
          </div>

          {/* Description */}
          <div>
            <label className="c-kicker" style={{ fontSize: 10, color: "var(--ink-strong)" }}>
              DESCRIPTION
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              className="w-full mt-1 px-4 py-2.5 focus:outline-none resize-none"
              style={INPUT_STYLE}
            />
          </div>

          {/* Privacy */}
          <div
            className="flex items-center justify-between py-2"
            style={{ borderTop: "2px solid var(--rule-strong-c)", borderBottom: "2px solid var(--rule-strong-c)" }}
          >
            <span className="c-kicker" style={{ fontSize: 11, color: "var(--ink-strong)" }}>
              PUBLIC GROUP
            </span>
            <button
              onClick={() => setEditPublic(!editPublic)}
              className="w-10 h-5 rounded-full transition-colors"
              style={{
                background: editPublic ? "var(--gold-c)" : "var(--paper-soft)",
                border: "2px solid var(--rule-strong-c)",
              }}
              aria-pressed={editPublic}
              aria-label="Toggle public"
            >
              <div
                className="w-3.5 h-3.5 rounded-full transition-transform"
                style={{
                  background: "var(--ink-strong)",
                  transform: editPublic ? "translateX(18px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!editName.trim() || saving}
            className="c-btn c-btn-primary press disabled:opacity-40 w-full"
          >
            {saving ? "SAVING…" : coverFile || avatarFile ? "UPLOAD & SAVE" : "SAVE CHANGES"}
          </button>
        </div>
      </div>
    </>
  );
}
