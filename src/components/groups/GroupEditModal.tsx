"use client";

import { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
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
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-deep border-t border-border-subtle rounded-t-2xl">
        <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm">Edit Group</h3>
          <button onClick={onClose} className="p-1 text-txt-secondary hover:text-white">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Cover Image */}
          <div>
            <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Cover Image</label>
            <div
              onClick={() => document.getElementById("edit-cover-input")?.click()}
              className="mt-1.5 relative w-full h-32 rounded-xl bg-white/5 border border-dashed border-border-subtle overflow-hidden cursor-pointer hover:border-gold/30 transition-colors group"
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">Change Cover</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5">
                  <Icon name="photo" size={20} className="text-txt-secondary" />
                  <span className="text-[11px] text-txt-secondary">Tap to upload cover</span>
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
            <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Group Avatar</label>
            <div className="mt-1.5 flex items-center gap-3">
              <div
                onClick={() => document.getElementById("edit-avatar-input")?.click()}
                className="relative w-16 h-16 rounded-full bg-white/5 border border-dashed border-border-subtle overflow-hidden cursor-pointer hover:border-gold/30 transition-colors group"
              >
                {avatarPreview ? (
                  <>
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icon name="photo" size={14} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Icon name="photo" size={18} className="text-txt-secondary" />
                  </div>
                )}
              </div>
              <span className="text-[11px] text-txt-secondary">Tap to upload avatar</span>
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
            <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider">Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3}
              className="w-full mt-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gold/40 resize-none"
            />
          </div>

          {/* Privacy */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-txt-secondary">Public Group</span>
            <button onClick={() => setEditPublic(!editPublic)}
              className={`w-10 h-5 rounded-full transition-colors ${editPublic ? "bg-emerald" : "bg-white/20"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${editPublic ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <Button onClick={handleSave} loading={saving} disabled={!editName.trim()} className="w-full">
            {coverFile || avatarFile ? "Upload & Save" : "Save Changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
