"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import clsx from "clsx";

type TimelineItem = {
  year: string;
  title: string;
  description: string;
  color?: string;
};

interface TimelineViewProps {
  items: TimelineItem[];
}

function TimelineEntry({
  item,
  index,
}: {
  item: TimelineItem;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isLeft = index % 2 === 0;
  const accentColor = item.color || "var(--color-gold, #C5A04E)";

  return (
    <div
      ref={ref}
      className={clsx(
        "relative flex items-start gap-6 md:gap-12",
        isLeft ? "md:flex-row" : "md:flex-row-reverse",
        "flex-row"
      )}
    >
      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
        animate={isInView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={clsx(
          "flex-1 bg-card rounded-2xl border border-border-subtle p-5 md:p-6",
          isLeft ? "md:text-right" : "md:text-left",
          "text-left"
        )}
      >
        <span
          className="font-heading text-3xl md:text-4xl font-bold block mb-1"
          style={{ color: accentColor }}
        >
          {item.year}
        </span>
        <h3 className="font-display text-lg md:text-xl text-text-primary mb-2">
          {item.title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {item.description}
        </p>
      </motion.div>

      {/* Center dot (visible on md+) */}
      <div className="hidden md:flex flex-col items-center shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="w-4 h-4 rounded-full border-2 border-gold"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </div>
  );
}

export default function TimelineView({ items }: TimelineViewProps) {
  return (
    <div className="relative">
      {/* Vertical gold line (md+ only) */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gold/30 -translate-x-1/2" />

      <div className="space-y-8 md:space-y-12">
        {items.map((item, i) => (
          <TimelineEntry key={item.year} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

export type { TimelineItem };
