"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const THRESHOLD = 80;

export default function PullToRefresh({
  onRefresh,
  children,
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const spinnerOpacity = useTransform(y, [0, THRESHOLD / 2, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(y, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(y, [0, THRESHOLD * 2], [0, 360]);

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (info.offset.y >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    },
    [onRefresh, refreshing]
  );

  return (
    <div className="relative overflow-hidden">
      {/* Spinner indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 pointer-events-none z-10"
        style={{ opacity: spinnerOpacity }}
      >
        <motion.div
          style={{ scale: spinnerScale, rotate: refreshing ? undefined : spinnerRotate }}
          className={refreshing ? "animate-spin" : ""}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-gold"
          >
            <path d="M21 12a9 9 0 11-6.22-8.56" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        style={{ y }}
        drag={refreshing ? false : "y"}
        dragConstraints={{ top: 0, bottom: THRESHOLD + 20 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
