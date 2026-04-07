import clsx from "clsx";

interface MagazineGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function MagazineGrid({ children, className }: MagazineGridProps) {
  return (
    <div
      className={clsx(
        "grid grid-cols-2 gap-3",
        "[&>*:first-child]:col-span-2",
        className
      )}
    >
      {children}
    </div>
  );
}
