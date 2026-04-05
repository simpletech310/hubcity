import Image from "next/image";
import clsx from "clsx";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  role?: string;
  showBadge?: boolean;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
};

const textSizeMap = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
};

const badgeColorMap: Record<string, string> = {
  official: "bg-gold",
  business: "bg-cyan",
  admin: "bg-coral",
  moderator: "bg-emerald",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Deterministic gradient from name
function getGradient(name: string): string {
  const gradients = [
    "from-gold/60 to-gold-light/40",
    "from-cyan/60 to-cyan/30",
    "from-emerald/60 to-emerald/30",
    "from-coral/60 to-coral/30",
    "from-purple-500/60 to-purple-400/30",
    "from-amber-500/60 to-orange-400/30",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

export default function Avatar({
  src,
  name,
  size = "md",
  role,
  showBadge = false,
}: AvatarProps) {
  const px = sizeMap[size];

  return (
    <div className="relative inline-flex flex-shrink-0" style={{ width: px, height: px }}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={px}
          height={px}
          className="rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : (
        <div
          className={clsx(
            "rounded-full flex items-center justify-center bg-gradient-to-br font-semibold text-white",
            getGradient(name),
            textSizeMap[size]
          )}
          style={{ width: px, height: px }}
        >
          {getInitials(name)}
        </div>
      )}

      {showBadge && role && badgeColorMap[role] && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 rounded-full border-2 border-deep",
            badgeColorMap[role],
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3"
          )}
        />
      )}
    </div>
  );
}
