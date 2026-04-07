import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface MuseumWingCardProps {
  href: string;
  icon: string;
  title: string;
  subtitle: string;
  count?: number;
  gradient?: string;
}

export default function MuseumWingCard({
  href,
  icon,
  title,
  subtitle,
  count,
  gradient = "from-white/[0.04] to-white/[0.02]",
}: MuseumWingCardProps) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl bg-gradient-to-br ${gradient} border border-border-subtle p-4 card-glow transition-all duration-300 hover:border-gold/20`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon name={icon as IconName} size={24} />
        {typeof count === "number" && (
          <span className="text-[10px] font-semibold text-txt-secondary bg-white/5 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <h3 className="font-heading font-bold text-sm text-white group-hover:text-gold transition-colors">
        {title}
      </h3>
      <p className="text-[11px] text-txt-secondary mt-0.5 leading-relaxed">
        {subtitle}
      </p>
    </Link>
  );
}
