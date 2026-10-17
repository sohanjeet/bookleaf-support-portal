// BookLeaf motion language — one set of timings and easings shared by
// framer-motion call sites and the CSS tokens in index.css (--dur-*, --ease-*).
// Keep these in sync with :root in index.css.
import type { Transition, Variants } from 'framer-motion';

export const EASE = [0.16, 1, 0.3, 1] as const;

export const DUR = { fast: 0.15, base: 0.26, slow: 0.38 } as const;

export const tFast: Transition = { duration: DUR.fast, ease: EASE };
export const tBase: Transition = { duration: DUR.base, ease: EASE };
export const tSlow: Transition = { duration: DUR.slow, ease: EASE };

// Shared sliding-indicator spring (sidebar, KB nav). Snappy, no overshoot.
export const tIndicator: Transition = { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 };

// Sidebar active-row indicator: ~220ms, fast start, no overshoot.
export const tNavIndicator: Transition = { duration: 0.22, ease: [0.32, 0.72, 0, 1] };

// Editorial rail marker travelling between nav nodes: a calm glide, no overshoot.
export const tRailMarker: Transition = { duration: 0.32, ease: [0.32, 0.72, 0, 1] };

// Small fade + rise used for content entering the page.
export const rise: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: tBase },
  exit: { opacity: 0, y: -4, transition: { duration: DUR.fast, ease: EASE } }
};

// Dialog: backdrop fades, panel fades + scales slightly. Exit is shorter.
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DUR.base, ease: EASE } },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE } }
};

export const dialogVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: tSlow },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: DUR.fast, ease: EASE } }
};

// Collapsible content (accordion). Opacity leads, height follows; clipped, no layout jump.
export const collapseVariants: Variants = {
  closed: { height: 0, opacity: 0, transition: { height: tBase, opacity: { duration: DUR.fast } } },
  open: { height: 'auto', opacity: 1, transition: { height: tBase, opacity: { duration: DUR.base, delay: 0.04 } } }
};
