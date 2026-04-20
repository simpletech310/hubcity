import clsx from "clsx";

type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, string> = {
  sm: "text-[18px]",
  md: "text-[22px]",
  lg: "text-[34px]",
};

export default function EditorialNumber({
  n,
  size = "md",
  className,
  prefix = "№",
}: {
  n: number;
  size?: Size;
  className?: string;
  prefix?: "№" | "No." | "";
}) {
  const label = String(n).padStart(2, "0");
  return (
    <span
      className={clsx(
        "font-display text-gold leading-none tabular-nums",
        sizeMap[size],
        className
      )}
    >
      {prefix}
      {prefix ? " " : ""}
      {label}
    </span>
  );
}
