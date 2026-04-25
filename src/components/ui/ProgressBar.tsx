"use client";

import { motion } from "motion/react";
import clsx from "clsx";

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
  animate?: boolean;
}

export default function ProgressBar({
  value,
  color,
  height = 8,
  showLabel = false,
  animate = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-end mb-1">
          <span className="text-xs font-medium" style={{ color: "var(--ink-mute)" }}>
            {Math.round(clamped)}%
          </span>
        </div>
      )}
      <div
        className="w-full bg-royal rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={clsx(
            "h-full rounded-full",
            !color && "bg-gradient-to-r from-gold to-gold-light"
          )}
          style={color ? { backgroundColor: color } : undefined}
          initial={animate ? { width: 0 } : { width: `${clamped}%` }}
          animate={{ width: `${clamped}%` }}
          transition={
            animate
              ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0.3 }
          }
        />
      </div>
    </div>
  );
}
