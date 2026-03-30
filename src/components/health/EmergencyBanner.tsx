import Link from "next/link";

export default function EmergencyBanner() {
  return (
    <div className="mx-5 mb-5 rounded-2xl bg-gradient-to-r from-red-600/30 to-coral/20 border border-red-500/30 p-4 relative overflow-hidden">
      {/* Pulsing accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-coral to-red-500" />

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
          <span className="text-2xl">🚨</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-red-400 mb-0.5">
            Emergency? Call 911
          </p>
          <p className="text-[11px] text-txt-secondary leading-relaxed">
            Crisis hotline:{" "}
            <a href="tel:988" className="text-gold font-semibold">
              988
            </a>{" "}
            (Suicide & Crisis Lifeline)
          </p>
        </div>
        <a
          href="tel:911"
          className="shrink-0 bg-red-500 text-white px-4 py-2.5 rounded-full text-xs font-bold press hover:bg-red-400 transition-colors"
        >
          Call 911
        </a>
      </div>

      <Link
        href="/health/emergency"
        className="flex items-center justify-center gap-1.5 mt-3 pt-3 border-t border-red-500/20 text-[11px] text-red-400 font-semibold"
      >
        View all emergency resources
        <svg
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M4 2l4 4-4 4" />
        </svg>
      </Link>
    </div>
  );
}
