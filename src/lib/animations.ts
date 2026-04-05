import type { Transition, Variants } from "motion";

// ─── Spring configs ───────────────────────────────────────────
export const SPRING = {
  gentle: { type: "spring", stiffness: 120, damping: 20, mass: 1 } as Transition,
  bouncy: { type: "spring", stiffness: 300, damping: 15, mass: 0.8 } as Transition,
  stiff: { type: "spring", stiffness: 400, damping: 30, mass: 0.6 } as Transition,
  slow: { type: "spring", stiffness: 80, damping: 20, mass: 1.2 } as Transition,
};

// ─── Easing curves ────────────────────────────────────────────
export const EASE = {
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeIn: [0.55, 0.055, 0.675, 0.19] as [number, number, number, number],
  easeInOut: [0.77, 0, 0.175, 1] as [number, number, number, number],
  smooth: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

// ─── Directional entrances ────────────────────────────────────
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING.gentle,
  },
  exit: { opacity: 0, y: 12, transition: { duration: 0.2 } },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING.gentle,
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING.gentle,
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: SPRING.gentle,
  },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

// ─── Scale variants (modals / cards) ──────────────────────────
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: SPRING.bouncy,
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

export const scaleOut: Variants = {
  hidden: { opacity: 1, scale: 1 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.2 } },
};

// ─── Stagger helpers ──────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: SPRING.gentle,
  },
};

// ─── Page transition ──────────────────────────────────────────
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE.easeOut },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

// ─── Spring bounce (celebration) ──────────────────────────────
export const springBounce: Variants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 12, mass: 0.6 },
  },
};

// ─── Slide up (drawers / bottom sheets) ───────────────────────
export const slideUp: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: SPRING.gentle,
  },
  exit: { y: "100%", transition: { duration: 0.25, ease: EASE.easeIn } },
};
