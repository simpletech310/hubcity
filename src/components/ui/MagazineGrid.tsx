import clsx from "clsx";

type Variant = "default" | "featured-4" | "columns-3" | "staggered-5" | "mosaic";

const variantClass: Record<Variant, string> = {
  // 2-col with first child spanning the row — original creators-layout default
  default: "grid grid-cols-2 gap-3 [&>*:first-child]:col-span-2",

  // 1 hero (2x2) + 4 smaller = 3-col asymmetric
  "featured-4":
    "grid grid-cols-3 gap-2 [&>*:first-child]:col-span-2 [&>*:first-child]:row-span-2",

  // Editorial 3-column grid
  "columns-3": "grid grid-cols-3 gap-3",

  // Staggered 5 — center column pushed down for a print-layout effect
  "staggered-5":
    "grid grid-cols-3 gap-3 [&>*:nth-child(2)]:translate-y-6 [&>*:nth-child(5)]:translate-y-6",

  // Mosaic — mixed heights, 2-col, child:nth-child(odd) taller
  mosaic: "grid grid-cols-2 gap-2 [&>*:nth-child(odd)]:row-span-2",
};

interface MagazineGridProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export default function MagazineGrid({
  children,
  variant = "default",
  className,
}: MagazineGridProps) {
  return <div className={clsx(variantClass[variant], className)}>{children}</div>;
}
