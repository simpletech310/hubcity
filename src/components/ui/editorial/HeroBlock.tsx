import clsx from "clsx";

type Aspect = "4/5" | "16/9" | "1/1" | "3/2";

const aspectMap: Record<Aspect, string> = {
  "4/5": "aspect-[4/5]",
  "16/9": "aspect-[16/9]",
  "1/1": "aspect-square",
  "3/2": "aspect-[3/2]",
};

/**
 * Cinematic hero block — dark vignette, paper-grain overlay, gold crop-mark
 * ticks. Slots: `topRight` / `bottomLeft` / `bottomRight` for placing a
 * title, tags, byline, CTA, etc. directly on the image.
 */
export default function HeroBlock({
  image,
  aspect = "4/5",
  alt = "",
  grain = true,
  ticks = true,
  className,
  children,
}: {
  image?: string | null;
  aspect?: Aspect;
  alt?: string;
  grain?: boolean;
  ticks?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden bg-ink",
        aspectMap[aspect],
        className
      )}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-midnight to-black" />
      )}

      {/* Duotone vignette — ties everything back to the black canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0)_0%,rgba(0,0,0,0.6)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black via-black/80 to-transparent" />

      {grain && (
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
          }}
        />
      )}

      {ticks && (
        <>
          {/* Top-left tick */}
          <svg
            width="22"
            height="22"
            className="absolute top-4 left-4 text-gold/70 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M2 8 V2 H8" />
          </svg>
          {/* Top-right tick */}
          <svg
            width="22"
            height="22"
            className="absolute top-4 right-4 text-gold/70 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M14 2 H20 V8" />
          </svg>
          {/* Bottom-left tick */}
          <svg
            width="22"
            height="22"
            className="absolute bottom-4 left-4 text-gold/50 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M2 14 V20 H8" />
          </svg>
          {/* Bottom-right tick */}
          <svg
            width="22"
            height="22"
            className="absolute bottom-4 right-4 text-gold/50 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M20 14 V20 H14" />
          </svg>
        </>
      )}

      {children}
    </div>
  );
}
