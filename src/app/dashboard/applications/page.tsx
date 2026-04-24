"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import type { ApplicationStatus, GrantApplication, Profile, Resource } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppWithRelations = GrantApplication & {
  applicant: Pick<Profile, "id" | "display_name" | "avatar_url"> | null;
  resource: Pick<Resource, "id" | "name" | "category" | "max_spots" | "filled_spots" | "contact_email" | "contact_name"> | null;
};

type OutcomeValue = "housed" | "employed" | "enrolled" | "other" | "no_update";

interface SimilarResource {
  id: string;
  name: string;
  category: string;
  organization: string | null;
}

// DB status → kanban column mapping
type KanbanCol = "new" | "reviewing" | "approved" | "waitlisted" | "closed";

const STATUS_TO_COL: Record<ApplicationStatus, KanbanCol> = {
  submitted: "new",
  under_review: "reviewing",
  approved: "approved",
  waitlisted: "waitlisted",
  denied: "closed",
  referred: "closed",
  enrolled: "approved",
  completed: "closed",
  withdrawn: "closed",
};

// When we move a card to a column, pick the canonical DB status for that col
const COL_TO_STATUS: Record<KanbanCol, ApplicationStatus> = {
  new: "submitted",
  reviewing: "under_review",
  approved: "approved",
  waitlisted: "waitlisted",
  closed: "denied",
};

interface ColDef {
  id: KanbanCol;
  label: string;
  colorClass: string;       // Tailwind text color
  bgClass: string;          // Tailwind bg for badge
  borderClass: string;      // Tailwind border
  dotClass: string;         // indicator dot
}

const COLUMNS: ColDef[] = [
  {
    id: "new",
    label: "New",
    colorClass: "text-[#60a5fa]",
    bgClass: "bg-[#60a5fa]/15",
    borderClass: "border-[#60a5fa]/30",
    dotClass: "bg-[#60a5fa]",
  },
  {
    id: "reviewing",
    label: "Reviewing",
    colorClass: "text-[#fbbf24]",
    bgClass: "bg-[#fbbf24]/15",
    borderClass: "border-[#fbbf24]/30",
    dotClass: "bg-[#fbbf24]",
  },
  {
    id: "approved",
    label: "Approved",
    colorClass: "text-[#34d399]",
    bgClass: "bg-[#34d399]/15",
    borderClass: "border-[#34d399]/30",
    dotClass: "bg-[#34d399]",
  },
  {
    id: "waitlisted",
    label: "Waitlist",
    colorClass: "text-[#a78bfa]",
    bgClass: "bg-[#a78bfa]/15",
    borderClass: "border-[#a78bfa]/30",
    dotClass: "bg-[#a78bfa]",
  },
  {
    id: "closed",
    label: "Closed",
    colorClass: "text-[#9ca3af]",
    bgClass: "bg-[#9ca3af]/15",
    borderClass: "border-[#9ca3af]/30",
    dotClass: "bg-[#9ca3af]",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ col }: { col: ColDef }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${col.bgClass} ${col.colorClass}`}
    >
      {col.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Application Card
// ---------------------------------------------------------------------------

interface AppCardProps {
  app: AppWithRelations;
  col: ColDef;
  onAction: (id: string, status: ApplicationStatus) => void;
  onTap: (app: AppWithRelations) => void;
  isUpdating: boolean;
  outcomeLogged: boolean;
  onLogOutcome: (app: AppWithRelations) => void;
  referralData: { show: boolean; resources: SimilarResource[] } | null;
  onDismissReferral: (appId: string) => void;
}

function AppCard({
  app,
  col,
  onAction,
  onTap,
  isUpdating,
  outcomeLogged,
  onLogOutcome,
  referralData,
  onDismissReferral,
}: AppCardProps) {
  const applicantName = app.applicant?.display_name || "Applicant";
  const resourceName = app.resource?.name || "Resource";

  return (
    <button
      type="button"
      onClick={() => onTap(app)}
      className="w-full text-left bg-[#1a1a1a] border border-white/8 rounded-2xl p-4 space-y-3 active:scale-[0.98] transition-transform"
      style={{ minHeight: 44 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{applicantName}</p>
          <p className="text-xs text-[#C9A84C] mt-0.5 truncate">{resourceName}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {outcomeLogged && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#34d399]/15 text-[#34d399]">
              Outcome logged
            </span>
          )}
          <StatusBadge col={col} />
        </div>
      </div>

      {/* Date */}
      <p className="text-xs text-white/40">{timeAgo(app.created_at)}</p>

      {/* Quick actions */}
      <div
        className="flex gap-2 flex-wrap"
        onClick={(e) => e.stopPropagation()} // prevent card tap when tapping buttons
      >
        {col.id === "new" && (
          <>
            <ActionBtn
              label="Review"
              colorClass="text-[#60a5fa] border-[#60a5fa]/30"
              onClick={() => onAction(app.id, "under_review")}
              disabled={isUpdating}
            />
            <ActionBtn
              label="Decline"
              colorClass="text-[#9ca3af] border-white/10"
              onClick={() => onAction(app.id, "denied")}
              disabled={isUpdating}
            />
          </>
        )}
        {col.id === "reviewing" && (
          <>
            <ActionBtn
              label="Approve"
              colorClass="text-[#34d399] border-[#34d399]/30"
              onClick={() => onAction(app.id, "approved")}
              disabled={isUpdating}
            />
            <ActionBtn
              label="Waitlist"
              colorClass="text-[#a78bfa] border-[#a78bfa]/30"
              onClick={() => onAction(app.id, "waitlisted")}
              disabled={isUpdating}
            />
          </>
        )}
        {col.id === "approved" && (
          <>
            <ActionBtn
              label="Contact"
              colorClass="text-[#C9A84C] border-[#C9A84C]/30"
              onClick={() => {
                const email = app.resource?.contact_email;
                if (email) window.open(`mailto:${email}`);
              }}
              disabled={isUpdating}
            />
            {!outcomeLogged && (
              <ActionBtn
                label="Log outcome"
                colorClass="text-[#a78bfa] border-[#a78bfa]/30"
                onClick={() => onLogOutcome(app)}
                disabled={isUpdating}
              />
            )}
          </>
        )}
      </div>

      {/* Referral prompt for waitlisted/closed */}
      {referralData?.show && (
        <div onClick={(e) => e.stopPropagation()}>
          <ReferralPrompt
            similarResources={referralData.resources}
            onDismiss={() => onDismissReferral(app.id)}
          />
        </div>
      )}
    </button>
  );
}

function ActionBtn({
  label,
  colorClass,
  onClick,
  disabled,
}: {
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${colorClass} bg-transparent disabled:opacity-40 active:opacity-70 transition-opacity`}
      style={{ minHeight: 36 }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Bottom Sheet — full application detail
// ---------------------------------------------------------------------------

interface BottomSheetProps {
  app: AppWithRelations | null;
  onClose: () => void;
  onAction: (id: string, status: ApplicationStatus) => void;
  isUpdating: boolean;
  mounted: boolean;
}

function BottomSheet({ app, onClose, onAction, isUpdating, mounted }: BottomSheetProps) {
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (app) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [app]);

  // Lock body scroll
  useEffect(() => {
    if (!app) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [app]);

  // Escape key
  useEffect(() => {
    if (!app) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  function handleClose() {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, 280);
  }

  if (!mounted || !app) return null;

  const col = COLUMNS.find((c) => c.id === STATUS_TO_COL[app.status]) ?? COLUMNS[0];
  const applicantName = app.applicant?.display_name || "Applicant";
  const resourceName = app.resource?.name || "Unknown Resource";
  const hasFormData = app.form_data && Object.keys(app.form_data).length > 0;
  const isClosed = col.id === "closed";

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-280 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-[#111] rounded-t-3xl max-h-[85vh] overflow-y-auto transition-transform duration-280 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pt-2 pb-8 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">{applicantName}</h2>
              <p className="text-sm text-[#C9A84C] mt-0.5">{resourceName}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Meta info */}
          <div className="bg-white/5 rounded-2xl p-4 space-y-3">
            <Row label="Status">
              <StatusBadge col={col} />
            </Row>
            <Row label="Applied">
              <span className="text-sm text-white">{formatDate(app.created_at)}</span>
            </Row>
            {app.reviewed_at && (
              <Row label="Reviewed">
                <span className="text-sm text-white">{formatDate(app.reviewed_at)}</span>
              </Row>
            )}
            {app.resource?.contact_email && (
              <Row label="Contact">
                <a
                  href={`mailto:${app.resource.contact_email}`}
                  className="text-sm text-[#C9A84C] underline underline-offset-2"
                >
                  {app.resource.contact_email}
                </a>
              </Row>
            )}
          </div>

          {/* Form responses */}
          {hasFormData && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Responses</p>
              {Object.entries(app.form_data).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-white/40 mb-0.5">{key}</p>
                  <p className="text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Notes fields */}
          {app.reviewer_notes && (
            <NoteBlock label="Reviewer Notes" value={app.reviewer_notes} />
          )}
          {app.status_note && (
            <NoteBlock label="Status Note" value={app.status_note} />
          )}
          {app.internal_notes && (
            <NoteBlock label="Internal Notes" value={app.internal_notes} />
          )}

          {/* Action buttons */}
          {!isClosed && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</p>
              <div className="grid grid-cols-3 gap-2">
                {col.id !== "approved" && (
                  <SheetActionBtn
                    label="Approve"
                    colorClass="bg-[#34d399]/15 text-[#34d399] border-[#34d399]/20"
                    onClick={() => { onAction(app.id, "approved"); handleClose(); }}
                    disabled={isUpdating}
                  />
                )}
                {col.id !== "waitlisted" && (
                  <SheetActionBtn
                    label="Waitlist"
                    colorClass="bg-[#a78bfa]/15 text-[#a78bfa] border-[#a78bfa]/20"
                    onClick={() => { onAction(app.id, "waitlisted"); handleClose(); }}
                    disabled={isUpdating}
                  />
                )}
                <SheetActionBtn
                  label="Reject"
                  colorClass="bg-[#f87171]/15 text-[#f87171] border-[#f87171]/20"
                  onClick={() => { onAction(app.id, "denied"); handleClose(); }}
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-white/70">{value}</p>
    </div>
  );
}

function SheetActionBtn({
  label,
  colorClass,
  onClick,
  disabled,
}: {
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`py-3 rounded-2xl text-sm font-semibold border ${colorClass} disabled:opacity-40 active:opacity-70 transition-opacity`}
      style={{ minHeight: 44 }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Outcome Sheet
// ---------------------------------------------------------------------------

interface OutcomeSheetProps {
  app: AppWithRelations | null;
  onClose: () => void;
  onSubmitted: (appId: string) => void;
  mounted: boolean;
}

const OUTCOME_OPTIONS: { value: OutcomeValue; label: string }[] = [
  { value: "housed", label: "Housed" },
  { value: "employed", label: "Employed" },
  { value: "enrolled", label: "Enrolled" },
  { value: "other", label: "Other" },
  { value: "no_update", label: "No update" },
];

function OutcomeSheet({ app, onClose, onSubmitted, mounted }: OutcomeSheetProps) {
  const [visible, setVisible] = useState(false);
  const [outcome, setOutcome] = useState<OutcomeValue>("no_update");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (app) {
      setOutcome("no_update");
      setNotes("");
      setFollowUpDate("");
      setError(null);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [app]);

  useEffect(() => {
    if (!app) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [app]);

  useEffect(() => {
    if (!app) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  function handleClose() {
    setVisible(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, 280);
  }

  async function handleSubmit() {
    if (!app) return;
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error: insertError } = await supabase.from("resource_outcomes").insert({
        application_id: app.id,
        resource_id: app.resource_id,
        user_id: user.id,
        outcome,
        notes: notes.trim() || null,
        follow_up_date: followUpDate || null,
      });
      if (insertError) throw insertError;
      onSubmitted(app.id);
      handleClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log outcome");
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !app) return null;

  const applicantName = app.applicant?.display_name || "Applicant";
  const resourceName = app.resource?.name || "Resource";

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" aria-modal="true" role="dialog">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-280 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative bg-[#111] rounded-t-3xl max-h-[75vh] overflow-y-auto transition-transform duration-280 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
        <div className="px-5 pt-2 pb-8 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Log Outcome</h2>
              <p className="text-xs text-[#C9A84C] mt-0.5">{applicantName} · {resourceName}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Outcome select */}
          <div className="space-y-1.5">
            <p className="text-xs text-white/40 font-medium">Outcome</p>
            <div className="grid grid-cols-3 gap-2">
              {OUTCOME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcome(opt.value)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                    outcome === opt.value
                      ? "bg-[#C9A84C]/20 border-[#C9A84C]/50 text-[#C9A84C]"
                      : "bg-white/[0.03] border-white/[0.08] text-white/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-xs text-white/40 font-medium">Notes (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any context..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/25 resize-none focus:outline-none focus:border-[#C9A84C]/40"
            />
          </div>

          {/* Follow-up date */}
          <div className="space-y-1.5">
            <p className="text-xs text-white/40 font-medium">Follow-up date (optional)</p>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40 [color-scheme:dark]"
            />
          </div>

          {error && <p className="text-xs text-[#f87171]">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[#C9A84C] text-black disabled:opacity-40 active:opacity-70 transition-opacity"
            style={{ minHeight: 44 }}
          >
            {submitting ? "Saving…" : "Save Outcome"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// Referral Prompt
// ---------------------------------------------------------------------------

interface ReferralPromptProps {
  similarResources: SimilarResource[];
  onDismiss: () => void;
}

function ReferralPrompt({ similarResources, onDismiss }: ReferralPromptProps) {
  if (similarResources.length === 0) return null;
  return (
    <div className="mt-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-white">Refer to a similar resource?</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-white/30 hover:text-white/60 transition-colors"
          aria-label="Dismiss referral"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className="space-y-1.5">
        {similarResources.map((r) => (
          <button
            key={r.id}
            type="button"
            className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 hover:border-[#C9A84C]/30 transition-colors"
          >
            {r.name}{r.organization ? ` · ${r.organization}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page indicator dots
// ---------------------------------------------------------------------------

function PageDots({
  count,
  active,
  cols,
}: {
  count: number;
  active: number;
  cols: ColDef[];
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-200 ${
            i === active
              ? `w-5 h-2 ${cols[i].dotClass}`
              : "w-2 h-2 bg-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 bg-[#f87171] text-white text-sm font-medium rounded-2xl shadow-lg whitespace-nowrap">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ApplicationsKanban() {
  const [apps, setApps] = useState<AppWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AppWithRelations | null>(null);
  const [activeCol, setActiveCol] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Outcome logging
  const [outcomeApp, setOutcomeApp] = useState<AppWithRelations | null>(null);
  const [loggedOutcomeIds, setLoggedOutcomeIds] = useState<Set<string>>(new Set());

  // Referral prompt: appId → { show, resources }
  const [referralMap, setReferralMap] = useState<Record<string, { show: boolean; resources: SimilarResource[] }>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const prevAppsRef = useRef<AppWithRelations[]>([]);

  // Portal mount
  useEffect(() => setMounted(true), []);

  // Fetch applications
  const fetchApps = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); setRefreshing(false); return; }

    // Get this user's resource IDs
    const { data: resourceRows } = await supabase
      .from("resources")
      .select("id")
      .eq("created_by", user.id);

    const resourceIds = (resourceRows ?? []).map((r: { id: string }) => r.id);

    if (resourceIds.length === 0) {
      setApps([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data } = await supabase
      .from("grant_applications")
      .select(
        "*, applicant:profiles(id, display_name, avatar_url), resource:resources(id, name, category, max_spots, filled_spots, contact_email, contact_name)"
      )
      .in("resource_id", resourceIds)
      .order("created_at", { ascending: false });

    const fetched = (data ?? []) as AppWithRelations[];
    prevAppsRef.current = fetched;
    setApps(fetched);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchApps(false);
  }, [fetchApps]);

  // Scroll tracking for page indicator
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const colWidth = el.scrollWidth / COLUMNS.length;
      const idx = Math.round(el.scrollLeft / colWidth);
      setActiveCol(Math.min(Math.max(idx, 0), COLUMNS.length - 1));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Load similar resources for referral prompt
  const loadSimilarResources = useCallback(async (app: AppWithRelations) => {
    const category = app.resource?.category;
    const createdBy = app.resource; // We'll exclude same resource by id
    if (!category) return;

    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("id, name, category, organization")
      .eq("category", category)
      .eq("accepts_applications", true)
      .eq("is_published", true)
      .neq("id", app.resource_id)
      .limit(3);

    void createdBy; // suppress lint
    const similar = (data ?? []) as SimilarResource[];
    if (similar.length > 0) {
      setReferralMap((prev) => ({
        ...prev,
        [app.id]: { show: true, resources: similar },
      }));
    }
  }, []);

  // Optimistic status update
  const handleAction = useCallback(async (id: string, status: ApplicationStatus) => {
    setUpdatingId(id);

    // Optimistic: move card immediately
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, reviewed_at: new Date().toISOString() } : a))
    );

    // Trigger referral prompt when moving to waitlisted or denied
    if (status === "waitlisted" || status === "denied") {
      const app = prevAppsRef.current.find((a) => a.id === id) ??
        apps.find((a) => a.id === id);
      if (app) loadSimilarResources(app);
    }

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        // Revert
        setApps(prevAppsRef.current);
        setToast("Failed to update — changes reverted");
      } else {
        // Keep prevRef in sync
        prevAppsRef.current = prevAppsRef.current.map((a) =>
          a.id === id ? { ...a, status } : a
        );
      }
    } catch {
      setApps(prevAppsRef.current);
      setToast("Network error — changes reverted");
    } finally {
      setUpdatingId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSimilarResources]);

  // Stats
  const totalPending = apps.filter(
    (a) => a.status === "submitted" || a.status === "under_review"
  ).length;

  // Aggregate available spots across all resources (only unique resources)
  const resourceMap = new Map<string, { max_spots: number | null; filled_spots: number }>();
  apps.forEach((a) => {
    if (a.resource && !resourceMap.has(a.resource.id)) {
      resourceMap.set(a.resource.id, {
        max_spots: a.resource.max_spots ?? null,
        filled_spots: a.resource.filled_spots ?? 0,
      });
    }
  });
  const totalAvailable = Array.from(resourceMap.values()).reduce((sum, r) => {
    if (r.max_spots == null) return sum;
    return sum + Math.max(0, r.max_spots - r.filled_spots);
  }, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 rounded-full border-2 border-[#C9A84C] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Stats pills ──────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#34d399]/10 rounded-full">
          <span className="text-[#34d399] text-xs font-semibold">{totalAvailable}</span>
          <span className="text-white/50 text-xs">spots available</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fbbf24]/10 rounded-full">
          <span className="text-[#fbbf24] text-xs font-semibold">{totalPending}</span>
          <span className="text-white/50 text-xs">pending apps</span>
        </div>
        <button
          type="button"
          onClick={() => fetchApps(true)}
          disabled={refreshing}
          className="ml-auto w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white active:opacity-70 disabled:opacity-30 transition-opacity"
          aria-label="Refresh"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={refreshing ? "animate-spin" : ""}
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </button>
      </div>

      {/* ── Column headers (sticky) ──────────────────────────── */}
      <div className="px-3 pb-1 overflow-x-auto scrollbar-hide">
        {/* This mirrors the kanban scroll position visually via the same width */}
        <div
          className="flex gap-3"
          style={{ width: `calc(${COLUMNS.length} * (300px + 0.75rem))` }}
        >
          {COLUMNS.map((col) => {
            const count = apps.filter(
              (a) => STATUS_TO_COL[a.status] === col.id
            ).length;
            return (
              <div
                key={col.id}
                className="flex items-center gap-2 shrink-0"
                style={{ width: 300 }}
              >
                <span className={`text-sm font-bold ${col.colorClass}`}>
                  {col.label}
                </span>
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${col.bgClass} ${col.colorClass}`}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Kanban scroll area ───────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide px-3 pb-2"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          className="flex gap-3 h-full"
          style={{ width: `calc(${COLUMNS.length} * (300px + 0.75rem))` }}
        >
          {COLUMNS.map((col) => {
            const colApps = apps.filter(
              (a) => STATUS_TO_COL[a.status] === col.id
            );
            return (
              <div
                key={col.id}
                className="shrink-0 flex flex-col gap-3 overflow-y-auto py-1 scrollbar-hide"
                style={{
                  width: 300,
                  scrollSnapAlign: "start",
                  scrollSnapStop: "always",
                }}
              >
                {colApps.length === 0 ? (
                  <div
                    className="flex items-center justify-center h-28 rounded-2xl border border-dashed border-white/10"
                  >
                    <p className="text-xs text-white/25">No applications</p>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      col={col}
                      onAction={handleAction}
                      onTap={setSelectedApp}
                      isUpdating={updatingId === app.id}
                      outcomeLogged={loggedOutcomeIds.has(app.id)}
                      onLogOutcome={setOutcomeApp}
                      referralData={referralMap[app.id] ?? null}
                      onDismissReferral={(appId) =>
                        setReferralMap((prev) => ({
                          ...prev,
                          [appId]: { ...prev[appId], show: false },
                        }))
                      }
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Page indicator dots ──────────────────────────────── */}
      <PageDots count={COLUMNS.length} active={activeCol} cols={COLUMNS} />

      {/* ── Bottom sheet ─────────────────────────────────────── */}
      <BottomSheet
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onAction={handleAction}
        isUpdating={selectedApp ? updatingId === selectedApp.id : false}
        mounted={mounted}
      />

      {/* ── Outcome sheet ────────────────────────────────────── */}
      <OutcomeSheet
        app={outcomeApp}
        onClose={() => setOutcomeApp(null)}
        onSubmitted={(appId) =>
          setLoggedOutcomeIds((prev) => new Set([...prev, appId]))
        }
        mounted={mounted}
      />

      {/* ── Toast ────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
