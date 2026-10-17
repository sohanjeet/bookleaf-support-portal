import { gsap } from './gsap';
import { useGsapScope } from './useGsapContext';

// One authored moment: the floating shell composes itself (mark, imprint, dotted rule, nav,
// context bar, identity) in ~600ms. Runs once per page load.
// Ownership: GSAP only touches the [data-enter] wrappers below.
// framer-motion owns the active highlight (.nav-highlight) and the mobile drawer — never these.
let played = false;

export function useShellEntrance() {
  return useGsapScope<HTMLDivElement>(({ q, reduced }) => {
    if (reduced || played) return;

    const tl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      onComplete: () => {
        played = true;
        gsap.set(q('[data-enter]'), { clearProps: 'all' });
      }
    });

    tl.from(q('[data-enter="mark"]'), { scale: 0.96, autoAlpha: 0, duration: 0.3 }, 0)
      .from(q('[data-enter="brand-text"]'), { x: -8, autoAlpha: 0, duration: 0.3 }, 0.06)
      .from(q('[data-enter="rule"]'), { scaleX: 0, transformOrigin: 'left center', duration: 0.42 }, 0.12)
      .from(q('[data-enter="nav-item"]'), { x: -4, autoAlpha: 0, duration: 0.26, stagger: 0.04 }, 0.2)
      .from(q('[data-enter="context"]'), { y: -5, autoAlpha: 0, duration: 0.3 }, 0.2)
      .from(q('[data-enter="identity"]'), { autoAlpha: 0, duration: 0.25 }, 0.4);
  }, []);
}
