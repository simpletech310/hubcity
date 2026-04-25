import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  linkText?: string;
  linkHref?: string;
  linkColor?: string;
  compact?: boolean;
  icon?: React.ReactNode;
}

export default function SectionHeader({
  title,
  subtitle,
  linkText,
  linkHref,
  linkColor,
  compact = false,
  icon,
}: SectionHeaderProps) {
  return (
    <div
      className={`flex items-end justify-between ${compact ? "mb-3" : "px-5 mb-4"}`}
    >
      <div>
        <div className="flex items-center gap-2">
          {icon}
          <h2
            className={`font-heading font-bold tracking-tight ${compact ? "text-base" : "text-[20px]"}`}
            style={{ color: "var(--ink-strong)" }}
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-[13px] mt-0.5" style={{ color: "var(--ink-soft)" }}>{subtitle}</p>
        )}
      </div>
      {linkText && linkHref && (
        <Link
          href={linkHref}
          className={`text-[12px] font-semibold hover:opacity-80 transition-opacity flex items-center gap-1 shrink-0 ${linkColor || "text-gold"}`}
        >
          {linkText}
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 3l4 4-4 4" />
          </svg>
        </Link>
      )}
    </div>
  );
}
