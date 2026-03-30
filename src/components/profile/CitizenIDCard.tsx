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
      color: { dark: "#D4A017", light: "#00000000" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [profileUrl]);

  const roleBadge =
    role && role !== "citizen"
      ? role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
      : null;

  return (
    <div
      className="group perspective-[1000px]"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden border border-gold/20 shadow-xl shadow-gold/10 transition-transform duration-500 ease-out group-hover:[transform:rotateY(-3deg)_rotateX(2deg)] will-change-transform"
        style={{
          background: "linear-gradient(135deg, #0A0A0F 0%, #141420 40%, #1A1A2E 70%, #0A0A0F 100%)",
        }}
      >
        {/* Gold foil strip top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        {/* Card padding */}
        <div className="px-5 pt-4 pb-5">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3
                className="font-heading font-bold text-[11px] tracking-[0.25em] uppercase"
                style={{ color: "#D4A017" }}
              >
                Hub City
              </h3>
              <div className="h-px w-16 bg-gradient-to-r from-gold/60 to-transparent mt-1" />
            </div>
            {/* Star emblem */}
            <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
                <path
                  d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
                  fill="currentColor"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>

          {/* Photo + Info row */}
          <div className="flex gap-4 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-[68px] h-[68px] rounded-xl overflow-hidden border-2 border-gold/30 shadow-md shadow-gold/10">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <span className="font-heading font-bold text-2xl text-gold">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name + details */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="font-heading font-bold text-base text-white leading-tight truncate">
                {displayName}
              </h4>
              <p className="text-[11px] text-txt-secondary mb-1.5 truncate">
                {handle}
              </p>
              {district && (
                <p className="text-[10px] text-gold/80 font-semibold">
                  District {district}
                </p>
              )}
              {roleBadge && (
                <span className="inline-block mt-1 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-hc-purple/15 text-hc-purple border border-hc-purple/20">
                  {roleBadge}
                </span>
              )}
            </div>
          </div>

          {/* Bottom row: QR + meta */}
          <div className="flex items-end justify-between">
            {/* QR + Member since */}
            <div className="flex items-end gap-3">
              {/* QR Code */}
              <div className="w-14 h-14 rounded-lg bg-white/[0.04] border border-gold/10 p-1 flex items-center justify-center shrink-0">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full rounded bg-white/5 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold/30">
                      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="14" y="14" width="4" height="4" rx="0.5" fill="currentColor" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                {memberSince && (
                  <>
                    <p className="text-[8px] text-txt-secondary/50 uppercase tracking-wider font-semibold">
                      Member Since
                    </p>
                    <p className="text-[11px] text-white/80 font-medium">
                      {memberSince}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Verification status */}
            <div className="text-right">
              {isVerified ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-emerald">
                    Verified Resident
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-emerald">
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-gold/60">
                  Hub City Resident
                </span>
              )}
            </div>
          </div>

          {/* Profile URL footer */}
          <div className="mt-3 pt-2 border-t border-white/[0.06]">
            <p className="text-[9px] text-txt-secondary/40 text-center font-mono tracking-wider">
              {profileUrl.replace("https://", "")}
            </p>
          </div>
        </div>

        {/* Holographic shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] via-transparent to-hc-purple/[0.03] pointer-events-none" />

        {/* Corner cut pattern */}
        <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-6 -right-6 w-12 h-12 rotate-45"
            style={{ background: "linear-gradient(135deg, transparent 50%, rgba(212, 160, 23, 0.05) 50%)" }}
          />
        </div>
      </div>
    </div>
  );
}
