import clsx from "clsx";

type Variant = "glass" | "ink" | "paper";
type Border = "none" | "subtle" | "gold";

const variantClass: Record<Variant, string> = {
  glass: "glass-card-elevated",
  ink: "panel-editorial",
  paper: "panel-paper",
};

const borderClass: Record<Border, string> = {
  none: "",
  subtle: "border border-white/[0.06]",
  gold: "border border-gold/20",
};

export default function EditorialCard({
  variant = "glass",
  border = "subtle",
  grain = false,
  rounded = "rounded-2xl",
  className,
  children,
}: {
  variant?: Variant;
  border?: Border;
  grain?: boolean;
  rounded?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden",
        rounded,
        variantClass[variant],
        borderClass[border],
        grain && "grain-overlay",
        className
      )}
    >
      {children}
    </div>
  );
}
