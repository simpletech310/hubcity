import clsx from "clsx";

interface EditorialHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export default function EditorialHeader({
  kicker,
  title,
  subtitle,
  align = "left",
  className,
}: EditorialHeaderProps) {
  return (
    <div className={clsx(align === "center" && "text-center", className)}>
      {kicker && (
        <div className={clsx("flex items-center gap-2 mb-2", align === "center" && "justify-center")}>
          <div className="w-[2px] h-4 bg-gold rounded-full" />
          <span className="editorial-kicker">{kicker}</span>
        </div>
      )}
      <h2 className="font-display text-3xl text-white leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-txt-secondary mt-2 max-w-md leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
