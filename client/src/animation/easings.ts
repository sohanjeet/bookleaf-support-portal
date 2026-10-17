// GSAP easing + duration vocabulary. Mirrors motion.ts (framer-motion) in feel:
// calm, decelerating, never springy. Seconds, as GSAP expects.
export const ease = {
  out: 'power2.out',
  outStrong: 'power3.out',
  inOut: 'power2.inOut',
  in: 'power2.in'
} as const;

export const dur = { fast: 0.18, base: 0.3, reveal: 0.5, exit: 0.3 } as const;
