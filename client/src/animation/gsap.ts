// Single entry point for GSAP. Components import { gsap } from here, never from 'gsap'
// directly, so defaults and reduced-motion handling stay in one place.
// Responsibility split: framer-motion owns React state/UI transitions (motion.ts);
// GSAP owns branded loader, coordinated timelines and scroll storytelling.
import { gsap } from 'gsap';
import { dur, ease } from './easings';

gsap.defaults({ ease: ease.out, duration: dur.base });

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap };
