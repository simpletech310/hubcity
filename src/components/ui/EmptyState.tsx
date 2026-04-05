"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import { fadeInUp } from "@/lib/animations";
import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      {icon && (
        <span className="text-5xl mb-4" role="img" aria-hidden>
          {icon}
        </span>
      )}

      <h3 className="text-lg font-semibold text-txt-primary mb-1">{title}</h3>

      {description && (
        <p className="text-sm text-txt-secondary max-w-xs">{description}</p>
      )}

      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className={clsx(
                "inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-gradient-to-r from-gold to-gold-light text-midnight",
                "hover:opacity-90 transition-opacity press"
              )}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={clsx(
                "inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-gradient-to-r from-gold to-gold-light text-midnight",
                "hover:opacity-90 transition-opacity press cursor-pointer"
              )}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
