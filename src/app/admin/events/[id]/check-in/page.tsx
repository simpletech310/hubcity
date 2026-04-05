"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

type CheckInResult =
  | { type: "success"; ticket_code: string; section_name: string | null; event_title: string | null }
  | { type: "already_checked_in"; ticket_code: string; checked_in_at: string }
  | { type: "invalid"; message: string };

type CheckInStats = {
  total_tickets: number;
  checked_in: number;
  by_section: Array<{ section_name: string; total: number; checked_in: number }>;
};

type ScanMode = "qr" | "manual";

export default function CheckInScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id as string;

  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [mode, setMode] = useState<ScanMode>("qr");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState<string>("");

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);

  // Auth check via Supabase client
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
          router.replace("/");
          return;
        }

        setAuthed(true);
      } catch {
        router.replace("/login");
      } finally {
        setAuthChecking(false);
      }
    };
    checkAuth();
  }, [router]);

  // Fetch event name via Supabase client
  useEffect(() => {
    if (!eventId || !authed) return;
    const fetchEvent = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("events")
          .select("title")
          .eq("id", eventId)
          .single();
        if (data?.title) setEventTitle(data.title);
      } catch {
        // no-op
      }
    };
    fetchEvent();
  }, [eventId, authed]);

  // Fetch check-in stats
  const fetchStats = useCallback(async () => {
    if (!eventId || !authed) return;
    try {
      const res = await fetch(`/api/events/${eventId}/check-in-stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // no-op
    } finally {
      setStatsLoading(false);
    }
  }, [eventId, authed]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Show result then auto-dismiss after 3 seconds
  const showResult = useCallback((r: CheckInResult) => {
    setResult(r);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setResult(null);
    }, 3000);
  }, []);

  // Submit ticket code for check-in
  const submitCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed || processing) return;
      setProcessing(true);
      try {
        const res = await fetch("/api/tickets/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticket_code: trimmed }),
        });
        const data = await res.json();
        if (res.ok) {
          showResult({
            type: "success",
            ticket_code: trimmed,
            section_name: data.section_name ?? null,
            event_title: data.event_title ?? null,
          });
          fetchStats();
        } else if (res.status === 409 && data.already_checked_in) {
          showResult({
            type: "already_checked_in",
            ticket_code: trimmed,
            checked_in_at: data.checked_in_at,
          });
        } else {
          showResult({
            type: "invalid",
            message: data.error ?? "Invalid ticket",
          });
        }
      } catch {
        showResult({ type: "invalid", message: "Network error. Try again." });
      } finally {
        setProcessing(false);
        setManualCode("");
      }
    },
    [processing, showResult, fetchStats]
  );

  // QR Scanner lifecycle
  useEffect(() => {
    if (!authed || mode !== "qr") return;

    // Small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      if (!scannerContainerRef.current) return;

      // Clean up any existing scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
        scannerRef.current = null;
      }

      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          submitCode(decodedText);
        },
        (_errorMessage) => {
          // scan frame errors are normal — ignore
        }
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, [authed, mode, submitCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

  if (authChecking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  const checkedIn = stats?.checked_in ?? 0;
  const total = stats?.total_tickets ?? 0;
  const pct = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-txt-secondary hover:text-white transition-colors text-sm press"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M11 14l-5-5 5-5" />
          </svg>
          Back
        </button>
      </div>

      <div className="mb-5">
        <h1 className="font-heading text-2xl font-bold mb-0.5">Check-In Scanner</h1>
        {eventTitle && (
          <p className="text-sm text-txt-secondary truncate">{eventTitle}</p>
        )}
      </div>

      {/* Live Stats Bar */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] text-txt-secondary font-semibold uppercase tracking-wider mb-0.5">
              Check-In Progress
            </p>
            {statsLoading ? (
              <div className="h-5 w-20 bg-white/[0.06] rounded animate-pulse" />
            ) : (
              <p className="font-heading font-bold text-lg">
                <span className="text-emerald">{checkedIn}</span>
                <span className="text-txt-secondary font-normal text-sm"> / {total} checked in</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-heading font-bold text-2xl text-gold">{pct}%</p>
            <p className="text-[10px] text-txt-secondary">attendance</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald/70 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Per-section breakdown */}
        {(stats?.by_section?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            {(stats?.by_section ?? []).map((s) => {
              const sPct = s.total > 0 ? Math.round((s.checked_in / s.total) * 100) : 0;
              return (
                <div key={s.section_name} className="flex items-center gap-2 text-xs">
                  <span className="text-txt-secondary w-28 truncate shrink-0">{s.section_name}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald/60 rounded-full transition-all duration-500"
                      style={{ width: `${sPct}%` }}
                    />
                  </div>
                  <span className="text-txt-secondary w-12 text-right shrink-0">
                    {s.checked_in}/{s.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Mode Toggle */}
      <div className="flex gap-1 mb-5 p-1 bg-card rounded-xl border border-border-subtle">
        {(["qr", "manual"] as ScanMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all press ${
              mode === m
                ? "bg-gold text-midnight font-semibold"
                : "text-txt-secondary hover:text-white"
            }`}
          >
            {m === "qr" ? "Scan QR" : "Manual Entry"}
          </button>
        ))}
      </div>

      {/* Result Notification */}
      {result && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl border flex items-start gap-3 animate-fade-in ${
            result.type === "success"
              ? "bg-emerald/10 border-emerald/20"
              : result.type === "already_checked_in"
              ? "bg-gold/10 border-gold/20"
              : "bg-coral/10 border-coral/20"
          }`}
        >
          {result.type === "success" && (
            <>
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="10" cy="10" r="9" />
                <path d="M6 10l2.5 2.5 5.5-5.5" />
              </svg>
              <div>
                <p className="text-sm font-bold text-emerald">Checked In!</p>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Code: <span className="font-mono text-white">{result.ticket_code}</span>
                </p>
                {result.section_name && (
                  <p className="text-xs text-txt-secondary">
                    Section: {result.section_name}
                  </p>
                )}
              </div>
            </>
          )}
          {result.type === "already_checked_in" && (
            <>
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#D4A843"
                strokeWidth="2"
                strokeLinecap="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="10" cy="10" r="9" />
                <path d="M10 6v4M10 14h.01" />
              </svg>
              <div>
                <p className="text-sm font-bold text-gold">Already Checked In</p>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Code: <span className="font-mono text-white">{result.ticket_code}</span>
                </p>
                <p className="text-xs text-txt-secondary">
                  At {new Date(result.checked_in_at).toLocaleTimeString()}
                </p>
              </div>
            </>
          )}
          {result.type === "invalid" && (
            <>
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="10" cy="10" r="9" />
                <path d="M7 7l6 6M13 7l-6 6" />
              </svg>
              <div>
                <p className="text-sm font-bold text-coral">Invalid Ticket</p>
                <p className="text-xs text-txt-secondary mt-0.5">{result.message}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* QR Scanner */}
      {mode === "qr" && (
        <Card padding={false} className="overflow-hidden">
          <div ref={scannerContainerRef} id="qr-scanner-container" className="w-full" />
          <p className="text-xs text-txt-secondary text-center py-3 border-t border-border-subtle">
            Point camera at ticket QR code to scan
          </p>
        </Card>
      )}

      {/* Manual Entry */}
      {mode === "manual" && (
        <Card>
          <label className="block mb-2">
            <span className="text-xs text-txt-secondary font-semibold uppercase tracking-wider">
              Enter Ticket Code
            </span>
          </label>
          <input
            type="text"
            value={manualCode}
            onChange={(e) =>
              setManualCode(e.target.value.toUpperCase().slice(0, 12))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCode(manualCode);
            }}
            placeholder="e.g. ABCD1234"
            maxLength={12}
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full bg-deep border border-border-subtle rounded-xl px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-gold placeholder:text-txt-secondary/30 placeholder:text-base placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-gold/40 transition-colors mb-4"
          />
          <Button
            fullWidth
            onClick={() => submitCode(manualCode)}
            loading={processing}
            disabled={!manualCode.trim() || processing}
          >
            Check In
          </Button>
        </Card>
      )}
    </div>
  );
}
