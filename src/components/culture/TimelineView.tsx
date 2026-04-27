"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";

type TimelineItem = {
  year: string;
  title: string;
  description: string;
  color?: string;
};

interface TimelineViewProps {
  items: TimelineItem[];
}

/**
 * Hub City editorial timeline. Each entry is a paper-warm card framed
 * in 2px ink rule. The year sits as a big gold Anton header; the title
 * uses c-card-t and the body c-body Inter. A vertical ink rule with a
 * gold dot marker connects the entries.
 *
 * Was previously rendering with `bg-card border-border-subtle text-
 * text-primary` Tailwind tokens — those map to a dark theme so the
 * boxes appeared as black bricks with only the year visible.
 */
function TimelineEntry({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const accent = item.color || "var(--gold-c)";

  return (
    <div ref={ref} className="relative pl-8">
      {/* Vertical rule + dot */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center pointer-events-none">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="shrink-0"
          style={{
            width: 12,
            height: 12,
            background: accent,
            border: "2px solid var(--ink-strong)",
            marginTop: 14,
          }}
        />
        {!isLast && (
          <div
            className="flex-1"
            style={{
              width: 2,
              background: "var(--rule-strong-c)",
              marginTop: 4,
            }}
          />
        )}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="overflow-hidden mb-6"
        style={{
          background: "var(--paper-warm)",
          border: "2px solid var(--rule-strong-c)",
          padding: "16px 16px 18px",
        }}
      >
        <span
          className="c-display tabular-nums"
          style={{
            fontSize: 30,
            lineHeight: 0.95,
            letterSpacing: "-0.012em",
            color: accent,
            display: "block",
          }}
        >
          {item.year}
        </span>
        <h3
          className="c-card-t mt-2"
          style={{
            fontSize: 16,
            lineHeight: 1.2,
            color: "var(--ink-strong)",
          }}
        >
          {item.title}
        </h3>
        <p
          className="c-body mt-2"
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "var(--ink-strong)",
            opacity: 0.85,
          }}
        >
          {item.description}
        </p>
      </motion.div>
    </div>
  );
}

export default function TimelineView({ items }: TimelineViewProps) {
  return (
    <div className="relative">
      {items.map((item, i) => (
        <TimelineEntry
          key={`${item.year}-${i}`}
          item={item}
          isLast={i === items.length - 1}
        />
      ))}
    </div>
  );
}

export type { TimelineItem };
