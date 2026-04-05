"use client";

import { motion } from "motion/react";
import clsx from "clsx";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pill";
}

export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
}: TabsProps) {
  return (
    <div
      className={clsx(
        "flex gap-1",
        variant === "underline" && "border-b border-border-subtle"
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
              variant === "underline" && [
                isActive ? "text-gold" : "text-txt-secondary hover:text-txt-primary",
              ],
              variant === "pill" && [
                "rounded-full",
                isActive
                  ? "text-gold"
                  : "text-txt-secondary hover:text-txt-primary",
              ]
            )}
          >
            {tab.label}

            {/* Underline indicator */}
            {variant === "underline" && isActive && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}

            {/* Pill indicator */}
            {variant === "pill" && isActive && (
              <motion.div
                layoutId="tab-pill"
                className="absolute inset-0 bg-gold/10 rounded-full -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
