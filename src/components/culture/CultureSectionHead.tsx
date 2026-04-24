import { ReactNode } from "react";

interface CultureSectionHeadProps {
  /** Kicker above the title, e.g. "§ TONIGHT · 04.23" */
  kicker?: string;
  /** Stamped Anton title. Render as string OR JSX for manual line breaks. */
  title: ReactNode;
  /** Controls type scale: display (biggest), hero (default), title (smaller). */
  size?: "display" | "hero" | "title";
  /** Inline children below the title (e.g. a "see all" link). */
  children?: ReactNode;
  /** Optional className merged onto the outer wrapper. */
  className?: string;
}

/**
 * CultureSectionHead — kicker + stamped title pattern that anchors every
 * in-content section in the Culture design. Reused on Home, Culture Mag,
 * Food Browse, Profile, Dashboard, Stream Hub, etc.
 *
 * Default padding matches culture-core.jsx (24px top, 18px x, 12px bottom)
 * and can be overridden via className.
 *
 * Design spec: culture-core.jsx · SectionHead
 */
export default function CultureSectionHead({
  kicker,
  title,
  size = "hero",
  children,
  className = "",
}: CultureSectionHeadProps) {
  const cls =
    size === "display" ? "c-display" : size === "title" ? "c-title" : "c-hero";

  return (
    <div className={`px-[18px] pt-6 pb-3 ${className}`}>
      {kicker && (
        <div className="c-kicker mb-1.5" style={{ marginBottom: 6 }}>
          {kicker}
        </div>
      )}
      <div
        className={cls}
        style={{ maxWidth: "100%", textWrap: "pretty" as const }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
