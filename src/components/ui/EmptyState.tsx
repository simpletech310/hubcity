"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import { fadeInUp } from "@/lib/animations";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

interface EmptyStateProps {
  icon?: string;
  iconName?: IconName;
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
  iconName,
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
      {iconName ? (
        <div className="w-16 h-16 rounded-full glass-card-elevated flex items-center justify-center mb-4">
          <Icon name={iconName} size={28} className="text-white/40" />
        </div>
      ) : icon ? (
        <span className="text-5xl mb-4" role="img" aria-hidden>
          {icon}
        </span>
      ) : null}

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
