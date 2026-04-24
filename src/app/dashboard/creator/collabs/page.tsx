"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Badge from "@/components/ui/Badge";

type CollabStatus = "pending" | "accepted" | "declined";
type ContentType = "reel" | "video" | "post";

interface CollabProfile {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
}

interface InitiatedCollab {
  id: string;
  content_type: ContentType;
  content_id: string;
  initiator_split_pct: number;
  collaborator_split_pct: number;
  status: CollabStatus;
  created_at: string;
  collaborator: CollabProfile;
}

interface ReceivedCollab {
  id: string;
  content_type: ContentType;
  content_id: string;
  initiator_split_pct: number;
  collaborator_split_pct: number;
  status: CollabStatus;
  created_at: string;
  initiator: CollabProfile;
}

type ActiveTab = "sent" | "received";

const statusVariants: Record<CollabStatus, "gold" | "emerald" | "coral"> = {
  pending: "gold",
  accepted: "emerald",
  declined: "coral",
};

const contentTypeLabels: Record<ContentType, string> = {
  reel: "Reel",
  video: "Video",
  post: "Post",
};

function Avatar({ profile }: { profile: CollabProfile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.display_name}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-xs font-semibold text-white/60">
      {profile.display_name.charAt(0).toUpperCase()}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card border border-border-subtle p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 skeleton rounded w-2/3" />
          <div className="h-2.5 skeleton rounded w-1/3" />
        </div>
      </div>
      <div className="h-2.5 skeleton rounded w-1/2" />
    </div>
  );
}

// New Collab sheet (bottom sheet)
interface NewCollabSheetProps {
  onClose: () => void;
  onCreated: (collab: InitiatedCollab) => void;
  currentUserId: string;
}

function NewCollabSheet({ onClose, onCreated, currentUserId }: NewCollabSheetProps) {
  const [contentType, setContentType] = useState<ContentType>("reel");
  const [contentId, setContentId] = useState("");
  const [handle, setHandle] = useState("");
  const [splitPct, setSplitPct] = useState(50);
  const [resolvedProfile, setResolvedProfile] = useState<CollabProfile | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function lookupHandle() {
    const trimmed = handle.replace(/^@/, "").trim();
    if (!trimmed) return;
    setLookupError(null);
    setResolvedProfile(null);
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url")
      .eq("handle", trimmed)
      .single();
    if (data) {
      if (data.id === currentUserId) {
        setLookupError("You can't collab with yourself.");
      } else {
        setResolvedProfile(data as CollabProfile);
      }
    } else {
      setLookupError("No creator found with that handle.");
    }
  }

  async function handleSubmit() {
    if (!resolvedProfile) {
      setLookupError("Look up a collaborator first.");
      return;
    }
    if (!contentId.trim()) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("content_collabs")
        .insert({
          content_type: contentType,
          content_id: contentId.trim(),
          initiator_id: currentUserId,
          collaborator_id: resolvedProfile.id,
          initiator_split_pct: splitPct,
        })
        .select("*, collaborator:profiles!content_collabs_collaborator_id_fkey(id, display_name, handle, avatar_url)")
        .single();

      if (error) {
        showToast(error.message ?? "Failed to send collab request.");
      } else if (data) {
        onCreated(data as InitiatedCollab);
        showToast(`Collab request sent to @${resolvedProfile.handle ?? resolvedProfile.display_name}`);
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const collaboratorPct = 100 - splitPct;
  const collaboratorLabel = resolvedProfile
    ? `@${resolvedProfile.handle ?? resolvedProfile.display_name}`
    : "collaborator";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border border-white/10 rounded-t-3xl px-5 pt-5 pb-10 space-y-5 max-w-lg mx-auto">
        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />

        <div>
          <h2 className="font-heading font-bold text-white text-base">New Collab</h2>
          <p className="text-xs text-white/40 mt-0.5">Split revenue with another creator</p>
        </div>

        {/* Content type pills */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Content Type</p>
          <div className="flex gap-2">
            {(["reel", "video", "post"] as ContentType[]).map((t) => (
              <button
                key={t}
                onClick={() => setContentType(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  contentType === t
                    ? "bg-gold/15 border-gold/40 text-gold"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                {contentTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        {/* Content ID */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Content ID</p>
          <input
            type="text"
            placeholder="Paste content ID"
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40"
          />
        </div>

        {/* Collaborator handle */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Collaborator Handle</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 gap-1.5">
              <span className="text-white/40 text-sm">@</span>
              <input
                type="text"
                placeholder="handle"
                value={handle}
                onChange={(e) => {
                  setHandle(e.target.value);
                  setResolvedProfile(null);
                  setLookupError(null);
                }}
                onBlur={lookupHandle}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
              />
            </div>
            <button
              onClick={lookupHandle}
              className="px-3 py-2.5 bg-white/[0.07] border border-white/10 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Look up
            </button>
          </div>

          {/* Profile preview */}
          {resolvedProfile && (
            <div className="mt-2 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
              <Avatar profile={resolvedProfile} />
              <div>
                <p className="text-xs font-semibold text-emerald-400">{resolvedProfile.display_name}</p>
                {resolvedProfile.handle && (
                  <p className="text-[10px] text-white/40">@{resolvedProfile.handle}</p>
                )}
              </div>
            </div>
          )}
          {lookupError && (
            <p className="mt-1.5 text-xs text-red-400">{lookupError}</p>
          )}
        </div>

        {/* Split slider */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40 mb-2">Revenue Split</p>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-gold">You {splitPct}%</span>
            <span className="text-white/50">{collaboratorLabel} {collaboratorPct}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={splitPct}
            onChange={(e) => setSplitPct(Number(e.target.value))}
            className="w-full accent-[#D4AF37]"
          />
          <div className="flex justify-between text-[10px] text-white/25 mt-1">
            <span>10%</span>
            <span>90%</span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !contentId.trim() || !resolvedProfile}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
            !submitting && contentId.trim() && resolvedProfile
              ? "bg-gradient-to-r from-gold to-gold-light text-midnight"
              : "bg-white/5 text-white/25 cursor-not-allowed"
          }`}
        >
          {submitting ? "Sending..." : "Send Collab Request"}
        </button>
      </div>

      {/* Toast inside the sheet context */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </>
  );
}

export default function CollabsPage() {
  const [initiated, setInitiated] = useState<InitiatedCollab[]>([]);
  const [received, setReceived] = useState<ReceivedCollab[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sent");
  const [showSheet, setShowSheet] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function fetchCollabs() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        const [initiatedRes, receivedRes] = await Promise.all([
          supabase
            .from("content_collabs")
            .select(
              "*, collaborator:profiles!content_collabs_collaborator_id_fkey(id, display_name, handle, avatar_url)"
            )
            .eq("initiator_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("content_collabs")
            .select(
              "*, initiator:profiles!content_collabs_initiator_id_fkey(id, display_name, handle, avatar_url)"
            )
            .eq("collaborator_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        setInitiated((initiatedRes.data ?? []) as InitiatedCollab[]);
        setReceived((receivedRes.data ?? []) as ReceivedCollab[]);
      } finally {
        setLoading(false);
      }
    }

    fetchCollabs();
  }, []);

  async function handleCancel(collabId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("content_collabs")
      .delete()
      .eq("id", collabId);

    if (!error) {
      setInitiated((prev) => prev.filter((c) => c.id !== collabId));
      showToast("Collab request cancelled.");
    }
  }

  async function handleRespond(collabId: string, status: "accepted" | "declined") {
    const supabase = createClient();
    const { error } = await supabase
      .from("content_collabs")
      .update({ status })
      .eq("id", collabId);

    if (!error) {
      setReceived((prev) =>
        prev.map((c) => (c.id === collabId ? { ...c, status } : c))
      );
      showToast(status === "accepted" ? "Collab accepted!" : "Collab declined.");
    }
  }

  function handleCollabCreated(collab: InitiatedCollab) {
    setInitiated((prev) => [collab, ...prev]);
  }

  return (
    <div className="px-4 py-5 space-y-4 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-white">Collabs</h1>
          <p className="text-xs text-white/40 mt-0.5">Split revenue with other creators</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["sent", "received"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-1.5 rounded-full text-xs font-semibold border transition-all capitalize ${
              activeTab === tab
                ? "bg-gold/15 border-gold/40 text-gold"
                : "bg-white/5 border-white/10 text-white/50"
            }`}
          >
            {tab}
            {tab === "received" && received.filter((c) => c.status === "pending").length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold text-midnight text-[9px] font-bold">
                {received.filter((c) => c.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : activeTab === "sent" ? (
        initiated.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center border border-border-subtle">
            <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gold">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-white mb-1">No collabs sent yet</p>
            <p className="text-xs text-white/40 mb-5">Tap the + button to invite a creator to split earnings.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {initiated.map((collab) => (
              <div key={collab.id} className="rounded-2xl bg-card border border-border-subtle p-4">
                <div className="flex items-start gap-3">
                  <Avatar profile={collab.collaborator} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {collab.collaborator.display_name}
                    </p>
                    {collab.collaborator.handle && (
                      <p className="text-xs text-white/40">@{collab.collaborator.handle}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-white/60 uppercase tracking-wide">
                        {contentTypeLabels[collab.content_type]}
                      </span>
                      <Badge label={collab.status} variant={statusVariants[collab.status]} size="sm" />
                    </div>
                    <p className="mt-1.5 text-xs text-white/50">
                      You {collab.initiator_split_pct}%
                      <span className="text-white/25"> · </span>
                      @{collab.collaborator.handle ?? collab.collaborator.display_name} {collab.collaborator_split_pct}%
                    </p>
                  </div>
                  {collab.status === "pending" && (
                    <button
                      onClick={() => handleCancel(collab.id)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-xs font-semibold text-white/50 hover:text-red-400 hover:border-red-400/30 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : received.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center border border-border-subtle">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} className="text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-white mb-1">No collab invites</p>
          <p className="text-xs text-white/40">When another creator invites you to collab, it shows up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {received.map((collab) => (
            <div key={collab.id} className="rounded-2xl bg-card border border-border-subtle p-4">
              <div className="flex items-start gap-3">
                <Avatar profile={collab.initiator} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white leading-tight">
                    {collab.initiator.display_name}
                  </p>
                  {collab.initiator.handle && (
                    <p className="text-xs text-white/40">@{collab.initiator.handle}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-white/60 uppercase tracking-wide">
                      {contentTypeLabels[collab.content_type]}
                    </span>
                    <Badge label={collab.status} variant={statusVariants[collab.status]} size="sm" />
                  </div>
                  <p className="mt-1.5 text-xs text-white/50">
                    You get{" "}
                    <span className="text-gold font-semibold">{collab.collaborator_split_pct}%</span>
                  </p>
                </div>
              </div>

              {/* Action row for pending */}
              {collab.status === "pending" && (
                <div className="mt-3 flex gap-2 pl-12">
                  <button
                    onClick={() => handleRespond(collab.id, "accepted")}
                    className="flex-1 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(collab.id, "declined")}
                    className="flex-1 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white/50 text-xs font-semibold hover:text-white/70 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowSheet(true)}
        className="fixed bottom-20 right-4 z-20 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg text-midnight font-semibold text-sm"
        aria-label="New Collab"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Collab
      </button>

      {/* New Collab Sheet */}
      {showSheet && currentUserId && (
        <NewCollabSheet
          onClose={() => setShowSheet(false)}
          onCreated={handleCollabCreated}
          currentUserId={currentUserId}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-xl whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
