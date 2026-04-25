"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink-mute)" }}>
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={clsx(
          "w-full flex items-center justify-between gap-2",
          "px-4 py-2.5 rounded-xl text-sm",
          "transition-colors cursor-pointer",
          "focus:outline-none",
          isOpen && "border-gold/40"
        )}
        style={{
          background: "var(--paper)",
          color: "var(--ink-strong)",
          border: "2px solid var(--rule-strong-c)",
        }}
      >
        <span style={!selected ? { color: "var(--ink-mute)" } : undefined}>
          {selected ? selected.label : placeholder}
        </span>

        {/* Chevron */}
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="flex-shrink-0"
          style={{ color: "var(--ink-mute)" }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M6 9l6 6 6-6" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className={clsx(
              "absolute z-50 mt-1.5 w-full",
              "rounded-xl",
              "shadow-2xl overflow-hidden py-1"
            )}
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer",
                      isSelected
                        ? "text-gold bg-gold/5"
                        : "hover:bg-black/5"
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
