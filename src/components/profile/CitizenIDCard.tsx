"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface CitizenIDCardProps {
  avatarUrl?: string | null;
  displayName: string;
  handle: string;
  district?: number | null;
  memberSince?: string | null;
  isVerified: boolean;
  role?: string;
  profileUrl: string;
}

/**
 * Citizen ID — rebuilt as a printed press-pass ticket on the Culture
 * canvas. Ink body, gold foil bar, 3px ink frame, hard corners, Anton
 * name, DM Mono meta, gold QR on ink. No more purple holo gradient.
 */
export default function CitizenIDCard({
  avatarUrl,
  displayName,
  handle,
  district,
  memberSince,
  isVerified,
  role,
  profileUrl,
}: CitizenIDCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(profileUrl, {
      width: 120,
      margin: 1,
      // QR in gold on transparent so it reads on the ink panel
      color: { dark: "#F2A900", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [profileUrl]);

  const roleBadge =
    role && role !== "citizen"
      ? role.replace("_", " ").toUpperCase()
      : null;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: "var(--ink-strong)",
        border: "3px solid var(--rule-strong-c)",
      }}
    >
      {/* Gold foil bar top */}
      <div style={{ height: 4, background: "var(--gold-c)" }} />

      <div className="px-5 pt-4 pb-5">
        {/* Header row */}
        <div
          className="flex items-start justify-between mb-4 pb-2"
          style={{ borderBottom: "2px solid var(--gold-c)" }}
        >
          <div>
            <h3
              className="c-kicker"
              style={{ fontSize: 10, letterSpacing: "0.24em", color: "var(--gold-c)" }}
            >
              § HUB CITY · PRESS PASS
            </h3>
            <p
              className="c-serif-it mt-1"
              style={{ fontSize: 11, color: "var(--paper)", opacity: 0.7 }}
            >
              Culture in your pocket.
            </p>
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--gold-c)",
              color: "var(--ink-strong)",
              fontFamily: "var(--font-anton), Anton, Impact, sans-serif",
              fontSize: 14,
              letterSpacing: "-0.02em",
            }}
          >
            HC
          </div>
        </div>

        {/* Photo + Info row */}
        <div className="flex gap-4 mb-4">
          <div
            className="w-[68px] h-[68px] overflow-hidden shrink-0"
            style={{
              background: "var(--gold-c)",
              border: "3px solid var(--paper)",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ color: "var(--ink-strong)" }}
              >
                <span
                  className="c-hero"
                  style={{ fontSize: 30, lineHeight: 1 }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <h4
              className="c-hero truncate"
              style={{ fontSize: 22, lineHeight: 1, color: "var(--paper)" }}
            >
              {displayName}
            </h4>
            <p
              className="c-kicker mt-1 truncate"
              style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
            >
              {handle.toUpperCase()}
            </p>
            {district && (
              <p
                className="c-kicker mt-1"
                style={{ fontSize: 9, color: "var(--paper)", opacity: 0.75 }}
              >
                DISTRICT {district}
              </p>
            )}
            {roleBadge && (
              <span
                className="inline-block mt-2 c-kicker px-2"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.16em",
                  background: "var(--gold-c)",
                  color: "var(--ink-strong)",
                  border: "1.5px solid var(--paper)",
                  padding: "2px 8px",
                }}
              >
                {roleBadge}
              </span>
            )}
          </div>
        </div>

        {/* Bottom row: QR + meta */}
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-3">
            <div
              className="w-14 h-14 flex items-center justify-center shrink-0"
              style={{
                background: "rgba(245,239,224,0.06)",
                border: "2px solid var(--gold-c)",
                padding: 2,
              }}
            >
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: "var(--gold-c)", opacity: 0.6 }}>
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="14" width="4" height="4" rx="0.5" fill="currentColor" />
                </svg>
              )}
            </div>
            <div>
              {memberSince && (
                <>
                  <p
                    className="c-kicker"
                    style={{ fontSize: 8, color: "var(--paper)", opacity: 0.55, letterSpacing: "0.18em" }}
                  >
                    MEMBER SINCE
                  </p>
                  <p
                    className="c-card-t mt-0.5"
                    style={{ fontSize: 12, color: "var(--paper)" }}
                  >
                    {memberSince}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            {isVerified ? (
              <div className="flex items-center gap-1 justify-end">
                <span
                  className="c-kicker"
                  style={{ fontSize: 10, color: "var(--gold-c)", letterSpacing: "0.14em" }}
                >
                  VERIFIED RESIDENT
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: "var(--gold-c)" }}>
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            ) : (
              <span
                className="c-kicker"
                style={{ fontSize: 9, color: "var(--paper)", opacity: 0.6, letterSpacing: "0.14em" }}
              >
                CULTURE RESIDENT
              </span>
            )}
          </div>
        </div>

        {/* Profile URL footer */}
        <div
          className="mt-3 pt-2"
          style={{ borderTop: "1px dashed var(--gold-c)", opacity: 0.8 }}
        >
          <p
            className="text-center tabular-nums"
            style={{
              fontSize: 9,
              color: "var(--paper)",
              opacity: 0.5,
              fontFamily: "var(--font-dm-mono), monospace",
              letterSpacing: "0.1em",
            }}
          >
            {profileUrl.replace("https://", "")}
          </p>
        </div>
      </div>
    </div>
  );
}
